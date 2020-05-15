import { Component, OnInit, ViewChild } from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {nullProp, Properties} from './Properties';
import notify from 'devextreme/ui/notify';
import {DxSelectBoxModule, DxSelectBoxComponent} from "devextreme-angular";
import {Matrix} from '../../models/sdstree/SDSMatrix';
import {dataTypes} from '../../models/sdstree/dataTypes';
import {maxDimensionsCount} from '../../models/sdstree/sdstree';

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
  loadDataModelBrowser: boolean = false;
  browsedScalePosition: number = null;
  allowedDataTypes = dataTypes;
  scaleTextBoxArray: any[] = null;
  scaleBrowserButtonArray: any[] = null;

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

  /* Gets the content value widget instance. */
  getContentValueInstance() {
    let contentValueInstance = null;
    if (this.sdsService) {
      contentValueInstance = this.sdsService.getContentValueInstance();
    }
    return contentValueInstance;
  }

  /*
    Gets the maximum number of dimensions that can be managed by the application.
  */
  getMaxDimensions(): number {
    return maxDimensionsCount;
  }

  /*
    Checks if a property is allowed for the current node or not.
  */
  isPropertyAllowed() {
    let isAllowed = false;
    let currentNode = this.getCurrentNode();
    if (currentNode && currentNode instanceof Matrix) {
      isAllowed = true;
    }
    return isAllowed;
  }

  /*
    Add unit property handler.
  */
  onAddUnit(e) {
    this.getProperties();
    if (this.prop) {
      this.prop.unit = "";
      this.setProperties(this.prop);
    }
  }

  /*
    Delete unit property handler.
  */
  onDeleteUnit(e) {
    this.getProperties();
    if (this.prop && this.prop.unit != null) {
      delete this.prop.unit;
      this.setProperties(this.prop);
    }
  }

  /*
    Add dimension property handler.
  */
  onAddDimension(e) {
    this.getProperties();
    if (this.prop) {
      /*
        If the current node doesn't have any dimension, initialize the dimensions array.
      */
      if (!this.prop.dimensions) {
        this.prop.dimensions = new Array();
      }
      let dimensionsCount = this.prop.dimensions.length;
      /*
        Initialize the new dimension with a size of 1.
        This value will be automatically updated by the content value component.
      */
      this.prop.dimensions.push({size: 1});
      this.setProperties(this.prop);
      /*
        Tell to the content value component to update
        the data grid accordingly.
      */
      let contentValueInstance = this.getContentValueInstance();
      if (contentValueInstance) {
        contentValueInstance.onAddDimension(dimensionsCount);
      }
    }
  }

  /*
    Delete dimension property handler.
  */
  onDeleteDimension(e, position) {
    this.getProperties();
    if (this.prop) {
      if (this.prop.dimensions) {
        if (position <= this.prop.dimensions.length) {
          /*
            Update the properties by removing the
            dimension array item at the provided index.
          */
          this.prop.dimensions.splice(position, 1);
          let dimensionsCount = this.prop.dimensions.length;
          this.setProperties(this.prop);
          /*
            Tell to the content value component to update
            the data grid accordingly.
          */
          let contentValueInstance = this.getContentValueInstance();
          if (contentValueInstance) {
            contentValueInstance.onDeleteDimension(dimensionsCount);
          }
        }
      }
    }
  }


  /*
    Add scale property handler.
  */
  onAddScale(e, position) {
    this.getProperties();
    if (this.prop) {
      if (this.prop.dimensions) {
        let dimension = this.prop.dimensions[position];
        if (dimension) {
          dimension.scale = "";
          this.setProperties(this.prop);
          let contentValueInstance = this.getContentValueInstance();
          if (contentValueInstance) {
            contentValueInstance.refreshDataGrid();
          }
        }
      }
    }
  }

  /*
    Delete scale property handler.
  */
  onDeleteScale(e, position) {
    this.getProperties();
    if (this.prop) {
      if (this.prop.dimensions) {
        let dimension = this.prop.dimensions[position];
        if (dimension) {
          delete dimension.scale;
          this.setProperties(this.prop);
          let contentValueInstance = this.getContentValueInstance();
          if (contentValueInstance) {
            contentValueInstance.refreshDataGrid();
          }
        }
      }
    }
  }

  /*
    Scale text boxes initialization handler.
  */
  onScalePathInitialized(e, position) {
    /*
      Initialize tha scale text box array with the widget descriptor and its position.
    */
    if (!this.scaleTextBoxArray) {
      this.scaleTextBoxArray = new Array();
    }
    this.scaleTextBoxArray.push({widget: e.component, position: position});
  }

  /*
    Scale browser buttons initialization handler.
  */
  onScaleBrowserButtonInitialized(e, position) {
    if (!this.scaleBrowserButtonArray) {
      this.scaleBrowserButtonArray = new Array();
    }
    this.scaleBrowserButtonArray[position] = e.component;
  }

  /*
    Clears the scale browser buttons array.
  */
  resetScaleBrowserButtonArray() {
    if (this.scaleBrowserButtonArray && this.scaleBrowserButtonArray.length > 0) {
      this.scaleBrowserButtonArray.length = 0;
    }
  }

  /*
    Browse scale path handler.
  */
  onScaleBrowse(e, position) {
    /* Toggle the popup display. */
    this.loadDataModelBrowser = !this.loadDataModelBrowser;
    /* Memorize the scale index that is browsed. */
    this.browsedScalePosition = position;
    /* Disable all the validation buttons. */
    if (this.scaleBrowserButtonArray) {
      for (let iter = 0; iter < this.scaleBrowserButtonArray.length; iter++) {
        this.scaleBrowserButtonArray[iter].option("disabled", true);
      }
    }
  }

  /*
    Browser validation click handler.
  */
  onSelectionValidated(e) {
    let valueUpdated: boolean = false;
    if (this.scaleTextBoxArray) {
      /* Retrieve the text box widget from the clicked scale browser button index. */
      for (let iter = 0; iter < this.scaleTextBoxArray.length; iter++) {
        let scaleTextBox = this.scaleTextBoxArray[iter];
        if (scaleTextBox) {
          if (scaleTextBox.position != this.browsedScalePosition) {
            continue;
          }
          let widget = scaleTextBox.widget;
          if (widget) {
            /* Get the path of the selected node. */
            let path = this.sdsService.getBrowsedScalePath();
            if (path) {
              /* Update the text box widget value. */
              widget.option("value", path);
              valueUpdated = true;
            }
          }
        }
      }
    }
    /* Hide the browser popup. */
    this.loadDataModelBrowser = false;
    /* If a scale value has been updated, auto submit the form. */
    if (valueUpdated) {
      this.userFrm.ngSubmit.emit();
    }
  }

  /*
    Browser cancelation click handler.
  */
  onSelectionCanceled(e) {
    /* Hide the browser popup. */
    this.loadDataModelBrowser = false;
  }

  /*
    Allows the scale browser validation button to be enabled.
  */
  allowScaleValidation(enable) {
    if (this.scaleBrowserButtonArray) {
      for (let iter = 0; iter < this.scaleBrowserButtonArray.length; iter++) {
        /* Enable the validation button. */
        let button = this.scaleBrowserButtonArray[iter];
        if (button) {
          button.option("disabled", !enable);
        }
      }
    }
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
      if (unit != null) {
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
    Gets an array with the next available dimension for the current node
    (limited to the maximum of dimensions that the application can manage).
  */
  getNextDimension() {
    let nextDimension = new Array();
    this.getProperties();
    if (this.prop && this.prop.dimensions) {
      if (this.prop.dimensions.length < this.getMaxDimensions()) {
        nextDimension.push(this.prop.dimensions.length+1);
      }
    }
    return nextDimension;
  }

  /*
    Gets the current node properties.
  */
  getProperties() {
    this.prop = this.sdsService.getCurrentNodeProperties();
    return true;
  }

  /*
    Updates the current node properties.
  */
  setProperties(properties: Properties) {
    if (properties) {
      this.sdsService.setCurrentNodeProperties(properties);
    }
  }
}
