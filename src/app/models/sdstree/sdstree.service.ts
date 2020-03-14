import { Injectable } from '@angular/core';
import {  Sdstree,  sdtreeVide } from './sdstree';
import {  Group } from './SDSGroup';
import {  Matrix,
  value, valuesCube, valuesHyperCube, valuesMatrix,
  valuesVect
} from './SDSMatrix';
import {Mat0_MatrixF_json, Mat0_MatrixL_json, Tuto, VectF_AltitudeF_json, VectF_MachF_json} from './mockup-sdstree';
import {Item, Navtree} from '../../layouts/navtree/navtree';
import * as JSZip from 'jszip';
import * as assert from 'assert';
import {DimensionP, Properties, RefMatrixP} from '../../layouts/contentprop/Properties';
import {SDSNode} from './SDSNode';
import {transformSdsTreeToNavTree} from './transformSdsTreeToNavTree';
import {manageCurrentNode} from './manageCurrentNode';
import {manageValues} from './manageValues';

@Injectable({
  providedIn: 'root'
})
export class SdstreeService {

  // current Dico tree
  public sds: Sdstree; // application model
  private nv: transformSdsTreeToNavTree; // to calculate navtree & mapMatrix
  private navtree: Navtree; // GUI model
  public zip: JSZip; // remain model
  private mapMatrix = new Map<string, Matrix>(); // hashtable to Matrix

  // current Dico Node
  private curNode: manageCurrentNode; // to manage currentNode
  public currentNode: SDSNode; // application model
  private curValue: manageValues; // to manage values of currentNode

  public prop: Properties; // GUI model (properties view)

  // By default SDS begin by loading the tutorial
  constructor() {
    this.constructSdtreeTuto();
    this.setCurrentNode('d0');
  }
  constructSdtreeTuto() {
    // application memory construction
    this.sds = Tuto;
    // file memory construction
    this.zip = new JSZip();
    this.zip.file('index.json', JSON.stringify(this.sds));
    this.zip.file('VectF/MachF.json', JSON.stringify(VectF_MachF_json));
    this.zip.file('VectF/AltitudeF.json', JSON.stringify(VectF_AltitudeF_json));
    this.zip.file('Mat0/MatrixF.json', JSON.stringify(Mat0_MatrixF_json));
    this.zip.file('Mat0/MatrixL.json', JSON.stringify(Mat0_MatrixL_json));
    // user view memory construction
    this.nv = new transformSdsTreeToNavTree(this.sds);
    this.navtree = this.nv.navtree;
    this.mapMatrix = this.nv.mapMatrix;
  }
  // creating a new empty SDS tree
  constructSdtreeVide() {
    this.sds = sdtreeVide;
    this.zip = new JSZip();
    this.zip.file('index.json', JSON.stringify(this.sds));
    this.nv = new transformSdsTreeToNavTree(this.sds);
    this.navtree = this.nv.navtree;
    this.mapMatrix = this.nv.mapMatrix;
    this.setCurrentNode('d0');
  }
  // accessor getting the NavTree
  getNavTree(): Navtree {
    return this.navtree;
  }
  // save zip object as an archive file
  saveZip() {
    this.zip.generateAsync({type: 'base64'}).then(function(base64) {
      location.href = 'data:application/zip;base64,' + base64;
    });
  }
  // load the archive file into the zip object
  // and update SDS tree application model from de index.json file
  getJsonIndex() {
    this.zip
      .file('index.json')
      .async('string')
      .then(data => this.updateSDS(data))
      .catch(error => console.error(error))
    ;
  }

  updateSDS(s: string) {
    // console.log('dans updateSDS = '+s);
    this.sds = JSON.parse(s);
    this.nv = new transformSdsTreeToNavTree(this.sds);
    this.navtree = this.nv.navtree;
    this.mapMatrix = this.nv.mapMatrix;
  }

  // when the user select a node tree in the GUI
  // update the CurrentNode object loading
  // the SDStree Node
  setCurrentNode(key: string) {
    // console.log('in setCurrentNode key=' + key);
    this.curNode = new manageCurrentNode(key, this.sds, this.mapMatrix, this.zip);
    this.currentNode = this.curNode.currentNode;
    this.curValue = new manageValues(this.currentNode, this.curNode);
    // console.log('in setCurrentNode this.currentNode =');
    // console.log(this.currentNode);
  }

  // to know if the currentNode is a Matrix with scales ( Decoupage)
  hasDecoup() {
    return this.curNode.hasDecoup(this.currentNode);
  }
  // to get the scale
  getDecoup(i: number): number[] {
    let res: number[];
    assert(i === 0 || i === 1);
    assert(this.hasDecoup());
    res = this.curNode.getCurrentNodeJsonDecoupValue(i) ;
    return res;
  }
  // display current Node in the properties dialog
  getCurrentNodeProperties(): Properties {
    this.prop = new Properties();
    if (!this.currentNode) {
      this.prop.name = this.sds.name;
      this.prop.comment = this.sds.comment;
      this.prop.history = this.sds.history;
    } else {
      // console.log('in getCurrentNodeProperties this.currentNode =');
      // console.log(this.currentNode);
      this.prop.name = this.currentNode.name;
      this.prop.comment = this.currentNode.comment;
      if (this.currentNode instanceof Matrix) {
        // console.log('in getCurrentNodeProperties Matrix');
        // console.log(this.currentNode);
        if (this.currentNode.type) {
          this.prop.type = this.currentNode.type;
        }
        if (this.currentNode.unit) {
          this.prop.unit = this.currentNode.unit;
        }
        if (this.currentNode.dimensions) {
          let i = 0;
          const numDim = this.currentNode.dimensions.length;
          this.prop.dimensions = new Array(numDim);
          for (const dim of this.currentNode.dimensions) {
            this.prop.dimensions[i] = new DimensionP();
            this.prop.dimensions[i].size = dim.size;
            if (dim.scale) {
              this.prop.dimensions[i].scale = dim.scale;
            }
            i++;
          }
        }
        if (this.currentNode.variants) {
          let i = 0;
          this.prop.variants = new Array(this.currentNode.variants.length);
          for (const vari of this.currentNode.variants) {
            this.prop.variants[i] = new RefMatrixP();
            this.prop.variants[i].name = vari.name;
            if (vari.comment) {
              this.prop.variants[i].comment = vari.comment;
            }
            i++;
          }
        }
      } else if (this.currentNode instanceof Group) {
        // nothing to do
      } else {
        // impossible
        // console.log('this.currentNode instance of what ?');
        assert(false, 'sds tool internal error');
      }
    }
    return this.prop;
  }

  // display service of the value of the current node
  getCurrentValue(i0?: number , j0?: number): number[][]  {
    if (this.curValue) {
        return this.curValue.getCurrentValue(i0, j0);
    } else {
        return [];
    }
  }

  // display service of the type of value of the current node
  // to display matrix, cube, hypercube
  getTypeOfValue(): string {
    let res: string;
    if (this.curValue) {
      res = this.curValue.getTypeOfValue();
    } else {
      res = 'undefined';
    }
    return res ;
  }
  // display service of length of a value dimension
  getValueDim(i: number): number {
    if (this.curValue) {
      return this.curValue.getValueDim(i);
    } else {
      return 0;
    }
  }

}
