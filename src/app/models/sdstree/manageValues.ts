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

  getCurrentValue(i0?: number , j0?: number): number[][]  {
    if (this.currentNode instanceof  Matrix) {
        return this.convertValueToNumberMatrix(this.currentNode.values, i0, j0);
    } else {
        return [];
    }
  }

  setCurrentValue(value, i0?: number , j0?: number) {
    if (value) {
      if (this.currentNode instanceof  Matrix) {
        if (typeof this.currentNode.values === 'string') {
          this.curNode.setCurrentNodeJsonValue(value);
        }
        else {
          let dataType = this.getTypeOfValue();
          if (dataType == 'valuesCube') {
            this.currentNode.values = this.convertNumberMatrixToValue(value, this.currentNode.values, i0);
          }
          else if (dataType == 'valuesHyperCube') {
            this.currentNode.values = this.convertNumberMatrixToValue(value, this.currentNode.values, i0, j0);
          }
          else {
            this.currentNode.values = this.convertNumberMatrixToValue(value);
          }
        }
      }
    }
  }

  // display service of the type of value of the current node
  // to display matrix, cube, hypercube
  getTypeOfValue(): string {
    let res: string;
    if (this.currentNode instanceof  Matrix) {
      if (typeof this.currentNode.values === 'string') {
        res = typeof this.curNode.getCurrentNodeJsonValue();
      } else {
        if (typeof this.currentNode.values === 'number' ||
            typeof this.currentNode.values === 'boolean') {
          // scalar
          res = 'value';
        } else {
          // console.log('in convertValue v =' + v);
          if (typeof this.currentNode.values[0] === 'number' ||
              typeof this.currentNode.values[0] === 'boolean') {
            res = 'valuesVect';
          } else if (typeof this.currentNode.values[0][0] === 'number' ||
                     typeof this.currentNode.values[0][0] === 'boolean') {
            res = 'valuesMatrix';
          } else if (typeof this.currentNode.values[0][0][0] === 'number' ||
                     typeof this.currentNode.values[0][0][0] === 'boolean') {
            res = 'valuesCube';
          } else {
            res = 'valuesHyperCube';
          }
        }
      }
    } else {
      res = 'undefined';
    }
    return res ;
  }
  // display service of length of a value dimension
  getValueDim(i: number): number {
    const dim: number[] = [0, 0, 0, 0];
    let v: any;
    assert(i > 0 && i <= 4 );
    // console.log('in getValueDim i =' + i );
    if (this.currentNode instanceof  Matrix) {
      if (typeof this.currentNode.values === 'string') {
        v = this.curNode.getCurrentNodeJsonValue();
      } else {
        v = this.currentNode.values;
      }
      if (this.getTypeOfValue() === 'valuesVect' ) {
        dim[0] = v.length;
      } else if (this.getTypeOfValue() === 'valuesMatrix' ) {
        dim[0] = v.length;
        dim[1] = v[0].length;
      } else if (this.getTypeOfValue() === 'valuesCube' ) {
        dim[0] = v.length;
        dim[1] = v[0].length;
        dim[2] = v[0][0].length;
      } else if (this.getTypeOfValue() === 'valuesHyperCube' ) {
        dim[0] = v.length;
        dim[1] = v[0].length;
        dim[2] = v[0][0].length;
        dim[3] = v[0][0][0].length;
      }
    }
    // console.log('in getValueDim return =' + dim[i - 1]  );

    return dim[i - 1] ;
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
    // console.log(v);
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
        res = v[i0];
      } else if (typeof v[0][0][0][0] === 'number' ||
                 typeof v[0][0][0][0] === 'boolean') { // HyperCube
        res = v[i0][j0];
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
