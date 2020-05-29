import {Sdstree} from "../../models/sdstree/sdstree";

export class DimensionP {
  size: number;
  scale ?: string; // decoupage
}

export class RefMatrixP {
  name: string ;
  comment ?: string ;
}

export class History {
  tool: string;
  user: string;
  date: string;
}

export class Properties {
  name: string ;
  comment: string;
  history ?: History;
  type ?: string;
  unit ?: string;
  dimensions ?: DimensionP[];
  variants ?: RefMatrixP[];
}

export const nullProp: Properties = {
  name: '',
  comment: ''
}
