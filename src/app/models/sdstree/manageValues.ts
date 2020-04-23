import {Matrix} from './SDSMatrix';
import * as assert from 'assert';
import {SDSNode} from './SDSNode';
import {manageCurrentNode} from './manageCurrentNode';

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

  setCurrentValue(value, i0?: number , j0?: number, node?) {
    if (value) {
      let currentNode = this.currentNode;
      if (node != null) {
        currentNode = node;
      }
      if (currentNode && currentNode instanceof  Matrix) {
        let dataType = this.getTypeOfValue(node);
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
  getTypeOfValue(node?): string {
    let res: string;
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
    if (currentNode instanceof  Matrix) {
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
        dim[2] = v[0].length;
        dim[3] = v.length;
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
          for (let iter = 0; iter < res.length; iter++) {
            let item = res[iter];
            if (iter < i0) {
              continue;
            }
            if (j0 == null) {
              res[iter] = newValue;
            }
            else {
              for (let iter2 = 0; iter2 < item.length; iter2++) {
                let item2 = item[iter2];
                if (iter2 < j0) {
                  continue;
                }
                res[iter][iter2] = newValue;
                break;
              }
            }
            break;
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
