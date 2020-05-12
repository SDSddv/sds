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

enum styleOperation {
  Highlight,
  Dishighlight,
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
  editedColumnIdx = null;
  editedRowIdx = null;
  loadPanelProps: any = {
    enabled: true,
    showIndicator: true,
    showPane: true,
    text: "Loading data..."
  };
  columnElementArray = new Array();
  rowElementArray = new Array();
  nodesToHighlightArray = new Array();

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
    Reloads the data grid component.
  */
  refreshDataGrid() {
    if (this.dataGrid && this.dataGrid.instance) {
      /* Get the value type in case of the data structure has a shape modification. */
      this.getValueType();
      this.getData(this.i0, this.j0, true);
      this.dataGrid.instance.refresh();
    }
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
    this.refreshDataGrid();
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
          /* Fixing the first column width. */
          columns[iter].width = 250;
          if (!this.scalOrVect) {
            if (this.decoup0_col && this.decoup1_lig) {
              let verticalNodeName = this.getDecoupMatrixName(1);
              let verticalNode = this.sdsService.getNodeDescByName(verticalNodeName);
              let verticalCaption = verticalNodeName;
              let horizontalNodeName = this.getDecoupMatrixName(0);
              let horizontalNode = this.sdsService.getNodeDescByName(horizontalNodeName);
              let horizontalCaption = horizontalNodeName;
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
              if (verticalNode && verticalNode.unit != null) {
                verticalCaption += " (" + verticalNode.unit + ")";
              }
              if (horizontalNode && horizontalNode.unit != null) {
                horizontalCaption += " (" + horizontalNode.unit + ")";
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
    Validates an highlighted column data.
    The column is dishighlighted.
  */
  onValidateColumn(position) {
    for (let iter = 0; iter < this.columnElementArray.length; iter++) {
      let element = this.columnElementArray[iter].cellElement;
      let type = this.columnElementArray[iter].rowType;
      let index = this.columnElementArray[iter].rowIndex;
      this.columnElementHighlight(element, type, index, styleOperation.Dishighlight);
    }
    this.columnElementArray.length = 0;
    /*
      Reset the nodes to highlight array when any column has been validated.
    */
    this.nodesToHighlightArray.length = 0;
  }

  /*
    Validates an highlighted row data.
    The row is dishighlighted.
  */
  onValidateRow(position) {
    for (let iter = 0; iter < this.rowElementArray.length; iter++) {
      let element = this.rowElementArray[iter].cellElement;
      let type = this.rowElementArray[iter].rowType;
      let index = this.rowElementArray[iter].columnIndex;
      this.rowElementHighlight(element, type, index, styleOperation.Dishighlight);
    }
    this.rowElementArray.length = 0;
    /*
      Reset the nodes to highlight array when any row has been validated.
    */
    this.nodesToHighlightArray.length = 0;
  }

  /*
    Gets the border style when highlighting/dishighlighting a column/row.
  */
  getBorderStyle(operation) {
    let borderColor = "";
    let borderStyle = "";
    let borderWidth = "";
    if (operation == styleOperation.Highlight) {
      borderColor = "#337ab7"; // Devextreme light blue
      borderStyle = "solid";
      borderWidth = "2px";
    }
    return {color: borderColor, style: borderStyle, width: borderWidth};
  }

  /*
    Highlights/dishighlights a column element.
  */
  columnElementHighlight(element, elementType, index, operation) {
    if (element) {
      let rowsCount = this.dataGrid.instance.totalCount();
      let border = this.getBorderStyle(operation);
      let borderColor = border.color;
      let borderStyle = border.style;
      let borderWidth = border.width;
      /* Update the top border for the first column. */
      if (elementType == "header") {
        element.style.borderTopColor = borderColor;
        element.style.borderTopStyle = borderStyle;
        element.style.borderTopWidth = borderWidth;
      }
      else {
        /* Update the bottom border for the last column. */
        if (index == rowsCount - 1) {
          element.style.borderBottomColor = borderColor;
          element.style.borderBottomStyle = borderStyle;
          element.style.borderBottomWidth = borderWidth;
        }
      }
      /* Update the right/left borders for the other column items. */
      element.style.borderLeftColor = borderColor;
      element.style.borderLeftStyle = borderStyle;
      element.style.borderLeftWidth = borderWidth;
      element.style.borderRightColor = borderColor;
      element.style.borderRightStyle = borderStyle;
      element.style.borderRightWidth = borderWidth;
    }
  }

  /*
    Highlights/dishighlights a row element.
  */
  rowElementHighlight(element, elementType, index, operation) {
    if (element) {
      let columnCount = this.dataGrid.instance.columnCount()
      let border = this.getBorderStyle(operation)
      let borderColor = border.color;
      let borderStyle = border.style;
      let borderWidth = border.width;
      /* Update the left border for the first row. */
      if (index == 0) {
        element.style.borderLeftColor = borderColor;
        element.style.borderLeftStyle = borderStyle;
        element.style.borderLeftWidth = borderWidth;
      }
      else {
        /* Update the right border for the last row item. */
        if (index == columnCount - 1) {
          element.style.borderRightColor = borderColor;
          element.style.borderRightStyle = borderStyle;
          element.style.borderRightWidth = borderWidth;
        }
      }
      /* Update the top/bottom borders for the other row items. */
      element.style.borderTopColor = borderColor;
      element.style.borderTopStyle = borderStyle;
      element.style.borderTopWidth = borderWidth;
      element.style.borderBottomColor = borderColor;
      element.style.borderBottomStyle = borderStyle;
      element.style.borderBottomWidth = borderWidth;
    }
  }

  /*
    Cell rendering handler.
  */
  onCellPrepared(e) {
    let backgroundColor = "#f5f5f5"; // Devextreme light grey
    /* Change the background color of the columns headers. */
    if (e.rowType == "header") {
      e.cellElement.style.backgroundColor = backgroundColor;
    }
    else if (e.rowType == "data") {
      /* Change the background color of the first column of the data cells. */
      if (e.columnIndex == 0) {
          e.cellElement.style.backgroundColor = backgroundColor;
      }
    }
    let currentNode = this.sdsService.getCurrentNode();
    let valueType = this.getValueType();
    if (this.nodesToHighlightArray) {
      for (let iter = 0; iter < this.nodesToHighlightArray.length; iter++) {
        let item = this.nodesToHighlightArray[iter];
        if (item && item.node == currentNode.name) {
          if (item.direction == operationDirection.Column) {
          /*
            If a column has been inserted, highlight it.
          */
          if (e.columnIndex == item.position) {
              /*
                Memorize the column data that are highlighted in order to dishighlight them later.
              */
              this.columnElementArray.push({cellElement: e.cellElement, rowType: e.rowType, rowIndex: e.rowIndex});
              this.columnElementHighlight(e.cellElement, e.rowType, e.rowIndex, styleOperation.Highlight);
            }
          }
          else {
            /*
              If a row has been inserted, highlight it.
            */
            if (e.rowIndex == item.position) {
              /*
                Memorize the row data that are highlighted in order to dishighlight them later.
              */
              this.rowElementArray.push({cellElement: e.cellElement, rowType: e.rowType, columnIndex: e.columnIndex});
              this.rowElementHighlight(e.cellElement, e.rowType, e.columnIndex, styleOperation.Highlight);
            }
          }
          break;
        }
      }
    }
  }

  /*
    Cell edition start handler.
  */
  onEditingStart(e) {
    this.editedColumnIdx = e.column.index;
    this.editedRowIdx = e.component.getRowIndexByKey(e.key);
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
    Checks if the provided row & column cell indexes belongs to an highlighted row/column.
    If so, returns the highlighted row/column data.
  */
  getMatchingHighlightedDataInfo(rowIndex, colIndex) {
    let highlightedDataInfo = null;
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode && this.nodesToHighlightArray) {
      for (let iter = 0; iter < this.nodesToHighlightArray.length; iter++) {
        let highlightedItem = this.nodesToHighlightArray[iter];
        if (highlightedItem && highlightedItem.node == currentNode.name) {
          if (highlightedItem.direction == operationDirection.Row && highlightedItem.position == rowIndex) {
            highlightedDataInfo = highlightedItem;
            break;
          }
          else if (highlightedItem.direction == operationDirection.Column && highlightedItem.position == colIndex) {
            highlightedDataInfo = highlightedItem;
            break;
          }
        }
      }
    }
    return highlightedDataInfo;
  }

  /*
    Cell edition end handler.
  */
  onContentReady(e) {
    let items = this.getDataSourceItems();
    let lastEditedCellData = this.sdsService.getLastEditedCell();
    /* Check if some cell content has changed. */
    if (items) {
      if (this.hasCellContentChanged(lastEditedCellData, items)) {
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
                    currentProperties.type == 'bool') {
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
        /* Validate the row/column data when a value has been edited in an highlighted row/column. */
        let highlightedCellInfo = this.getMatchingHighlightedDataInfo(this.editedRowIdx, this.editedColumnIdx);
        if (highlightedCellInfo) {
          if (highlightedCellInfo.direction == operationDirection.Row) {
            this.onValidateRow(highlightedCellInfo.position);
          }
          else if (highlightedCellInfo.direction == operationDirection.Column) {
            this.onValidateColumn(highlightedCellInfo.position);
          }
          this.editedRowIdx = null;
          this.editedColumnIdx = null;
        }
      }
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
      if ((type == 'bool') ||
          (type == 'int32')) {
        lerpValue = Math.floor(lerpValue);
        /*
          Manage the lerp overflows for booleans by setting the value to 0.
        */
        if (type == 'bool') {
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
    Computes a row cell value from its neighbours values.
  */
  computeRowCellValueFromNeighbours(rowPosition, colPosition, data) {
    if (!data) {
      return null;
    }
    /*
      If the data,array only contains a value,
      we are not able to perform a linear interpolation/extrapolation
      between two points.
    */
    if (data.length < 2) {
      return null;
    }
    let value1Position = rowPosition-1;
    if (rowPosition >= data.length) {
      value1Position = rowPosition-2;
    }
    else if (rowPosition == 0) {
      value1Position = rowPosition;
    }
    let row1 = data[value1Position];
    let value1 = row1[colPosition];

    let value2Position = rowPosition;
    if (rowPosition >= data.length) {
      value2Position = rowPosition-1;
    }
    else if (rowPosition == 0) {
      value2Position = rowPosition+1;
    }
    let row2 = data[value2Position];
    let value2 = row2[colPosition];

    let distance = 0.5;
    if (rowPosition >= data.length) {
      distance = 2;
    }
    else if (rowPosition == 0) {
      distance = -1;
    }
    let lerpValue = this.lerp(value1, value2, distance);
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode && currentNode instanceof Matrix) {
      let type = currentNode.type;
      /* For booleans && integers keep the decimal part of the lerp computation. */
      if ((type == 'bool') ||
          (type == 'int32')) {
        lerpValue = Math.floor(lerpValue);
        /*
          Manage the lerp overflows for booleans by setting the value to 0.
        */
        if (type == 'bool') {
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
                  // Default value is 0 for integers & floats and false (i.e 0) for booleans.
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
                    // Default value is 0 for integers & floats and false (i.e 0) for booleans.
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
                // Default value is 0 for integers & floats and false (i.e 0) for booleans.
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
    Creates/deletes data at the provided position in the scales nodes (if any) associated to the current node.
  */
  setScalesNodeData(position: number, operation: operationKind, direction: operationDirection) {
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
            /*
              Memorize the node to highlight info.
            */
            this.nodesToHighlightArray.push({node: node.name, position: position, direction: operationDirection.Column});
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
    Creates/deletes data in a matrix node that references a scale vector at the provided position.
  */
  setMatrixesNodeData(position: number, operation: operationKind, direction: operationDirection) {
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
            let direction = null;
            let refIndex = matrixRef.index;
            /*
              If the index is 0 (i.e dimensions[0].scale attribute we manipulate the columns of the scaled matrix.
              If the index is 1 (i.e dimensions[1].scale attribute we manipulate the rows of the scaled matrix.
            */
            if (refIndex == 0) {
              direction = operationDirection.Column;
              this.setColumnData(position, operation, matrixRef.dataStructure);
            }
            else if (refIndex == 1) {
              direction = operationDirection.Row;
              this.setRowData(position-1, operation, matrixRef.dataStructure);
            }
            if (direction == operationDirection.Row) {
              /*
                Rows starts at 0 while columns starts at 1.
              */
              position = position - 1;
            }
            /*
              Memorize the node to highlight info.
            */
            this.nodesToHighlightArray.push({node: matrixRef.dataStructure.name, position: position, direction: direction});
            this.sdsService.addNodeIcon(matrixRef.dataStructure.name, "warning");
          }
        }
      }
    }
  }

  /* Creates/deletes data for the current node references in the SDS tree. */
  setNodeRefsData(position: number, operation: operationKind, direction: operationDirection) {
    /* Update the scales nodes data. */
    this.setScalesNodeData(position, operation, direction);
    /* Update the nodes data that references a scale. */
    this.setMatrixesNodeData(position, operation, direction);
  }

  /*
    Transforms matrix data to cube data.
  */
  transformMatrixToCubeData(currentData) {
    let newDimensionData = 0;
    let newData = null;
    let dataId = 1;
    if (currentData) {
      newData = new Array();
      let dataArray = new Array();
      let dataIdStr = "" + dataId;
      dataArray.push(dataIdStr);
      for (let iterData = 0; iterData < currentData.length; iterData++) {
        let utilDataItem = null;
        let dataItem = currentData[iterData];
        if (dataItem) {
          utilDataItem = dataItem.slice(1, dataItem.length);
          if (utilDataItem) {
            dataArray.push(utilDataItem);
          }
        }
      }
      let newValueArray = null;
      dataId++;
      if (dataArray && dataArray.length > 0) {
        newData.push(dataArray);
        let dataArray2 = new Array();
        let dataIdStr = "" + dataId;
        dataArray2.push(dataIdStr);
        for (let iter = 1; iter <= dataArray.length; iter++) {
          let dataItem = dataArray[iter];
          if (dataItem) {
            newValueArray = new Array();
            for (let iterCol = 0; iterCol < dataItem.length; iterCol++) {
              newValueArray.push(newDimensionData);
            }
            dataArray2.push(newValueArray);
          }
        }
        newData.push(dataArray2);
      }
    }
    return newData;
  }

  /*
    Transforms cube data to hypercube data.
  */
  transformCubeToHypercubeData(currentData) {
    let newDimensionData = 0;
    let newData = null;
    let dataId = 1;
    let dataArray2 = null;
    if (currentData) {
      newData = new Array();
      let dataArray = new Array();
      let dataIdStr = "" + dataId;
      dataArray.push(dataIdStr);
      for (let iterData = 0; iterData < currentData.length; iterData++) {
        let utilDataItem = null;
        let dataItem = currentData[iterData];
        if (dataItem) {
          utilDataItem = dataItem.slice(1, dataItem.length);
          if (utilDataItem) {
            dataArray.push(utilDataItem);
          }
        }
      }
      let newValueArray = null;
      dataId++;
      if (dataArray && dataArray.length > 0) {
        newData.push(dataArray);
        let dataArray3 = new Array();
        let dataIdStr = "" + dataId;
        dataArray3.push(dataIdStr);
        let dataItem = dataArray.slice(1, dataArray.length);
        let rowsCount = dataItem.length;
        for (let iter = 0; iter < rowsCount; iter++) {
          if (dataItem) {
            dataArray2 = new Array();
            for (let iterRow = 0; iterRow < dataItem[0].length; iterRow++) {
              let colCount = dataItem[iter].length;
              if (dataItem[iter][0] && dataItem[iter][0] instanceof Array) {
                colCount = dataItem[iter][0].length;
              }
              newValueArray = new Array();
              for (let iterCol = 0; iterCol < colCount; iterCol++) {
                newValueArray.push(newDimensionData);
              }
              dataArray2.push(newValueArray);
            }
          }
          if (iter < rowsCount) {
            dataArray3.push(dataArray2)
          }
        }
        newData.push(dataArray3);
      }
    }
    return newData;
  }

  /*
    Add dimension handler.
  */
  onAddDimension(dimensionsCount?) {
    let data = this.getData(null, null, true);
    if (data) {
      let valueType = this.getValueType();
      /* For scalars & vectors, add a new row. */
      if (valueType == "value" || valueType == "valuesVect") {
        if (dimensionsCount > 0) {
          this.onAddRow(1);
        }
      }
      else if (valueType == "valuesMatrix") {
        /*
          Creating the new dimension data.
        */
        let cubeData = this.transformMatrixToCubeData(data);
        if (cubeData) {
          /*
            Extracting the useful data in order to update the current node value.
          */
          let usefulData = this.extractUsefulData(cubeData);
          if (usefulData) {
            for (let iter = 0; iter < usefulData.length; iter++) {
              let item = usefulData[iter];
              if (item) {
                /*
                  Setting the cube portions for the current node.
                  As the current data structure becomes a cube we force its type.
                */
                this.sdsService.setCurrentValue(item, iter, 0, null, "valuesCube");
              }
            }
          }
        }
      }
      else if (valueType == "valuesCube") {
        /*
          Creating the new dimension data.
        */
        let hypercubeData = this.transformCubeToHypercubeData(data);
        if (hypercubeData) {
          /*
            Extracting the useful data in order to update the current node value.
          */
          let usefulData = this.extractUsefulData(hypercubeData);
          if (usefulData) {
            for (let iterJ = 0; iterJ < usefulData.length; iterJ++) {
              let item = usefulData[iterJ];
              if (item) {
                for (let iterI = 0; iterI < item.length; iterI++) {
                  let item2 = item[iterI];
                  if (item2) {
                    /*
                      Setting the hypercube portions for the current node.
                      As the current data structure becomes an hypercube we force its type.
                    */
                    this.sdsService.setCurrentValue(item2, iterJ, iterI, null, "valuesHyperCube");
                  }
                }
              }
            }
          }
        }
      }
      this.refreshDataGrid();
    }
  }

  /*
    Transforms a cube data to a matrix data.
  */
  transformCubeToMatrixData(currentData) {
    let newData = null;
    let dataId = 1;
    if (currentData) {
      newData = new Array();
      let dataIdStr = "" + dataId;
      let dataItem = currentData[0];
      if (dataItem) {
        for (let iter = 0; iter < dataItem.length; iter++) {
          let dataArray = new Array();
          let item = dataItem[iter];
          if (item) {
            if (item instanceof Array) {
              dataArray.push(dataIdStr);
              for (let iterCol = 0; iterCol < item.length; iterCol++) {
                let itemValue = item[iterCol];
                if (itemValue != null) {
                  dataArray.push(itemValue);
                }
              }
              dataId++;
              dataIdStr = "" + dataId;
              if (dataArray.length > 1) {
                newData.push(dataArray);
              }
            }
          }
        }
      }
    }
    return newData;
  }

  /*
    Transforms an hyper cube data to a cube data.
    This is exactly the same transformation from cube to matrix.
  */
  transformHypercubeToCubeData(currentData) {
    return this.transformCubeToMatrixData(currentData);
  }

  /*
    Delete dimension handler.
  */
  onDeleteDimension(dimensionsCount?) {
    let data = this.getData(null, null, true);
    if (data) {
      let valueType = this.getValueType();
      let columnsCount = this.sdsService.getValueDim(1);
      let rowsCount = this.sdsService.getValueDim(2);
      if (valueType == "value" || valueType == "valuesVect") {
        if (dimensionsCount > 0) {
          this.onDeleteRow(1);
        }
        else {
          /*
            Delete all the columns except the first one (in reverse: deleting the last columns first).
            Reminder: columns starts at 1.
          */
          for (let iter = columnsCount; iter > 1; iter--) {
            this.onDeleteColumn(iter);
          }
        }
      }
      else if (valueType == "valuesMatrix") {
        /*
          Delete all the rows except the first one (in reverse: deleting the last rows first).
          Reminder: rows starts at 0.
        */
        for (let iter = rowsCount; iter > 0; iter--) {
          this.onDeleteRow(iter);
        }
      }
      else if (valueType == "valuesCube") {
        let matrixData = this.transformCubeToMatrixData(data);
        if (matrixData) {
          /*
            Extracting the useful data in order to update the current node value.
          */
          let usefulData = this.extractUsefulData(matrixData);
          if (usefulData) {
            /*
              Setting the current node value.
              As the current data structure becomes a matrix we force its type.
            */
            this.sdsService.setCurrentValue(usefulData, 0, 0, null, "valuesMatrix");
          }
        }
      }
      else if (valueType == "valuesHyperCube") {
        let cubeData = this.transformHypercubeToCubeData(data);
        if (cubeData) {
          /*
            Extracting the useful data in order to update the current node value.
          */
          let usefulData = this.extractUsefulData(cubeData);
          if (usefulData) {
            for (let iter = 0; iter < usefulData.length; iter++) {
              let item = usefulData[iter];
              if (item) {
                /*
                  Setting the current node value.
                  As the current data structure becomes a cube we force its type.
                */
                this.sdsService.setCurrentValue(item, iter, 0, null, "valuesCube");
              }
            }
          }
        }
      }
      this.refreshDataGrid();
    }
  }

  /*
    Column creation handler.
  */
  onAddColumn(position) {
    let operation = operationKind.AddData;
    let direction = operationDirection.Column;
    console.log("Adding new column at position: " + position);
    /*
      When inserting a new column,
      all previously unvalidated rows/columns (if any) are
      automatically validated by resetting the array.
    */
    this.nodesToHighlightArray.length = 0;
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode) {
      /*
        Memorize the node to highlight info.
      */
      this.nodesToHighlightArray.push({node: currentNode.name, position: position, direction: direction});
    }
    this.setColumnData(position, operation);
    this.setNodeRefsData(position, operation, direction);
    this.refreshDataGrid();
  }

  /*
    Column deletion handler.
  */
  onDeleteColumn(position) {
    let operation = operationKind.DeleteData;
    let direction = operationDirection.Column;
    console.log("Deleting column at position: " + position)
    this.setColumnData(position, operation);
    this.setNodeRefsData(position, operation, direction);
    /*
      When deleting a column,
      any previously unvalidated rows/columns (if any) are
      automatically validated by resetting the array.
    */
    this.nodesToHighlightArray.length = 0;
    this.refreshDataGrid();
  }

  /*
    Creates/deletes row data at the provided position according to the provided operation kind and
    updates the SDS tree values and properties accordingly.
  */
  setRowData(position: number, operation: operationKind, node?) {
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode instanceof Matrix) {
      let valueType = this.getValueType();
      if (valueType == "valuesCube") {
        for (let iter = 0; iter < this.dimI; iter++) {
          let data = this.getData(iter+1, this.j0, true, node);
          if (data) {
            let pos = position-1;
            if (!position) {
              pos = position;
            }
            let item = data[pos];
            let itemId = item[0];
            let itemLen = item.length;
            let newData = new Array();
            for (let iterX = 0; iterX < itemLen; iterX++) {
              if (iterX == 0) {
                let id = +itemId;
                id++;
                newData.push(""+id);
              }
              else {
                let cellValue = this.computeRowCellValueFromNeighbours(position, iterX, data);
                if (cellValue == null) {
                  // Default value is 0 for integers & floats and false (i.e 0) for booleans.
                  cellValue = 0;
                }
                newData.push(cellValue);
              }
            }
            if (operation == operationKind.AddData) {
              data.splice(position, 0, newData);
            }
            else {
              data.splice(position, 1);
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
            let data = this.getData(iter+1, iter2+1, true, node);
            if (data) {
              let pos = position-1;
              if (!position) {
                pos = position;
              }
              let item = data[pos];
              let itemId = item[0];
              let itemLen = item.length;
              let newData = new Array();
              for (let iterX = 0; iterX < itemLen; iterX++) {
                if (iterX == 0) {
                  let id = +itemId;
                  id++;
                  newData.push(""+id);
                }
                else {
                  let cellValue = this.computeRowCellValueFromNeighbours(position, iterX, data);
                  if (cellValue == null) {
                    // Default value is 0 for integers & floats and false (i.e 0) for booleans.
                    cellValue = 0;
                  }
                  newData.push(cellValue);
                }
              }
              if (operation == operationKind.AddData) {
                data.splice(position, 0, newData);
              }
              else {
                data.splice(position, 1);
              }
              let newItems = this.extractUsefulData(data);
              /* Update the modified content in the SDS. */
              this.sdsService.setCurrentValue(newItems, iter, iter2, node);
            }
          }
        }
      }
      else {
        let data = this.getData(this.i0, this.j0, true, node);
        if (data) {
          let pos = position-1;
          if (!position) {
            pos = position;
          }
          let item = data[pos];
          if (!item) {
            console.error("Unable to find data item at position " + pos);
            return;
          }
          let itemId = item[0];
          let itemLen = item.length;
          let newData = new Array();
          for (let iterX = 0; iterX < itemLen; iterX++) {
            if (iterX == 0) {
              let id = +itemId;
              id++;
              newData.push(""+id);
            }
            else {
              let cellValue = this.computeRowCellValueFromNeighbours(position, iterX, data);
              if (cellValue == null) {
                // Default value is 0 for integers & floats and false (i.e 0) for booleans.
                cellValue = 0;
              }
              newData.push(cellValue);
            }
          }
          if (operation == operationKind.AddData) {
            data.splice(position, 0, newData);
          }
          else {
            data.splice(position, 1);
          }
          let newItems = this.extractUsefulData(data);
          /* Update the modified content in the SDS. */
          this.sdsService.setCurrentValue(newItems, (this.i0 - 1), (this.j0 - 1), node);
        }
      }
      /* Get data again to force to recompute first columns of each row. */
      this.getData(this.i0, this.j0, true);
    }
  }

  /*
    Row creation handler.
  */
  onAddRow(position) {
    let operation = operationKind.AddData;
    let direction = operationDirection.Row;
    console.log("Adding new row at position: " + position);
    /*
      When inserting a new row,
      all previously unvalidated rows/columns (if any) are
      automatically validated by resetting the array.
    */
    this.nodesToHighlightArray.length = 0;
    let currentNode = this.sdsService.getCurrentNode();
    if (currentNode) {
      /*
        Memorize the node to highlight info.
      */
      this.nodesToHighlightArray.push({node: currentNode.name, position: position, direction: direction});
    }
    this.setRowData(position, operation);
    this.setNodeRefsData(position+1, operation, direction);
    this.refreshDataGrid();
  }

  /*
    Row deletion handler.
  */
  onDeleteRow(position) {
    let operation = operationKind.DeleteData;
    let direction = operationDirection.Row;
    console.log("Deleting row at position: " + position)
    this.setRowData(position, operation);
    this.setNodeRefsData(position+1, operation, direction);
    /*
      When deleting a row,
      any previously unvalidated rows/columns (if any) are
      automatically validated by resetting the array.
    */
    this.nodesToHighlightArray.length = 0;
    this.refreshDataGrid();
  }

  /*
    Gets the highlighted item (if any) matching the provided node name.
    If the node has no highlighted data, null is returned.
  */
  getHighlightedItem(nodeName) {
    let highlightedItem = null;
    if (this.nodesToHighlightArray) {
      for (let iter = 0; iter < this.nodesToHighlightArray.length; iter++) {
        let item = this.nodesToHighlightArray[iter];
        if (item && item.node == nodeName) {
          highlightedItem = item;
          break;
        }
      }
    }
    return highlightedItem;
  }

  /*
    Contextual menu handler.
  */
  onContextMenuPreparing(e) {
    if (e) {
      let currentNode = this.sdsService.getCurrentNode();
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
          If a column is highlighted, allow the user to accept the modification
          in order to dishighlight it.
        */
        let item = this.getHighlightedItem(currentNode.name);
        if (item != null) {
          if (item.direction == operationDirection.Column) {
            if (e.columnIndex == item.position) {
              items.unshift(
                {
                  text: 'Validate column',
                  icon: 'check',
                  onClick: this.onValidateColumn.bind(this, e.columnIndex)
                }
              );
            }
          }
        }
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
        /*
          On the first column element of the header,
          the user has also the ability to add a new row.
        */
        if (e.columnIndex == 0) {
          items.unshift(
            {
              text: 'Insert row after',
              icon: 'add',
              onClick: this.onAddRow.bind(this, (e.rowIndex))
            }
          );
        }
      }
      else {
        /* Right click was done on a row. */
        /*
          If a row is highlighted, allow the user to accept the modification
          in order to dishighlight it.
        */
        let item = this.getHighlightedItem(currentNode.name);
        if (item != null) {
          if (item.direction == operationDirection.Row) {
            if (e.rowIndex == item.position) {
              items.unshift(
                {
                  text: 'Validate row',
                  icon: 'check',
                  onClick: this.onValidateRow.bind(this, e.rowIndex)
                }
              );
            }
          }
        }
        /* Deleting a row is not allowed when the data only contains one row. */
        if (dataItems && (dataItems.length >= 2)) {
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
