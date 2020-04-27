import { Component, OnInit, ViewChild } from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {nullProp, Properties} from './Properties';
import notify from 'devextreme/ui/notify';
import {DxSelectBoxModule, DxSelectBoxComponent} from "devextreme-angular";

@Component({
  selector: 'app-contentprop',
  templateUrl: './contentprop.component.html',
  styleUrls: ['./contentprop.component.css']
})
export class ContentpropComponent implements OnInit {
  @ViewChild('frm', { static: true })userFrm;
  @ViewChild(DxSelectBoxComponent, { static: false }) selectBox: DxSelectBoxComponent;
  prop: Properties;
  private groupItem = null;
  private currentNode = null;
  private isFormValid = true;

  allowedDataTypes: string[] = [
    "boolean",
    "integer",
    "float"
  ];

  constructor(private sdsService: SdstreeService) {
    this.sdsService.setContentPropInstance(this);
    this.getProperties();
    this.setCurrentNode(this.sdsService.getCurrentNode());
    this.validationCallback = this.validationCallback.bind(this);
  }

  ngOnInit() {
  }

  setCurrentNode(node) {
    this.currentNode = node;
  }

  getCurrentNode() {
    return this.currentNode;
  }

  /*
    Form data validation handler.
  */
  validationCallback(e) {
    if (e.value) {
      this.isFormValid = true;
    }
    else if (!e.value || e.value == " ") {
      this.isFormValid = false;
    }
    return this.isFormValid;
  }

  /*
    Updates the select box value when the user has changed
    the current node in the tree view.
    FIXME: This shouldn't be necessary !
  */
  updateFormData() {
    if (this.selectBox) {
      let selectBoxInstance = this.selectBox.instance;
      if (selectBoxInstance) {
        this.getProperties();
        if (this.prop.type) {
          selectBoxInstance.option('value', this.prop.type);
        }
      }
    }
  }

  /*
    Allows to track form items that are part of an array by their index.
  */
   trackArray(index, item) {
    return index;
  }

  /*
    Type property change handler.
  */
  onValueChanged(e) {
    if (e) {
      let currentNode = this.getCurrentNode();
      let currentSdsNode = this.sdsService.getCurrentNode();
      /*
        FIXME: this is a hack to not auto submit the form
        when select box content is updated when changing the
        current node in the tree view.
      */
      if (currentNode != currentSdsNode) {
        return;
      }
      /*
        Autosubmit the form when the type has changed.
      */
      if (!this.userFrm) {
        console.error("Failed to retrieve the form instance.");
        return;
      }
      this.userFrm.ngSubmit.emit();
      /*
        FIXME: this is a hack to not auto submit the form
        when select box content is updated when changing the
        current node in the tree view.
      */
      this.setCurrentNode(this.sdsService.getCurrentNode());
    }
  }

  /*
    Focus loose handler.
  */
  onChange(e) {
    if (e) {
      /*
        Autosubmit the form when some form element looses the focus.
      */
      if (!this.userFrm) {
        console.error("Failed to retrieve the form instance.");
        return;
      }
      this.userFrm.ngSubmit.emit();
    }
  }
  /*
    Gets all the form data in a
    user friendly format from the HTMLFormControlsCollection objects.
  */
  getFormData(data: HTMLFormControlsCollection) {
    let formData = null;
    let dimensionsArray = null;
    let variantsArray = null;
    if (!data) {
      console.log("Invalid form data.")
      return formData;
    }
    formData = {};
    if (data.hasOwnProperty('name')) {
      let name:any = data['name'];
      if (name) {
        formData["name"] = name.value;
      }
    }
    if (data.hasOwnProperty('comment')) {
      let comment:any = data['comment'];
      if (comment) {
        formData["comment"] = comment.value;
      }
    }
    /* History node */
    let tool = null;
    if (data.hasOwnProperty('tool')) {
      if (data['tool']) {
        tool = data['tool'].value;
      }
    }
    let user = null;
    if (data.hasOwnProperty('user')) {
      if (data['user']) {
        user = data['user'].value;
      }
    }
    let date = null;
    if (data.hasOwnProperty('date')) {
      if (data['date']) {
        date = data['date'].value;
      }
    }
    if (tool && user && date) {
      formData["history"] = {tool: tool, user: user, date: date}
    }
    if (data.hasOwnProperty('type')) {
      if (data['type'] instanceof RadioNodeList) {
        let radioData: any = data['type'];
        if (radioData && radioData.length > 0) {
          formData["type"] = radioData[0].value
        }
      }
      else {
        let type:any = data['type'];
        if (type) {
          formData["type"] = type.value;
        }
      }
    }
    if (data.hasOwnProperty('unit')) {
      let unit:any = data['unit'];
      if (unit) {
        formData["unit"] = unit.value;
      }
    }
    if (data.hasOwnProperty('dimensionSize')) {
      if (data['dimensionSize'] instanceof RadioNodeList) {
        let radioData: any = data['dimensionSize'];
        if (radioData && radioData.length > 0) {
          if (!dimensionsArray) {
            dimensionsArray = new Array();
          }
          for (let iter = 0; iter < radioData.length; iter++) {
            let dimensionItem = radioData[iter];
            if (dimensionItem && dimensionItem.value) {
              let sizeMap:any = {};
              sizeMap.size = +dimensionItem.value;
              dimensionsArray.push(sizeMap);
            }
          }
          formData["dimensions"] = dimensionsArray;
        }
      }
      else {
        let dimensionSize:any = data['dimensionSize'];
        if (dimensionSize) {
          if (!dimensionsArray) {
            dimensionsArray = new Array();
          }
          let sizeMap:any = {};
          sizeMap.size = +dimensionSize.value;
          dimensionsArray.push(sizeMap);
          formData["dimensions"] = dimensionsArray;
        }
      }
    }
    if (data.hasOwnProperty('dimensionScale')) {
      if (data['dimensionScale'] instanceof RadioNodeList) {
        let radioData: any = data['dimensionScale'];
        if (radioData && radioData.length > 0) {
          if (!dimensionsArray) {
            dimensionsArray = new Array();
          }
          for (let iter = 0; iter < radioData.length; iter++) {
            let dimensionScaleItem = radioData[iter];
            if (dimensionScaleItem && dimensionScaleItem.value) {
              let item = dimensionsArray[iter];
              item.scale = dimensionScaleItem.value;
            }
          }
        }
      }
      else {
        let dimensionScaleItem:any = data['dimensionScale'];
        if (dimensionScaleItem) {
          if (!dimensionsArray) {
            dimensionsArray = new Array();
          }
          let item = dimensionsArray[0];
          item.scale = dimensionScaleItem.value;
        }
      }
    }
    if (data.hasOwnProperty('variantName')) {
      if (data['variantName'] instanceof RadioNodeList) {
        let radioData: any = data['variantName'];
        if (radioData && radioData.length > 0) {
          if (!variantsArray) {
            variantsArray = new Array();
          }
          for (let iter = 0; iter < radioData.length; iter++) {
            let variantItem = radioData[iter];
            if (variantItem && variantItem.value) {
              let variantMap:any = {};
              variantMap.name = variantItem.value;
              variantsArray.push(variantMap);
            }
          }
          formData["variants"] = variantsArray;
        }
      }
      else {
        let variantName:any = data['variantName'];
        if (variantName) {
          if (!variantsArray) {
            variantsArray = new Array();
          }
          let variantMap:any = {};
          variantMap.name = variantName.value;
          variantsArray.push(variantMap);
          formData["variants"] = variantsArray;
        }
      }
    }
    if (data.hasOwnProperty('variantComment')) {
      if (data['variantComment'] instanceof RadioNodeList) {
        let radioData: any = data['variantComment'];
        if (radioData && radioData.length > 0) {
          if (!variantsArray) {
            variantsArray = new Array();
          }
          for (let iter = 0; iter < radioData.length; iter++) {
            let variantCommentItem = radioData[iter];
            if (variantCommentItem && variantCommentItem.value) {
              let item = variantsArray[iter];
              item.comment = variantCommentItem.value;
            }
          }
        }
      }
      else {
        let variantCommentItem:any = data['variantComment'];
        if (variantCommentItem) {
          let item = variantsArray[0];
          item.scale = variantCommentItem.value;
        }
      }
    }

    return formData;
  }

  /*
    Form submit handler.
  */
  onFormSubmit = function(e) {
    let hasFailed = !this.isFormValid;
    if (e) {
      /*
        The user has submitted the form.
      */
      let target = e.target;
      if (!hasFailed && target) {
        let elements = target.elements;
        let elementsMap = this.getFormData(elements);
        if (elementsMap) {
          this.sdsService.setCurrentNodeProperties(elementsMap);
        }
      }
    }
    else {
      /*
        The form was auto submitted when the user has changed the type select box.
        FIXME: weird way to do that...
      */
      let propertiesForm = null;
      let forms = document.forms;
      if (!hasFailed && forms && forms.length > 0) {
        for (let iter = 0; iter < forms.length; iter++) {
          propertiesForm = forms[iter];
          /* Search for the "propertiesForm" id. */
          if (propertiesForm && propertiesForm.id != "propertiesForm") {
            continue;
          }
          break;
        }
        if (!propertiesForm) {
          console.error("Failed to get properties formular element");
          return;
        }
        let elements = propertiesForm.elements;
        let elementsMap = this.getFormData(elements)
        if (elementsMap) {
          this.sdsService.setCurrentNodeProperties(elementsMap);
        }
      }
    }
    /* Display a toast. */
    let notificationType = "success";
    let notificationMessage = "Data submitted successfully";
    let notificationDurationMsec = 250;
    if (hasFailed) {
      // TODO: Add a detailed explanation about the failure.
      notificationType = "error";
      notificationMessage = "Failed to submit data";
      notificationDurationMsec = 500;
    }
    let notificationOptions = { message: notificationMessage, width: 500, shading: true };
    notify(notificationOptions, notificationType, notificationDurationMsec);
  }

  /*
    Gets the current node properties.
  */
  getProperties() {
    this.prop = this.sdsService.getCurrentNodeProperties();
    return true;
  }
}
