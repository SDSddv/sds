import Ajv from 'ajv';
import {default as data} from "./schema.json";
import {SDSNode} from './SDSNode';

export class sdsTreeValidatorError {
  object: Object;
  dataPath: string;
  schemaPath?: string;
  message: string;
}

export class sdsTreeValidator {
  private ajvInstance;
  private schema;

  constructor() {
    this.ajvInstance = new Ajv({allErrors: true});
    this.schema = data;
  }

  /*
    Validates the provided object against a JSON schema.
    Returns null object on success.
    An array of sdsTreeValidatorError on error.
  */
  validateTree(object) {
    let validationResult: sdsTreeValidatorError[] = null;
    if (object) {
      let validate = this.ajvInstance.compile(this.schema);
      if (validate) {
        let isValid = validate(object);
        if (!isValid) {
          let errors = validate.errors;
          if (errors) {
            validationResult = new Array();
            for (let iter = 0; iter < errors.length; iter++) {
              let error = errors[iter];
              if (error) {
                if (error.keyword == "oneOf") {
                  continue;
                }
                let validationResultItem = new sdsTreeValidatorError();
                let dataPathStr = error.dataPath;
                /* Replace all occurrences of "." by "/" in the dataPath. */
                validationResultItem.dataPath = dataPathStr.split(".").join("/");
                if (!validationResultItem.dataPath) {
                  validationResultItem.dataPath = "/";
                }
                if (error.schemaPath) {
                  validationResultItem.schemaPath = error.schemaPath;
                }
                validationResultItem.object = eval('object' + dataPathStr);
                validationResultItem.message = validationResultItem.dataPath + " ";
                if (typeof(validationResultItem.object) == "string") {
                  validationResultItem.message += "\"" + validationResultItem.object + "\" ";
                }
                else if (typeof(validationResultItem.object) == "object") {
                  let sdsNode = validationResultItem.object as SDSNode;
                  if (sdsNode && sdsNode.name) {
                    validationResultItem.message += "\"" + sdsNode.name + "\" ";
                  }
                }
                validationResultItem.message +=  error.message;
                if (error.keyword == "additionalProperties") {
                  let additionalProperty = error.params.additionalProperty;
                  if (additionalProperty) {
                    validationResultItem.message += " (" + additionalProperty + ")";
                  }
                }
                else if (error.keyword == "enum") {
                  let allowedValues = error.params.allowedValues;
                  if (allowedValues) {
                    validationResultItem.message += " (" + allowedValues + ")";
                  }
                }
                validationResult.push(validationResultItem);
              }
            }
          }
        }
      }
    }
    return validationResult;
  }

}
