import {Matrix} from './SDSMatrix';
import * as assert from 'assert';
import {SDSNode} from './SDSNode';
import {manageCurrentNode} from './manageCurrentNode';
import {arraysEqual, getArrayDepth} from './common';

// display service of the value of the current node


export class manageValues {

  // current Dico Node
  private curNode: manageCurrentNode; // to manage currentNode
  public currentNode: SDSNode; // application model

  constructor(cNode: SDSNode, cNodeMgt: manageCurrentNode) {
    this.currentNode = cNode;
    this.curNode = cNodeMgt;
  }

  getCurrentValue(i0?: number , j0?: number, node?): number[][]  {
    let currentNode = this.currentNode;
    if (node != null) {
      currentNode = node;
    }
    if (currentNode instanceof  Matrix) {
      return this.convertValueToNumberMatrix(currentNode.values, i0, j0);
    } else {
      return [];
    }
  }

  /*
    Updates the current node dimensions according to the provided value.
  */
  setCurrentDimensions(value, node?) {
    if (value) {
      let currentNode = this.currentNode;
      if (node != null) {
        currentNode = node;
      }
      if (currentNode && currentNode instanceof Matrix) {
        let dimensionsArray = this.getValueDimensions(value, node);
        if (dimensionsArray) {
          let currentNodeDimensions = currentNode.dimensions;
          for (let iter = 0; iter < dimensionsArray.length; iter++) {
            let dimension = dimensionsArray[iter];
            currentNodeDimensions[iter].size = dimension;
          }
        }
      }
    }
  }

  setCurrentValue(value, i0?: number , j0?: number, node?, type?) {
    if (value) {
      let currentNode = this.currentNode;
      if (node != null) {
        currentNode = node;
      }
      if (currentNode && currentNode instanceof  Matrix) {
        let dataType = this.getTypeOfValue(node, type);
        if (typeof currentNode.values === 'string') {
          let v = value;
          if (dataType == 'valuesVect') {
            v = value[0];
          }
          this.curNode.setCurrentNodeJsonValue(v);
          this.setCurrentDimensions(v, node);
        }
        else {
          if (dataType == 'valuesCube') {
            currentNode.values = this.convertNumberMatrixToValue(value, currentNode.values, i0);
          }
          else if (dataType == 'valuesHyperCube') {
            currentNode.values = this.convertNumberMatrixToValue(value, currentNode.values, i0, j0);
          }
          else {
            currentNode.values = this.convertNumberMatrixToValue(value);
          }
          this.setCurrentDimensions(currentNode.values, node);
        }
      }
    }
  }

  /*
    Checks the type of the provided current node values.
    It can be either a scalar or a vector or a matrix or a cube or an hypercube.
  */
  checkValueType(value) {
    let valueType = null;
    if (!value) {
      return null;
    }
    if (typeof value === 'number' ||
        typeof value === 'boolean') {
      /* Scalar */
      valueType = 'value';
    }
    else if (typeof value[0] === 'number' ||
             typeof value[0] === 'boolean') {
      /* Vector. */
      valueType = 'valuesVect';
    }
    else if (typeof value[0][0] === 'number' ||
             typeof value[0][0] === 'boolean') {
      /* Matrix. */
      valueType = 'valuesMatrix';
    }
    else if (typeof value[0][0][0] === 'number' ||
             typeof value[0][0][0] === 'boolean') {
      /* Cube. */
      valueType = 'valuesCube';
    }
    else {
      /* Hypercube. */
      valueType = 'valuesHyperCube';
    }

    return valueType;
  }

  // display service of the type of value of the current node
  // to display matrix, cube, hypercube
  getTypeOfValue(node?, type?): string {
    let res: string;
    if (type != null) {
      return type;
    }
    let currentNode = this.currentNode;
    if (node != null) {
      currentNode = node;
    }
    if (currentNode instanceof  Matrix) {
      if (typeof currentNode.values === 'string') {
        let jsonValues = this.curNode.getCurrentNodeJsonValue();
        res = this.checkValueType(jsonValues);
        if (!res) {
          res = 'undefined';
        }
      } else {
        res = this.checkValueType(currentNode.values);
        if (!res) {
          res = 'undefined';
        }
      }
    } else {
      res = 'undefined';
    }
    return res ;
  }
  // display service of length of a value dimension
  getValueDim(i: number, value?, node?): number {
    const dim: number[] = [0, 0, 0, 0];
    let v: any;
    assert(i > 0 && i <= 4 );
    // console.log('in getValueDim i =' + i );
    let currentNode = this.currentNode;
    if (node != null) {
      currentNode = node;
    }
    if (currentNode instanceof Matrix) {
      if (value) {
        v = value;
      }
      else {
        if (typeof currentNode.values === 'string') {
          v = this.curNode.getCurrentNodeJsonValue();
        } else {
          v = currentNode.values;
        }
      }
      let typeOfValue = this.getTypeOfValue(node);
      if (typeOfValue === 'valuesVect' ) {
        dim[0] = v.length;
      } else if (typeOfValue === 'valuesMatrix' ) {
        dim[0] = v[0].length;
        dim[1] = v.length;
      } else if (typeOfValue === 'valuesCube' ) {
        dim[0] = v[0][0].length;
        dim[1] = v[0].length;
        dim[2] = v.length;
      } else if (typeOfValue === 'valuesHyperCube' ) {
        dim[0] = v[0][0][0].length;
        dim[1] = v[0][0].length;
        dim[2] = v.length;
        dim[3] = v[0].length;
      }
    }
    // console.log('in getValueDim return =' + dim[i - 1]  );

    return dim[i - 1] ;
  }

  /*
    Computes an array with each structure dimensions based on the provided value.
  */
  getValueDimensions(value, node?) {
    let dimensionsArray = null;
    if (value) {
      let currentNode = this.currentNode;
      if (node != null) {
        currentNode = node;
      }
      if (currentNode && currentNode instanceof  Matrix) {
        dimensionsArray = new Array();
        /*
          The dimensions attribute may be undefined.
          In that case, create a dimension array of size 1.
        */
        let typeOfValue = this.getTypeOfValue(node);
        if (!currentNode.dimensions) {
          currentNode.dimensions = new Array();
          currentNode.dimensions.push({size: 1});
        }
        /*
          Sanity check:
          Align the size of the dimension property with
          the size of the provided value.
        */
        let depth = getArrayDepth(currentNode.values);
        let dimensionsCount = currentNode.dimensions.length;
        while (dimensionsCount != depth) {
          /*
            If the size of the dimension property is less than the value size,
            append a new item of size 1 (this value will be automatically updated later)
            in the dimension array.
            Else remove the last dimension array item.
          */
          if (dimensionsCount < depth) {
            currentNode.dimensions.push({size: 1});
          }
          else {
            currentNode.dimensions.splice(dimensionsCount-1, 1);
          }
          dimensionsCount = currentNode.dimensions.length;
        }
        /*
          If a scalar has a dimensions attribute, destroy it.
          This use case is mainly possible when transforming a vector into a scalar.
        */
        if (typeOfValue == 'value') {
          if (currentNode.dimensions) {
            delete currentNode.dimensions;
          }
        }
        if (currentNode.dimensions) {
          const dimensionsCount = currentNode.dimensions.length;
          for (let iter = 0; iter < dimensionsCount; iter++) {
            let dimension = this.getValueDim(iter+1, value, node);
            if (dimension) {
              dimensionsArray.push(dimension)
            }
          }
        }
      }
    }
    return dimensionsArray;
  }

  private convertValueToNumberMatrix(va: any, i0?: number , j0?: number): number[][] {
    // console.log('in convertValue va =' + va);
    // console.log('in convertValue i0=' + i0 + ' j0=' + j0);
    let v: any;
    let res: any[][];
    if (typeof va === 'string') {
      v = this.curNode.getCurrentNodeJsonValue();
    } else {
      v = va;
    }
    if (!v) {
      return null;
    }
    if (typeof v === 'number' ||
        typeof v === 'boolean') {
      res = [[v]];
    } else {
      // console.log('in convertValue v =' + v);
      if (typeof v[0] === 'number' ||
          typeof v[0] === 'boolean') { // Vector
        res = [v];
      } else if (typeof v[0][0] === 'number' ||
                 typeof v[0][0] === 'boolean') { // Matrix
        res = v;
      } else if (typeof v[0][0][0] === 'number' ||
                 typeof v[0][0][0] === 'boolean') { // cube
        if (i0 == null) {
          res = v;
        }
        else {
          res = v[i0];
        }
      } else if (typeof v[0][0][0][0] === 'number' ||
                 typeof v[0][0][0][0] === 'boolean') { // HyperCube
        if ((i0 == null) && (j0 == null)) {
          res = v;
        }
        else {
          res = v[i0][j0];
        }
      } else { // robustness behavior
        res = null;
      }
    }
    // console.log('in convertValue res =' + res);
    return res;
  }

  private convertNumberMatrixToValue(newValue, currentValue?, i0?: number , j0?: number) {
    let res = null;
    if (!newValue) {
      console.error("Provided an invalid value.");
      return res;
    }
    if (currentValue) {
      res = currentValue;
      let isArray = res instanceof Array;
      if (isArray) {
        if (i0 != null) {
          /*
            Cube use case.
            Put the res into a new array if it's not a cube.
          */
          let depth = getArrayDepth(res);
          if (depth < 3) {
            res = [res];
          }
          if (j0 != null) {
            /*
              Hypercube use case.
              Put the res into a new array if it's not an hypercube.
            */
            let depth = getArrayDepth(res);
            if (depth < 4) {
              res = [res];
            }
          }
          /*
            Sanity checks for the arrays dimensions.
            Mainly used when reshaping data structures (i.e cube to hypercube).
          */
          if (i0 == res.length && !(res[i0] instanceof Array)) {
            res[i0] = new Array();
          }
          if (j0 == null) {
            /*
              Cube use case.
              Updating the cube portion.
            */
            res[i0] = newValue;
          }
          else {
            /*
              Hypercube use case.
              Updating the hypercube portion.
            */
            let item = res[i0];
            if (item) {
              item[j0] = newValue;
            }
          }
        }
      }
    }
    else {
      res = newValue;
      let isArray = newValue instanceof Array;
      if (isArray) {
        let arrayLen = newValue.length;
        if (arrayLen <= 1) {
          let subArrayLen = newValue[0].length;
          if (subArrayLen > 1) {
            res = newValue[0];
          }
          else {
            res = newValue[0][0];
          }
        }
      }
    }
    return res;
  }
}
