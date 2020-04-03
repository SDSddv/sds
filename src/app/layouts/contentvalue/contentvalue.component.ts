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
    Custonizes the columns captions (titles) to display in the grid view.
  */
  customizeColumns(columns) {
    if (columns) {
      let data = this.getData(this.i0, this.j0);
      for (let iter = 0; iter < columns.length; iter++) {
        if (iter == 0) {
          if (!this.scalOrVect) {
            columns[iter].caption = "Altitude / Mach";
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
//        columns[iter].allowSorting = false;
      }
    }
  }

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

  onEditingStart(e) {
    /* Do not take a reference on e.data array, make a deep copy. */
    let lastEditedCellData = Object.assign([], e.data);
    this.sdsService.setLastEditedCell(lastEditedCellData)
  }

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
  onInitNewRow(e) {
    console.log("Adding new row")
  }

  onInitNewColumn(position) {
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

  onContextMenuPreparing(e) {
    if (e) {
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
        items.unshift(
          {
            text: 'Add column',
            icon: 'columnfield',
            onClick: this.onInitNewColumn.bind(this, (e.columnIndex + 1))
          }
        );
      }
      else {
        /* Right click was done on a row. */
        items.unshift(
          {
            text: 'Add row',
            icon: 'rowfield',
            onClick: this.onInitNewRow.bind(this)
          }
        );
      }
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
    } else {
        const vL: number[] = new Array(this.dimI);
        for (let i = 0; i < dimL; i++) {
          vL[i] = i + 1;
        }
        this.decoup1_lig = vL;
        const vC: number[] = new Array(this.dimJ);
        for (let i = 0; i < dimC; i++) {
          vC[i] = i + 1;
        }
        this.decoup0_col = vC;
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
