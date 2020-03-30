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

  constructor(private sdsService: SdstreeService) {
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
    Custonizes the columns captions (titles) to display in the grid view.
  */
  customizeColumns(columns) {
    if (columns) {
      for (let iter = 0; iter < columns.length; iter++) {
        if (iter == 0) {
          columns[iter].caption = "Row Id / Column ID";
          columns[iter].allowEditing = false;
        }
        else {
          let caption = +columns[iter].caption;
          caption -= 1;
          if (caption < 0) {
            caption = 0;
          }
          columns[iter].caption = ""+caption
        }
        columns[iter].alignment = "center";
      }
    }
  }

  onContentReady(e) {
/*
    console.log(e.component)
    if (this.columnsReordered(e.component)) {
      console.log("Columns reordered")

    }
    else {
      console.log("Columns NOT reordered")

    }
 */
  }

  /*
    Row creation handler.
  */
  onInitNewRow(e) {
  /*
    console.log("Adding new row")
  */
  }

  /*
    Rows reordering handler.
  */
 onReorderRow(e) {
  /*
    console.log("Reordering row")
    let visibleRows = e.component.getVisibleRows();
    console.log("visibleRows: ")
    console.log(visibleRows)
    console.log("toIndex: ")
    console.log(e.toIndex)
    console.log("itemData: ")
    console.log(e.itemData)
  */
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
          /*
          if (!this.scalOrVect) {
            console.log(this.decoup0_col)
            console.log(this.decoup1_lig)
          }
          */
          for (let iterX = 0; iterX < data.length; iterX++) {
            const itemX = data[iterX];
            let rowName = "" + iterX;
            newData[iterX] = new Array();
            newData[iterX].push(rowName);
            for (let iterY = 0; iterY < itemX.length; iterY++) {
              const itemY = itemX[iterY];
              newData[iterX].push(itemY);
            }
          }
        }
//        console.log(newData);

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
