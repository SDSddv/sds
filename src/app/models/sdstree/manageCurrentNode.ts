import {SDSNode} from './SDSNode';
import {Matrix, value, valuesCube, valuesHyperCube, valuesMatrix, valuesVect} from './SDSMatrix';
import {Sdstree} from './sdstree';
import {Group} from './SDSGroup';
import * as JSZip from 'jszip';
import * as assert from 'assert';
import {SdstreeService} from './sdstree.service';

// manageCurrentNode permits
// to set the Current Node selected by the user
// loading the values in the json files in the zip sds file asynchronously

export class manageCurrentNode {
  public nodeKey: string; // GUI model (tree view)
  public currentNode: SDSNode; // application model
  public currentNodeJsonValue: value | valuesVect | valuesMatrix |
             valuesCube | valuesHyperCube; // application model
  public currentNodeJsonDecoupValue: valuesVect[] ; // application model
  public zip: JSZip; // remain model
  public sds: Sdstree;
  public mapMatrix: Map<string, Matrix>;

  constructor(private sdsService: SdstreeService, key: string, sds: Sdstree, mapMatrix: Map<string, Matrix>, zip: JSZip) {
    this.nodeKey = key;
    this.sds = sds;
    this.mapMatrix = mapMatrix;
    this.zip = zip;
    this.currentNodeJsonDecoupValue = new Array(2);
    this.setCurrentNode();
  }

  getCurrentNodeJsonValue(): value | valuesVect | valuesMatrix |
             valuesCube | valuesHyperCube {
    let res: value | valuesVect | valuesMatrix |
             valuesCube | valuesHyperCube;
    if (this.currentNodeJsonValue) {
      res = this.currentNodeJsonValue;
    } else {
      // not value yet ( the promise is not completed )
      res = null;
    }
    return res;
  }

  setCurrentNodeJsonValue(value) {
    if (value) {
      this.currentNodeJsonValue = value;
    }
  }

  getCurrentNodeJsonDecoupValue(i: number): valuesVect  {
    // console.log('in getCurrentNodeJsonDecoupValue i=');
    // console.log(i);
    let res: valuesVect ;
    if (this.currentNodeJsonDecoupValue[i]) {
      // console.log('in getCurrentNodeJsonDecoupValue' +
      //               ' this.currentNodeJsonDecoupValue[i] is defined');
      res = this.currentNodeJsonDecoupValue[i];
    } else {
      // not value yet ( the promise is not completed )
      res = null;
    }
    // console.log('in getCurrentNodeJsonDecoupValue res=');
    // console.log(res);
    return res;
  }

  // when the user select a node tree in the GUI
  // update the CurrentNode object loading
  // the SDStree Node
  private setCurrentNode() {
    const key = this.nodeKey;
    // console.log('in setCurrentNode key=' + key);

    let gp: SDSNode = this.sds;
    let gpG: Group; // this variable is added due to the uncapability of the compiler
    // to detect that gp is a group when isGroup is true
    if (key !== '') {
      // console.log('in getCurrentNodeName key=' + key);
      // assertion
      const nodeKeyPattern = /^d0(g[0-9]+)*(m[0-9]+)*/;
      const found = key.match(nodeKeyPattern);
      assert(found.length > 0);

      const nodeKeyGrpPattern = /g[0-9]+/g;
      const grps = key.match(nodeKeyGrpPattern);
      if (grps != null) {
        let isGroup = false;
        for (let i = 0; i < grps.length; i++) {
          const k = +grps[i].substring(1, grps[i].length);
          // console.log(k);
          if (i === 0) {
            gp = this.sds.groups[k];
          } else {
            if (gp instanceof Group) {
              gp = gp.groups[k];
            } else {
              // console.log('gp NOT instanceof Group ! ');
            }
          }
          isGroup = true;
          gpG = gp;
        }
        // loop on matrix
        const nodeKeyMtxPattern = /m[0-9]+/g;
        const mtx = key.match(nodeKeyMtxPattern);
        if (mtx != null) {
          // console.log(mtx);
          const k = +mtx[0].substring(1, mtx[0].length);
          if (isGroup) {
            // console.log('k=' + k);
            this.currentNode = gpG.matrices[k];
            // console.log('gpG.matrices[k].type=' + gpG.matrices[k].type);
            if (this.currentNode instanceof Matrix) {
              // console.log('this.currentNode.type=' + this.currentNode.type);
            } else {
              // console.log(' it is not a matrix ?');
            }
          } else {
            // console.log('impossible');
          }
        } else {
          this.currentNode = gp;
        }
      } else {
        // only d0
        this.currentNode = this.sds;
      }
    }
    // As the reading of json values is asynchronous
    // this reading is made now
    if (this.currentNode instanceof  Matrix) {
      if (typeof this.currentNode.values === 'string') {
        this.getJsonValues(this.currentNode.values);
      }
      // also for the scale values (decoupage)
      if (this.hasDecoup(this.currentNode)) {
        for (let i = 0 ; i < 2 ; i++ ) {
          if (this.currentNode.dimensions[i].scale) {
              const scale = this.currentNode.dimensions[i].scale;
              const m: Matrix = this.mapMatrix.get(scale);
              // console.log(m);
              if (typeof m.values === 'string') {
                this.getJsonValuesDecoup(i, m.values);
              } else {
                const v: any = m.values;
                if (typeof v[0] === 'number' ) {
                  this.currentNodeJsonDecoupValue[i] = v;
                }
              }
          }
        }
      }
    }

    // console.log('in setCurrentNode this.currentNode.name=' + this.currentNode.name);
    if (this.currentNode instanceof Matrix) {
      // console.log('this.currentNode.type=' + this.currentNode.type);
    } else {
      // console.log(' it is not a matrix ?');
    }
  }

  private getJsonValues(jsonFileInZip: string) {
    this.zip
      .file(jsonFileInZip)
      .async('string')
      .then(data => this.updatecurrentNodeJsonValue(data))
      .catch(error => console.error(error))
    ;
  }

  private updatecurrentNodeJsonValue(s: string) {
    // console.log('in updatecurrentNodeJsonValue s=' + s);
    this.currentNodeJsonValue = JSON.parse(s);
  }

  private getJsonValuesDecoup(i: number, jsonFileInZip: string) {
    this.zip
      .file(jsonFileInZip)
      .async('string')
      .then(data => this.updatecurrentNodeJsonDecoupValue(i, data))
      .catch(error => console.error(error))
    ;
  }

  private updatecurrentNodeJsonDecoupValue(i: number, s: string) {
    assert( i === 0 || i === 1 );
    this.currentNodeJsonDecoupValue[i] = JSON.parse(s);
    /*
      Warn the SDS service that some new decoup data arrived.
      FIXME: This is a hack. We should be able to sync with the JSZIP promise.
    */
    this.sdsService.onDecoupDataResolved(i)
  }

  public hasDecoup(curNode: SDSNode): boolean {
    // console.log('in hasDecoup curNode=');
    // console.log(curNode);
    let res = false ;
    if ( curNode instanceof Matrix) {
      if ( curNode.dimensions ) {
        if ( curNode.dimensions[0].scale ) {
          res = true;
        }
      }
    }
    // console.log('in hasDecoup res=');
    // console.log(res);
    return res;
  }
}
