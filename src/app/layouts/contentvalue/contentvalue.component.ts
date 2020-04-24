import {Component, OnInit, ViewChild} from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import notify from 'devextreme/ui/notify';
import {Matrix} from '../../models/sdstree/SDSMatrix';
import {DxDataGridComponent} from 'devextreme-angular';


/*
  Defines the available operations on the data grid.
*/
enum operationKind {
  AddData,
  DeleteData,
}

enum operationDirection {
  Row,
  Column,
}

@Component({
  selector: 'app-contentvalue',
  templateUrl: './contentvalue.component.html',
  styleUrls: ['./contentvalue.component.css']
})
export class ContentvalueComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  matrix: number[][] ;
  scalOrVect = true;
  typeOfValue: string ;
  // an enumerate which values are :
  // undefined | value | valuesVect | valuesMatrix |
  //              valuesCube | valuesHyperCube;
  i0 = 1; // default value
  dimI = 1;
  j0 = 1; // default value
  dimJ = 1 ;
  decoup0_col: number[];
  decoup1_lig: number[];
  previousNode = null;
  previousData = null;
  private loadPanelProps: any = {
    enabled: true,
    showIndicator: true,
    showPane: true,
    text: "Loading data..."
  };

  constructor(private sdsService: SdstreeService) {
    /*
      Allow the customizeColumns to be run in the angular context.
      With that property any class instance attribute/method can be called
      within the customizeColumns callback.
     */
    this.customizeColumns = this.customizeColumns.bind(this);
    this.sdsService.setContentValueInstance(this);
  }

  ngOnInit() {
  }

  /*
    Checks if the currently selected node has a values attribute or not.
    This used to display/hide the values editor.
  */
  hasValues() {
    if (this.sdsService) {
      let currentNode = this.sdsService.getCurrentNode();
      if (currentNode && currentNode instanceof Matrix) {
        if (currentNode.values) {
          return true;
        }
      }
    }
    return false;
  }

  /*
    Text input value change handler.
    Updates the data grid. Mainly used for cubes & hypercubes.
  */
 onChange(e) {
    if (!e && !e.target) {
      console.error("Unable to get element, aborting...")
      return
    }
    if (!this.dataGrid && !this.dataGrid.instance) {
      console.error("Unable to get data grid instance, aborting...")
      return
    }
    const nodeId = e.target.id;
    if (nodeId.includes("i")) {
      this.i0 = e.target.value;
    }
    else if (nodeId.includes("j")) {
      this.j0 = e.target.value;
    }
    this.dataGrid.instance.option("dataSource", this.getData(this.i0, this.j0, true));
  }

  /*
    Called when forwarded decoup data has been resolved.
    FIXME: This is a hack. We should be able to sync with the JSZIP promise.
  */
  onDecoupDataResolved(index) {
    /* Retrieve the updated data and force to refresh the data grid view. */
    this.getData(this.i0, this.j0, true);
    this.dataGrid.instance.refresh();
  }

  updateDecoupData(decoupData) {
    for (let iter = 0; iter < this.previousData.length; iter++) {
      let item = this.previousData[iter];
      if (item) {
        /* Decoup data is stored in the first element of each row item. */
        item[0] = decoupData[iter];
      }
    }
  }

  /*
    Extracts the matrix name from a scale path (/group1/group2/.../matrixName) from its index.
  */
  getDecoupMatrixName(index) {
    let name = null;
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode && currentNode instanceof Matrix) {
      let dimensions = currentNode.dimensions;
      if (dimensions && index <= dimensions.length) {
        let scale = dimensions[index].scale;
        if (scale) {
          const idx = scale.lastIndexOf("/") + 1;
          name = scale.substr(idx);
        }
      }
    }
    return name;
  }

  /*
    Custonizes the columns captions (titles) to display in the grid view.
  */
  customizeColumns(columns) {
    if (columns) {
      let data = this.getData(this.i0, this.j0);
      for (let iter = 0; iter < columns.length; iter++) {
        if (iter == 0) {
          if (!this.scalOrVect) {
            if (this.decoup0_col && this.decoup1_lig) {
              let verticalCaption = this.getDecoupMatrixName(1);
              let horizontalCaption = this.getDecoupMatrixName(0);
              /*
                Apply default values if
                either vertical or horizontal caption is unavailable.
              */
              if (!verticalCaption) {
                verticalCaption = "Scale 1"
              }
              if (!horizontalCaption) {
                horizontalCaption = "Scale 2"
              }
              columns[iter].caption = verticalCaption + " / " + horizontalCaption;
            }
            else {
              columns[iter].caption = "Row ID / Column ID";
            }
          }
          else {
            columns[iter].caption = "Row ID / Column ID";
          }
          columns[iter].allowEditing = false;
        }
        else {
          if (!this.scalOrVect) {
            if (this.decoup0_col) {
              columns[iter].caption = "" + this.decoup0_col[iter-1];
            }
            if (this.decoup1_lig) {
              this.updateDecoupData(this.decoup1_lig);
            }
          }
        }
        columns[iter].alignment = "center";
        columns[iter].allowSorting = false;
      }
    }
  }

  /*
    Gets the whole data grid items.
  */
  getDataSourceItems() {
    let items = null;
    if (!this.dataGrid && !this.dataGrid.instance) {
      console.error("Unable to get data grid instance, aborting...");
      return
    }
    let dataSource = this.dataGrid.instance.getDataSource();
    if (dataSource) {
      items = dataSource.items();
    }
    return items;
  }

  /*
    Cell edition start handler.
  */
  onEditingStart(e) {
    /* Do not take a reference on e.data array, make a deep copy. */
    let lastEditedCellData = Object.assign([], e.data);
    this.sdsService.setLastEditedCell(lastEditedCellData)
  }

  /*
    Checks if a cell content has been modified.
  */
  hasCellContentChanged(content, cellsContent) {
    let hasChanged = false;
    if (content && cellsContent) {
      for (let iter = 0; iter < cellsContent.length; iter++) {
        let item = cellsContent[iter];
        if (item) {
          if (content[0] == item[0]) {
            for (let iter2 = 1; iter2 < item.length; iter2++) {
              if (content[iter2] == item[iter2]) {
                continue;
              }
              hasChanged = true;
              break;
            }
            if (hasChanged) {
              break;
            }
          }
        }
      }
    }
    return hasChanged;
  }

  /*
    Cell edition end handler.
  */
  onContentReady(e) {
    let items = this.getDataSourceItems();
    let lastEditedCellData = this.sdsService.getLastEditedCell();
    /* Check if some cell content has changed. */
    if (this.hasCellContentChanged(lastEditedCellData, items)) {
      if (items) {
        let currentProperties = this.sdsService.getCurrentNodeProperties();
        let newItems = new Array();
        for (let rowIter = 0; rowIter < items.length; rowIter++) {
          let rowItems = items[rowIter]
          if (rowItems != null) {
            newItems[rowIter] = new Array();
            for (let colIter = 1; colIter < rowItems.length; colIter++) {
              let colItem = rowItems[colIter];
              if (colItem != null) {
                /*
                  For booleans, convert 1/0 values to true/false.
                */
                if (currentProperties &&
                    currentProperties.type &&
                    currentProperties.type == 'boolean') {
                  if (colItem == 1) {
                    colItem = true;
                  }
                  else {
                    colItem = false;
                  }
                }
                newItems[rowIter].push(colItem)
              }
            }
          }
        }
        /* Update the modified content in the SDS. */
        this.sdsService.setCurrentValue(newItems, (this.i0 - 1), (this.j0 - 1));
        /* Reset the last edited cell content. */
        this.sdsService.setLastEditedCell(null);
      }
    }
  }

  /*
    Row creation handler.
  */
  onAddRow(position) {
    console.log("Adding new row at position: " + position)
    let data = this.getData(this.i0, this.j0, true);
    if (data) {
      let item = data[position-1];
      let itemId = item[0];
      let itemLen = item.length;
      let newData = new Array();
      for (let iter = 0; iter < itemLen; iter++) {
        if (iter == 0) {
          let id = +itemId;
          id++;
          newData.push(""+id);
        }
        else {
          newData.push("");
        }
      }
      data.splice(position, 0, newData);
      this.dataGrid.instance.refresh();
    }
  }

  /*
    Linear interpolation/extrapolation between two values.
    If the distance exactly equals to 0, the first value is returned.
    If the distance exactly equals to 1, the second value is returned.
    If the distance is lower than 1, it computes a linear interpolation.
    If the distance is greater than 1, it computes a linear extrapolation.
  */
  lerp(value1: number, value2: number, distance: number) {
    let lerpValue = (((1 - distance) * value1) + (distance * value2));
    /* Avoid floating point precision error. */
    // FIXME: Is 5 digits sufficient for the round precision ?
    lerpValue = (Math.round(lerpValue*10000)/10000);
    return lerpValue;
  }

  /*
    Computes a cell value from its neighbours values.
  */
  computeColumnCellValueFromNeighbours(position, data) {
    if (!data) {
      return null;
    }
    /*
      If the data only contains a value,
      we are not able to perform a linear interpolation/extrapolation
      between two points.
    */
    if (data.length <= 2) {
      return null;
    }
    let value1Position = position-1;
    if (position >= data.length) {
      value1Position = position-2;
    }
    else if (position == 1) {
      value1Position = position;
    }
    let value1 = data[value1Position];
    let value2Position = position;
    if (position >= data.length) {
      value2Position = position-1;
    }
    else if (position == 1) {
      value2Position = position+1;
    }
    let value2 = data[value2Position];
    let distance = 0.5;
    if (position >= data.length) {
      distance = 2;
    }
    else if (position == 1) {
      distance = -1;
    }
    let lerpValue = this.lerp(value1, value2, distance);
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode && currentNode instanceof Matrix) {
      let type = currentNode.type;
      /* For booleans && integers keep the decimal part of the lerp computation. */
      if ((type == 'boolean') ||
          (type == 'integer')) {
        lerpValue = Math.floor(lerpValue);
        /*
          Manage the lerp overflows for booleans by setting the value to 0.
        */
        if (type == 'boolean') {
          if ((lerpValue < 0) ||
              (lerpValue > 1)) {
                lerpValue = 0;
          }
        }
      }
    }
    return lerpValue;
  }

  /*
    Extracts the useful data from the provided data array.
    This is done by skipping the first column of each row of the provided data array.
  */
  extractUsefulData(data) {
    let usefulData = null;
    if (data) {
      usefulData = new Array();
      for (let rowIter = 0; rowIter < data.length; rowIter++) {
        let rowItems = data[rowIter]
        if (rowItems != null) {
          usefulData[rowIter] = new Array();
          /* Skip the first column by iterating from 1. */
          for (let colIter = 1; colIter < rowItems.length; colIter++) {
            let colItem = rowItems[colIter];
            if (colItem != null) {
              usefulData[rowIter].push(colItem)
            }
          }
        }
      }
    }
    return usefulData;
  }

  /*
    Creates/deletes column data at the provided position according to the provided operation kind and
    updates the SDS tree values and properties accordingly.
  */
  setColumnData(position: number, operation: operationKind, node?) {
    let data = null;
    let currentNode = this.sdsService.getCurrentNode();
    if(node != null) {
      currentNode = node;
    }
    if (currentNode instanceof Matrix) {
      let valueType = this.getValueType();
      if (valueType == "valuesCube") {
        for (let iter = 0; iter < this.dimI; iter++) {
          data = this.getData(iter+1, this.j0, true, node);
          if (data) {
            for (let iterX = 0; iterX < data.length; iterX++) {
              let item = data[iterX];
              if (item) {
                let cellValue = this.computeColumnCellValueFromNeighbours(position, item);
                if (cellValue == null) {
                  // Default value is 0 for integers & booleans and false (i.e 0) for booleans.
                  cellValue = 0;
                }
                if (operation == operationKind.AddData) {
                  item.splice(position, 0, cellValue);
                }
                else if (operation == operationKind.DeleteData) {
                  item.splice(position, 1);
                }
              }
            }
            let newItems = this.extractUsefulData(data);
            /* Update the modified content in the SDS. */
            this.sdsService.setCurrentValue(newItems, iter, (this.j0 - 1), node);
          }
        }
      }
      else if (valueType == "valuesHyperCube") {
        for (let iter = 0; iter < this.dimI; iter++) {
          for (let iter2 = 0; iter2 < this.dimJ; iter2++) {
            data = this.getData(iter+1, iter2+1, true, node);
            if (data) {
              for (let iterX = 0; iterX < data.length; iterX++) {
                let item = data[iterX];
                if (item) {
                  let cellValue = this.computeColumnCellValueFromNeighbours(position, item);
                  if (cellValue == null) {
                    // Default value is 0 for integers & booleans and false (i.e 0) for booleans.
                    cellValue = 0;
                  }
                  if (operation == operationKind.AddData) {
                    item.splice(position, 0, cellValue);
                  }
                  else if (operation == operationKind.DeleteData) {
                    item.splice(position, 1);
                  }
                }
              }
              let newItems = this.extractUsefulData(data);
              /* Update the modified content in the SDS. */
              this.sdsService.setCurrentValue(newItems, iter, iter2, node);
            }
          }
        }
      }
      else {
        data = this.getData(this.i0, this.j0, true, node);
        if (data) {
          for (let iterX = 0; iterX < data.length; iterX++) {
            let item = data[iterX];
            if (item) {
              let cellValue = this.computeColumnCellValueFromNeighbours(position, item);
              if (cellValue == null) {
                // Default value is 0 for integers & booleans and false (i.e 0) for booleans.
                cellValue = 0;
              }
              if (operation == operationKind.AddData) {
                item.splice(position, 0, cellValue);
              }
              else if (operation == operationKind.DeleteData) {
                item.splice(position, 1);
              }
            }
          }
          let newItems = this.extractUsefulData(data);
          /* Update the modified content in the SDS. */
          this.sdsService.setCurrentValue(newItems, (this.i0 - 1), (this.j0 - 1), node);
        }
      }
      /*
        For cubes & hypercubes retrieve the data again
        for the coordinates selected by the user.
      */
      if (valueType == "valuesCube" ||
          valueType == "valuesHyperCube") {
        this.getData(this.i0, this.j0, true);
      }
    }
  }

  /*
    Creates/deletes column data at the provided position in the scales nodes (if any) associated to the current node.
  */
  setColumnScalesNodeData(position: number, operation: operationKind, direction: operationDirection) {
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode instanceof Matrix) {
      let dimensions = currentNode.dimensions;
      if (dimensions) {
        let scalePath = null;
        if (direction == operationDirection.Column) {
          let dimension = dimensions[0];
          if (dimension) {
            scalePath = dimension.scale;
          }
        }
        else if (direction == operationDirection.Row) {
          let dimension = dimensions[1];
          if (dimension) {
            scalePath = dimension.scale;
          }
        }
        if (scalePath) {
          let node = this.sdsService.getNodeDescByPath(scalePath);
          if (node) {
            this.setColumnData(position, operation, node);
            let scaleData = this.getData(this.i0, this.j0, true, node);
            if (scaleData && scaleData instanceof Array) {
              if (scaleData[0] && scaleData[0] instanceof Array) {
                scaleData = scaleData[0];
              }
              scaleData = scaleData.slice(1, scaleData.length);
              if (direction == operationDirection.Column) {
                this.sdsService.setDecoup(0, scaleData);
              }
              else if (direction == operationDirection.Row) {
                this.sdsService.setDecoup(1, scaleData);
              }
            }
            /*
              Add an icon on the tree view to warn the user that
              something has changed in the scale node.
            */
            const index = scalePath.lastIndexOf("/") + 1;
            let scaleNodeName = scalePath.substr(index);
            this.sdsService.addNodeIcon(scaleNodeName, "warning");
          }
        }
      }
    }
  }

  /*
    Creates/deletes column data in a matrix node that references a scale vector at the provided position.
  */
  setColumnMatrixesNodeData(position: number, operation: operationKind, direction: operationDirection) {
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode) {
      let nodePath = this.sdsService.getNodePath("", currentNode.name);
      let rootPath = this.sdsService.getRootNodePath();
      nodePath = nodePath.replace(rootPath, "");
      let matrixRefs = this.sdsService.getScaledMatrixRefs(nodePath);
      if (matrixRefs) {
        for (let iter = 0; iter < matrixRefs.length; iter++) {
          let matrixRef = matrixRefs[iter];
          if (matrixRef) {
            this.setColumnData(position, operation, matrixRef);
            this.sdsService.addNodeIcon(matrixRef.name, "warning");
          }
        }
      }
    }
  }

  /* Creates/deletes column data for the current node references in the SDS tree. */
  setColumnNodeRefsData(position: number, operation: operationKind, direction: operationDirection) {
    /* Update the scales nodes column data. */
    this.setColumnScalesNodeData(position, operation, direction);
    this.setColumnMatrixesNodeData(position, operation, direction);
  }

  /*
    Column creation handler.
  */
  onAddColumn(position) {
    let operation = operationKind.AddData;
    let direction = operationDirection.Column;
    console.log("Adding new column at position: " + position)
    this.setColumnData(position, operation);
    this.setColumnNodeRefsData(position, operation, direction);
    this.dataGrid.instance.refresh();
  }

  /*
    Column deletion handler.
  */
  onDeleteColumn(position) {
    let operation = operationKind.DeleteData;
    let direction = operationDirection.Column;
    console.log("Deleting column at position: " + position)
    this.setColumnData(position, operation);
    this.setColumnNodeRefsData(position, operation, direction);
    this.dataGrid.instance.refresh();
  }

  /*
    Row deletion handler.
  */
  onDeleteRow(position) {
    console.log("Deleting row at position: " + position)
    let data = this.getData(this.i0, this.j0, true);
    if (data) {
      this.dataGrid.instance.refresh();
    }
  }

  /*
    Contextual menu handler.
  */
  onContextMenuPreparing(e) {
    if (e) {
      let properties = this.sdsService.getCurrentNodeProperties();
      let dataItems = this.getDataSourceItems();
      let items = e.items;
      if (!items) {
        items = new Array();
      }
      else {
        /* Make the array empty to not allow sorting. */
        items.length = 0;
      }
      /* Right click was done on a column. */
      if (e.row.rowType == "header") {
        /*
          Delete the first column is not allowed.
          Delete a column is not allowed if the grid contains only one column.
        */
        if (e.columnIndex != 0 &&
            (dataItems && dataItems[0] && (dataItems[0].length > 2))) {
          items.unshift(
            {
              text: 'Delete column',
              icon: 'trash',
              onClick: this.onDeleteColumn.bind(this, e.columnIndex)
            }
          );
        }
        items.unshift(
          {
            text: 'Insert column after',
            icon: 'add',
            onClick: this.onAddColumn.bind(this, (e.columnIndex + 1))
          }
        );
      }
      else {
        /* Right click was done on a row. */
        if (e.rowIndex != 0) {
          /* Delete the first row is not allowed. */
          items.unshift(
            {
              text: 'Delete row',
              icon: 'trash',
              onClick: this.onDeleteRow.bind(this, e.rowIndex)
            }
          );
        }
        items.unshift(
          {
            text: 'Insert row after',
            icon: 'add',
            onClick: this.onAddRow.bind(this, (e.rowIndex + 1))
          }
        );
      }
      e.items = items;
    }
  }

  /*
    Retrieves the data to display in the grid view.
  */
  getData(i?: number , j?: number, force?:boolean, node?) {
    if (this.sdsService) {
      let currentNode = this.sdsService.getCurrentNode();
      if(node != null) {
        currentNode = node;
      }
      if ((this.previousNode != currentNode) || (force == true)) {
        let newData = null;
        let data = this.getValue(i, j, node);
        if (data) {
          newData = new Array();
          for (let iterX = 0; iterX < data.length; iterX++) {
            const itemX = data[iterX];
            let rowName = "" + (iterX+1);
            newData[iterX] = new Array();
            newData[iterX].push(rowName);
            for (let iterY = 0; iterY < itemX.length; iterY++) {
              let itemY = itemX[iterY];
              /*
                For booleans, convert true/false values to 1/0 numbers to avoid
                the datagrid to display checkboxes instead of true/false strings.
              */
              if (typeof itemY == 'boolean') {
                if (itemY == true) {
                  itemY = 1;
                }
                else {
                  itemY = 0;
                }
              }
              newData[iterX].push(itemY);
            }
          }
        }
        /* The returned data may be null
           because when it contains a path to another JSON file,
           it is parsed asynchronously using a js promise.
           In that case we don't update the previous node and data in order to
           retry to get data later.
        */
        if (newData != null) {
          this.previousNode = currentNode;
          this.previousData = newData;
          return newData;
        }
      }
      else {
        /*
          Return cached data to avoid
          updating the widget in an infinite loop.
        */
        return this.previousData;
      }
    }
    return [];
  }

  getValueType() {
    this.typeOfValue = this.sdsService.getTypeOfValue();
    if (this.typeOfValue === 'valuesCube' || this.typeOfValue === 'valuesHyperCube') {
      this.dimI = this.sdsService.getValueDim(3);
      if (this.typeOfValue === 'valuesHyperCube') {
        this.dimJ = this.sdsService.getValueDim(4);
      }
    }
    return this.typeOfValue;
  }

  getDecoup(dimL: number , dimC: number) {
    // console.log('in ContentValue getDecoup dimL=' + dimL);
    // console.log('in ContentValue getDecoup dimC=' + dimC);
    if (this.sdsService.hasDecoup()) {
      this.decoup0_col = this.sdsService.getDecoup(0);
      this.decoup1_lig = this.sdsService.getDecoup(1);
    }
    else {
      this.decoup0_col = null;
      this.decoup1_lig = null;
    }
    // console.log('in ContentValue getDecoup this.decoup1_lig=' + this.decoup1_lig);
    // console.log('in ContentValue getDecoup this.decoup0_col=' + this.decoup0_col);
  }

  getValue(i0?: number , j0?: number, node?) {
    // console.log('in getValue i0=' + i0 + ' j0=' + j0);
    // console.log('in getValue typeOfValue=' + this.typeOfValue);
    if (i0 > this.dimI) {
      notify('i0 > ' + this.dimI, 'error', 500);
      this.i0 = 1;
    } else if (j0 > this.dimJ) {
      notify('j0 > ' + this.dimJ, 'error', 500);
      this.j0 = 1;
    } else {
      if (this.typeOfValue === 'valuesCube') {
        if (i0 == null) {
          this.matrix = this.sdsService.getCurrentValue(null, null, node);
        }
        else {
          this.matrix = this.sdsService.getCurrentValue(i0 - 1, null, node);
        }
      } else if (this.typeOfValue === 'valuesHyperCube') {
        if (i0 == null && j0 == null) {
          this.matrix = this.sdsService.getCurrentValue(null, null, node);
        }
        else {
          this.matrix = this.sdsService.getCurrentValue(i0 - 1, j0 - 1, node);
        }
      } else {
        // console.log('in ContentvalueComponent, getValue is called');
        this.matrix = this.sdsService.getCurrentValue(null, null, node);
        // console.log('in ContentvalueComponent' + this.matrix.values() );
      }
      if (this.matrix) {
        this.scalOrVect = this.matrix.length <= 1;
        if (!this.scalOrVect) {
          this.getDecoup(this.matrix.length, this.matrix[0].length);
        }
      }
    }
    return this.matrix;
  }
}
