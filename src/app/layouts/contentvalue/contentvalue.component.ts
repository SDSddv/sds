import {Component, OnInit} from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-contentvalue',
  templateUrl: './contentvalue.component.html',
  styleUrls: ['./contentvalue.component.css']
})
export class ContentvalueComponent implements OnInit {

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

  constructor(private sdsService: SdstreeService) { }

  ngOnInit() {
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
      this.scalOrVect = this.matrix.length <= 1;
      if (!this.scalOrVect) {
        this.getDecoup(this.matrix.length, this.matrix[0].length);
      }
    }
    return this.matrix;
  }

}
