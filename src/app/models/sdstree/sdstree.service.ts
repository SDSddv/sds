import {Injectable, ViewChild} from '@angular/core';
import {Sdstree, sdtreeVide} from './sdstree';
import {Group} from './SDSGroup';
import {Matrix, value, valuesCube, valuesHyperCube, valuesMatrix, valuesVect} from './SDSMatrix';
import {Mat0_MatrixF_json, Mat0_MatrixL_json, Tuto, VectF_AltitudeF_json, VectF_MachF_json} from './mockup-sdstree';
import {Item, Navtree} from '../../layouts/navtree/navtree';
import * as JSZip from 'jszip';
import * as assert from 'assert';
import {DimensionP, Properties, RefMatrixP} from '../../layouts/contentprop/Properties';
import {SDSNode} from './SDSNode';
import {transformSdsTreeToNavTree} from './transformSdsTreeToNavTree';
import {transformNavTreeToSdsTree} from './transformNavTreeToSdsTree';
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

  private treeViewItem = null; // Last item that was right clicked on the tree view
  private treeViewInstance = null; // Tree view component instance
  private managedNodes = null;
  private lastEditedCellData = null;
  private contentPropInstance = null; // Content property component instance
  private contentValueInstance = null; // Content value component instance

  // By default SDS begin by loading the tutorial
  constructor() {
    this.managedNodes = new Array();
    this.constructSdtreeTuto();
    this.setCurrentNode('d0');
    // FIXME: The initial node must be highlighted in the tree view.
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

  /* Sets the tree view widget instance. */
  setTreeViewInstance(instance) {
    this.treeViewInstance = instance;
  }

  /* Gets the tree view widget instance. */
  getTreeViewInstance() {
    return this.treeViewInstance;
  }

  /* Sets the content property widget instance. */
  setContentPropInstance(instance) {
    this.contentPropInstance = instance;
  }

  /* Gets the content property widget instance. */
  getContentPropInstance() {
    return this.contentPropInstance;
  }

  /* Sets the content value widget instance. */
  setContentValueInstance(instance) {
    this.contentValueInstance = instance;
  }

  /* Gets the content value widget instance. */
  getContentValueInstance() {
    return this.contentValueInstance;
  }

  /* Gets the node matching the provided identifier in a nodes list. */
  getNodeById(nodes, nodeId) {
    for(let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      if (node.id == nodeId) {
        return node
      }
      if (node.items) {
        let subelemnt = this.getNodeById(node.items, nodeId)
        if (subelemnt) {
          return subelemnt
        }
      }
    }
    return null
  }

  /*
    Parse a node identifier.
    nodeId has the following format:
    dXgYmZ:
      - dX: SDS identifier
      - gY: Group identifier
      - mZ: Matrix identifier
    with X, Y, Z a number (several digits are allowed).
    gY and mZ are optional.
    Returns a map containing:
      - The SDS identifier in the sdsId key.
      - The group identifier in the groupId key.
      - The matrix identifier in the matrixId key.
    Any of this returned identifier can be set to undefined
    if not detected in the provided node identifier.
  */
  parseNodeId(nodeId) {
    if (nodeId) {
      let match = nodeId.match(/([d]\d+)(([g]\d+)+)*([m]\d+)?/);
      if (match) {
        if (match.length > 0) {
          var map = new Map();
          /*
             Match[0]: full match.
             Match[1]: sds match.
             Match[2]: groups match.
             Match[last]: matrix match.
          */
          map.set("sdsId", match[1]);
          map.set("groupId", match[2]);
          map.set("matrixId", undefined);
          let last = match[match.length-1]
          if (last) {
            let matrixMatch = last.match(/([m]\d+)/);
            if (matrixMatch) {
              map.set("matrixId", last);
            }
          }
          return map
        }
      }
    }
    return null
  }

  /* Computes an available node identifier (useful when creating a node). */
  getFreeNodeId(baseId) {
    let freeNodeId = null
    if (baseId) {
      let parsedId = this.parseNodeId(baseId);
      if (parsedId) {
        let sdsIdObj = parsedId.get("sdsId")
        let groupIdObj = parsedId.get("groupId")
        let matrixIdObj = parsedId.get("matrixId")
        if (matrixIdObj) {
          let matrixMatch = matrixIdObj.match(/([m])(\d+)/);
          if (matrixMatch) {
            let matrixId = matrixMatch[2];
            matrixId = +matrixId; // convert str to number ! weird !
            matrixId++;
            freeNodeId = sdsIdObj + groupIdObj + "m" + matrixId;
          }
        }
        else if (groupIdObj) {
          let groupMatch = groupIdObj.match(/(([g])(\d+))*/);
          if (groupMatch) {
            let fullMatch = groupMatch[0];
            let groupId = groupMatch[3];
            let groupIdLen = groupId.length;
            groupId = +groupId; // convert str to number ! weird !
            groupId++;
            let newGroupId = fullMatch.slice(0, -groupIdLen) + "" + groupId;
            freeNodeId = sdsIdObj + newGroupId;
          }
        }
        else if (sdsIdObj) {
          let sdsMatch = sdsIdObj.match(/([d])(\d+)/);
          if (sdsMatch) {
            let sdsId = sdsMatch[2];
            sdsId = +sdsId; // convert str to number ! weird !
            sdsId++;
            freeNodeId = "d" + sdsId;
          }
        }
      }
    }
    return freeNodeId
  }

  /* Checks if the provided node is a matrix or not. */
  isMatrix(node) {
    if (node) {
      let id = node.id
      let match = id.match(/(\w+)([m]\d+)/);
      if (match) {
        return true
      }
    }
    return false
  }

  /* Checks if the provided node is a group or not. */
  isGroup(node) {
    if (node) {
      let id = node.id
      let match = id.match(/(\w+)([g]\d+)/);
      if (match) {
        return true
      }
    }
    return false
  }

  /*
     Gets the last group item of the provided parent node.
  */
  getLastGroupItem(parentNode) {
    let groupItem = null;
    if (parentNode && parentNode.items) {
      let items = parentNode.items;
      for (let iter = 0; iter < items.length; iter++) {
        let item = items[iter];
        if (!item)
          continue;
        let match = item.id.match(/([g]\d+)+$/);
        if (!match)
          continue;
        groupItem = item;
      }
    }
    return groupItem;
  }

  /*
     Gets the last matrix item of the provided parent node.
  */
  getLastMatrixItem(parentNode) {
    let matrixItem = null;
    if (parentNode && parentNode.items) {
      let items = parentNode.items;
      for (let iter = 0; iter < items.length; iter++) {
        let item = items[iter];
        if (!item)
          continue;
        let match = item.id.match(/(\w+)([m]\d+)/);
        if (!match)
          continue;
        matrixItem = item;
      }
    }
    return matrixItem;
  }

  /*
     Creates a new matrix node from the provided parent node.
     The created node is initialized with the provided matrix name and identifier.
  */
  createMatrixNode(parentNode, matrixName) {
    if (parentNode) {
      let lastItem = this.getLastMatrixItem(parentNode);
      let lastItemId = null;
      let newId = null;
      if (lastItem) {
        lastItemId = lastItem.id;
        newId = this.getFreeNodeId(lastItemId);
      }
      else {
        newId = parentNode.id + "m0";
      }
      if (!newId) {
        console.error("Failed to retrieve a free node identifier for child of " + parentNode.id)
        return;
      }
      let isGroup = this.isGroup(parentNode);
      if (!isGroup) {
        console.error("Matrix can be created only in a group !")
        return false
      }
      if (!parentNode.items)
        parentNode.items = new Array()
      let itemArray;
      itemArray = new Array(1);
      itemArray[0] = new Item();
      itemArray[0].id = ""+newId; // id shall be unique in the set of tree nodes
      itemArray[0].text = matrixName;
      parentNode.items.push(itemArray[0]);
      let navtreeTransformInstance = new transformNavTreeToSdsTree(this.sds);
      navtreeTransformInstance.createMatrix(parentNode, matrixName);
      this.updateZip();
    }
  }

  /*
     Creates a new group node from the provided parent node.
     The created node is initialized with the provided group name and identifier.
  */
  createGroupNode(parentNode, groupName) {
    if (parentNode) {
      let lastItem = this.getLastGroupItem(parentNode);
      let lastItemId = null;
      let newId = null;
      if (lastItem) {
        lastItemId = lastItem.id;
        newId = this.getFreeNodeId(lastItemId);
      }
      else {
        newId = parentNode.id + "g0";
      }
      if (!newId) {
        console.error("Failed to retrieve a free node identifier for child of " + parentNode.id)
        return;
      }
      if (!parentNode.items)
        parentNode.items = new Array()
      let itemArray;
      itemArray = new Array(1);
      itemArray[0] = new Item();
      itemArray[0].id = ""+newId; // id shall be unique in the set of tree nodes
      itemArray[0].text = groupName;
      itemArray[0].items = new Array()
      itemArray[0].expanded = true
      parentNode.items.push(itemArray[0]);
      let navtreeTransformInstance = new transformNavTreeToSdsTree(this.sds);
      navtreeTransformInstance.createGroup(parentNode, groupName);
      this.updateZip();
    }
  }

  /*
     Deletes a node from its identifier from the nodes list.
  */
  deleteNodeItem(nodeId) {
    // The parent node identifier is obtained by slicing the child identifier.
    // We keep all the child identifier except the last two digits.
    // FIXME: It can contain more than 2 digits !
    let parentNodeId = nodeId.slice(0, -2);
    let parentNode = this.getNodeById(this.navtree, parentNodeId)
    // If no parent node is found (SDS level), do not delete the whole tree.
    if (parentNode) {
      const index = parentNode.items.findIndex(item => item.id === nodeId);
      let childNode = parentNode.items[index];
      parentNode.items.splice(index, 1);
      if (this.isMatrix(childNode)) {
        let navtreeTransformInstance = new transformNavTreeToSdsTree(this.sds);
        navtreeTransformInstance.deleteMatrix(parentNode, nodeId);
        this.updateZip();
      }
      else if (this.isGroup(childNode)) {
        let navtreeTransformInstance = new transformNavTreeToSdsTree(this.sds);
        navtreeTransformInstance.deleteGroup(parentNode, nodeId);
        this.updateZip();
      }
    }
  }

  /*
     Updates a node properties in the nav tree.
  */
  updateNodeItem(properties) {
    if (properties) {
      let nodeId = this.curNode.nodeKey;
      let node = this.getNodeById(this.navtree, nodeId)
      if (node) {
        node.text = properties.name;
      }
    }
  }

  /*
     Deletes a node from its identifier.
  */
  deleteNode(nodeId) {
    if (nodeId) {
      this.deleteNodeItem(nodeId);
    }
  }

  /*
     Sets the last tree view item that was right clicked.
     Useful to associate the treeview item to the contextual menu item.
  */
  setTreeViewItem(item) {
    this.treeViewItem = item
  }

  /*
     Gets the last tree view item that was right clicked.
     Useful to associate the treeview item to the contextual menu item.
  */
  getTreeViewItem() {
    return this.treeViewItem
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

  /*
    Updates the ZIP file with the SDS tree model.
  */
  updateZip() {
    /* Update the main json file. */
    this.zip.file('index.json', JSON.stringify(this.sds, null, "\t"));
    /* Check if some matrix with forwarded values have to be updated. */
    let forwardedMatrixes = this.getForwardedMatrixes(this.curNode.mapMatrix);
    if (forwardedMatrixes) {
      for (let forwardedMatrix of forwardedMatrixes) {
        let jsonLocation = forwardedMatrix.path;
        let jsonValues = forwardedMatrix.values;
        /*
          If a forwarded matrix has no "values" property,
          there is not need to update it.
        */
        if (!jsonValues || !jsonValues.length) {
          continue;
        }
        /*
          The forwarded matrix has a "values" property,
          update the appropriate JSON file.
        */
        let values = jsonValues[0];
        if (jsonValues.length > 1) {
          values = jsonValues;
        }
        this.zip.file(jsonLocation, JSON.stringify(values, null, "\t"));
      }
    }
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

  getMatrixName(matrixPath) {
    let matrixName = null;
    if (matrixPath) {
      const index = matrixPath.lastIndexOf("/") + 1;
      matrixName = matrixPath.substr(index);
    }
    return matrixName;
  }

  getMatrixByName(matrixName) {
    let matrix = null;
    if (matrixName && this.managedNodes && this.managedNodes.length > 0) {
      for (let node of this.managedNodes) {
        let currentNode = node.currentNode;
        if (currentNode) {
          if (currentNode.name == matrixName) {
            matrix = node;
            break;
          }
        }
      }
    }
    return matrix;
  }

  getForwardedMatrixValues(matrixPath) {
    let values = null;
    if (matrixPath) {
      let matrixName = this.getMatrixName(matrixPath);
      let matrix = this.getMatrixByName(matrixName);
      if (matrix) {
        if (matrix.currentNodeJsonValue) {
          values = matrix.currentNodeJsonValue;
        }
      }
    }
    return values;
  }

  /*
    Gets an array of all the matrixes that have a stringified value.
   */
  getForwardedMatrixes(matrixMap) {
    let forwardedMatrixes = null;
    if (matrixMap) {
      forwardedMatrixes = new Array();
      for (let entry of matrixMap.entries()) {
        let value = entry[1];
        if (value) {
          let entryValues = value.values;
          if (entryValues) {
            if (typeof entryValues == 'string') {
              let forwardedMatrixesMap = new Map();
              forwardedMatrixesMap["path"] = entryValues;
              let matrixPath = entryValues.replace(".json", "");
              let values = this.getForwardedMatrixValues(matrixPath);
              if (values) {
                forwardedMatrixesMap["values"] = values;
              }
              forwardedMatrixes.push(forwardedMatrixesMap);
            }
          }
        }
      }
    }
    return forwardedMatrixes;
  }

  setLastEditedCell(content) {
    this.lastEditedCellData = content;
  }

  getLastEditedCell() {
    return this.lastEditedCellData;
  }

  // when the user select a node tree in the GUI
  // update the CurrentNode object loading
  // the SDStree Node
  setCurrentNode(key: string) {
    // console.log('in setCurrentNode key=' + key);
    this.curNode = new manageCurrentNode(this, key, this.sds, this.mapMatrix, this.zip);
    this.currentNode = this.curNode.currentNode;
    this.curValue = new manageValues(this.currentNode, this.curNode);
    /* Insert new item in the managed nodes array only if it doesn't already exist. */
    let filteredNodeArray = this.managedNodes.filter(value=> value.nodeKey==this.curNode.nodeKey)
    if (filteredNodeArray && filteredNodeArray.length <= 0) {
      this.managedNodes.push(this.curNode);
    }
    else {
      /*
        Each time a new current node is allocated,
        update its instance in the managed nodes array.
      */
      const index = this.managedNodes.indexOf(filteredNodeArray[0])
      this.managedNodes[index] = this.curNode;
    }
    /*
      When changing the current node,
      reset any previously edited cell data in the data grid.
    */
    this.setLastEditedCell(null);
    /*
      Update form data.
      FIXME: this shouldn't be necessary.
    */
   let contentPropInstance = this.getContentPropInstance();
    if (contentPropInstance) {
      contentPropInstance.updateFormData();
      /*
        FIXME: this is a hack to not auto submit the form
        when select box content is updated when changing the
        current node in the tree view.
      */
      contentPropInstance.setCurrentNode(this.currentNode);
    }
    // console.log('in setCurrentNode this.currentNode =');
    // console.log(this.currentNode);
  }

  /* Gets the currently selected node in the tree view. */
  getCurrentNode() {
    return this.currentNode;
  }

  /*
    Called when forwarded decoup data has been resolved.
    In that use case, the content value data grid must be updated.
    FIXME: This is a hack. We should be able to sync with the JSZIP promise.
  */
  onDecoupDataResolved(index) {
    let contentValueInstance = this.getContentValueInstance();
    if (contentValueInstance) {
      /* Call the content value component handler. */
      contentValueInstance.onDecoupDataResolved(index)
    }
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
      /*
        As the current node is of SDSNode generic type,
        the history property never exists on that type of object.
        Convert it to the "any" type in order to
        check if it has the history property.
      */
      const curNode: any = this.currentNode;
      if (curNode.history) {
        let nodeHistory = curNode.history;
        if (nodeHistory)
          this.prop.history = nodeHistory;
      }
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

  /*
    Updates the current node properties.
  */
  setCurrentNodeProperties(properties: Properties) {
    if (properties && this.currentNode) {
      let currentName = this.currentNode.name;
      if (currentName) {
        /* Update the tree view item name. */
        this.updateNodeItem(properties);
      }
      this.currentNode.name = properties.name;
      this.currentNode.comment = properties.comment;
      if (this.currentNode instanceof Sdstree) {
        if (properties.history) {
          this.currentNode.history = properties.history;
        }
      }
      if (this.currentNode instanceof Matrix) {
        if (properties.type) {
          this.currentNode.type = properties.type;
        }
        if (properties.unit) {
          this.currentNode.unit = properties.unit;
        }
        if (properties.dimensions) {
          this.currentNode.dimensions = properties.dimensions;
        }
        if (properties.variants) {
          this.currentNode.variants = properties.variants;
        }
      }
      /*
        Update the SDS data model.
      */
      this.updateZip();
    }
  }

  // display service of the value of the current node
  getCurrentValue(i0?: number , j0?: number): number[][]  {
    if (this.curValue) {
        return this.curValue.getCurrentValue(i0, j0);
    } else {
        return [];
    }
  }

  /*
    Updates the current node value.
  */
  setCurrentValue(value, i0?: number , j0?: number) {
    if (this.curValue) {
      this.curValue.setCurrentValue(value, i0, j0);
      /*
        Update the SDS data model.
      */
      this.updateZip();
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
