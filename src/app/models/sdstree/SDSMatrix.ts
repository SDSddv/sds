import {SDSNode} from './SDSNode';


export class Matrix extends SDSNode {
  type: string;
  unit ?: string;
  dimensions ?: Dimension[];
  variants ?: RefMatrix[];
  // when the number of item is greater strict than 20
  // the values are in a json file
  values: pathInDicoDirectory | value | valuesVect | valuesMatrix |
             valuesCube | valuesHyperCube;

  // the following function permits to use "instanceof this class"
  static [Symbol.hasInstance](obj) {
    if (obj.values) { return true; }
  }
}
export type pathInDicoDirectory = string; // a string which begin with a '/'
// FIXME: The following types may be (number|boolean) instead of any !
export type value = any;
export type valuesVect = any[];
export type valuesMatrix = any[][]; // arbitrary columns view
export type valuesCube = any[][][];
export type valuesHyperCube = any[][][][];

export type pathInDicoJson = string;
export class Dimension{
  size: number;
  scale ?: pathInDicoJson; // decoupage
}

export class RefMatrix {
  name: pathInDicoJson ;
  comment ?: string ;
}
