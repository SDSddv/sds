import {Sdstree} from './sdstree';
import {Group} from './SDSGroup';
import {Matrix} from './SDSMatrix';
import {SDSNode} from './SDSNode';

export class transformNavTreeToSdsTree {
  public sds: Sdstree;

  constructor(sds: Sdstree) {
    this.sds = sds;
  }

  /* Creates a new Matrix instance with default attributes. */
  private createMatrixItem(name): Matrix {
    if (name) {
      let matrix = new Matrix();
      matrix.name = name;
      matrix.comment = "";
      matrix.type = " ";
      matrix.values = 1;
      return matrix;
    }
    return null;
  }

  /*
    Finds the parent node in the SDS tree data model
    matching the provided parent item node.
  */
  private findParentNode(parentItem) {
    let groupNode: SDSNode = this.sds;
    let node: Group = null;
    if (parentItem) {
      node = this.sds;
      const pattern = /g[0-9]+/g;
      const match = parentItem.id.match(pattern);
      if (match != null) {
        for (let iterator = 0; iterator < match.length; iterator++) {
          const k = +match[iterator].substring(1, match[iterator].length);
          if (iterator === 0) {
            groupNode = this.sds.groups[k];
          }
          else {
            if (groupNode instanceof Group) {
              groupNode = groupNode.groups[k];
            }
          }
          node = groupNode;
        }
      }
    }
    return node;
  }

  /*
    Appends a new matrix to the SDS tree data model
    under the provided parent item node.
  */
  public createMatrix(parentItem, matrixName) {
    console.log("Appending matrix " + matrixName + " under " + parentItem.id);
    let parentNode = this.findParentNode(parentItem);
    if (!parentNode) {
      console.error("Failed to retrieve the parent node for item " + parentItem.id);
      return;
    }
    if (!parentNode.matrices) {
      parentNode.matrices = new Array();
    }
    let matrix = this.createMatrixItem(matrixName);
    // JSON.stringify and then JSON.parse to deserialize and serialize matrix object.
    let matrixStr = JSON.stringify(matrix);
    parentNode.matrices.push(JSON.parse(matrixStr));
  }

  /* Creates a new Group instance with default attributes. */
  private createGroupNode(name): Group {
    if (name) {
      let group = new Group();
      group.name = name;
      group.comment = "";
      group.groups = new Array();
      return group;
    }
    return null;
  }

  /*
    Appends a new group to the SDS tree data model
    under the provided parent item node.
  */
  public createGroup(parentItem, groupName) {
    console.log("Appending group " + groupName + " under " + parentItem.id);
    let parentNode = this.findParentNode(parentItem);
    if (!parentNode) {
      console.error("Failed to retrieve the parent node for item " + parentItem.id);
      return;
    }
    if (!parentNode.groups) {
      parentNode.groups = new Array();
    }
    let grp = this.createGroupNode(groupName);
    let groupStr = JSON.stringify(grp);
    parentNode.groups.push(JSON.parse(groupStr));
  }

  /*
    Finds the last group node index refering to the provided node identifier.
  */
  private findGroupNodeIdx(nodeId) {
    if (nodeId) {
      const pattern = /g[0-9]+/g;
      const match = nodeId.match(pattern);
      if (match != null) {
        return +match[match.length-1].substring(1, match[match.length-1].length);
      }
    }
    return null;
  }

  /*
    Finds the matrix node index refering to the provided node identifier.
  */
  private findMatrixNodeIdx(nodeId) {
    if (nodeId) {
      const pattern = /m[0-9]+/g;
      const match = nodeId.match(pattern);
      if (match != null) {
        return +match[0].substring(1, match[0].length);
      }
    }
    return null;
  }

  /*
    Deletes the provided matrix from the SDS tree data model.
  */
  public deleteMatrix(parentItem, matrixId) {
    console.log("Deleting matrix " + matrixId + " from " + parentItem.id);
    let parentNode = this.findParentNode(parentItem);
    if (!parentNode) {
      console.error("Failed to retrieve the parent node for item " + parentItem.id);
      return;
    }
    if (parentNode.matrices) {
      let matrixIdx = this.findMatrixNodeIdx(matrixId);
      if (matrixIdx != null) {
        parentNode.matrices.splice(matrixIdx, 1);
      }
    }
  }

  /*
    Deletes the provided group from the SDS tree data model.
  */
  public deleteGroup(parentItem, groupId) {
    console.log("Deleting group " + groupId + " from " + parentItem.id);
    let parentNode = this.findParentNode(parentItem);
    if (!parentNode) {
      console.error("Failed to retrieve the parent node for item " + parentItem.id);
      return;
    }
    if (parentNode.groups) {
      let groupIdx = this.findGroupNodeIdx(groupId);
      if (groupIdx != null) {
        parentNode.groups.splice(groupIdx, 1);
      }
    }
  }
}