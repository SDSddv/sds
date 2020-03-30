import { Component, OnInit } from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {nullProp, Properties} from './Properties';
import notify from 'devextreme/ui/notify';
import {DxSelectBoxModule} from "devextreme-angular";

@Component({
  selector: 'app-contentprop',
  templateUrl: './contentprop.component.html',
  styleUrls: ['./contentprop.component.css']
})
export class ContentpropComponent implements OnInit {
  prop: Properties;

  allowedDataTypes: string[] = [
    "boolean",
    "integer",
    "float"
  ];

  constructor(private sdsService: SdstreeService) {
    this.prop = new Properties();
  }

  ngOnInit() {
  }

  onFormSubmit = function(e) {
    notify({
      message: "You have submitted the form",
      position: {
          my: "center bottom",
          at: "center bottom"
      }
    }, "success", 3000);
    e.preventDefault();
  }


  getProperties() {
    this.prop = nullProp;
    // console.log('in getProperties before get this.prop = ' + this.propToString());
    this.prop = this.sdsService.getCurrentNodeProperties();
    // console.log('in getProperties after get this.prop = ' + this.propToString());
    return true ;
  }

  propToString(): string {
    let res: string;
    res = 'name=' + this.prop.name ;
    res = res + ',comment=' + this.prop.comment;
    if (this.prop.history) {  res = res + ',history=' + this.prop.history; };
    if (this.prop.type) {  res = res + ',type=' + this.prop.type; };
    if (this.prop.unit) {  res = res + ',unit=' + this.prop.unit; };
    if (this.prop.dimensions) {
      for (const dim of  this.prop.dimensions) {
        res = res + ',dimension.size=' + dim.size;
        if (dim.scale) {  res = res + ',dimension.scale=' + dim.scale; };
      }
    }
    if (this.prop.variants) {
      for (const vari of  this.prop.variants) {
        res = res + ',variants.name=' + vari.name;
        if (vari.comment) {  res = res + ',variants.comment=' + vari.comment; };
      }
    }
    return res;
  }

}
