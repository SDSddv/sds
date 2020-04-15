import {Component, OnInit, ViewChild} from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import notify from 'devextreme/ui/notify';
import {Matrix} from '../../models/sdstree/SDSMatrix';
import {DxDataGridComponent} from 'devextreme-angular';

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
              columns[iter].caption = "Row Id / Column ID";
            }
          }
          else {
            columns[iter].caption = "Row Id / Column ID";
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
    Column creation handler.
  */
  onAddColumn(position) {
    console.log("Adding new column at position: " + position)
    let data = this.getData(this.i0, this.j0, true);
    if (data) {
      for (let iterX = 0; iterX < data.length; iterX++) {
        let item = data[iterX];
        if (item) {
          item.splice(position, 0, "three");
        }
      }
      this.dataGrid.instance.refresh();
    }
  }

  /*
    Column deletion handler.
  */
  onDeleteColumn(position) {
    console.log("Deleting column at position: " + position)
    let data = this.getData(this.i0, this.j0, true);
    if (data) {
      if (data.length >= position) {
        data.splice(position, 1);
      }
      this.dataGrid.instance.refresh();
    }
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
  getData(i?: number , j?: number, force?:boolean) {
    if (this.sdsService) {
      let currentNode = this.sdsService.getCurrentNode();
      if ((this.previousNode != currentNode) || (force == true)) {
        this.getValueType();
        let newData = null;
        let data = this.getValue(i, j);
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
      this.dimI = this.sdsService.getValueDim(1);
      if (this.typeOfValue === 'valuesHyperCube') {
        this.dimJ = this.sdsService.getValueDim(2);
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

  getValue(i0?: number , j0?: number) {
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
        this.matrix = this.sdsService.getCurrentValue(i0 - 1);
      } else if (this.typeOfValue === 'valuesHyperCube') {
        this.matrix = this.sdsService.getCurrentValue(i0 - 1, j0 - 1);
      } else {
        // console.log('in ContentvalueComponent, getValue is called');
        this.matrix = this.sdsService.getCurrentValue();
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
