import {SDSNode} from './SDSNode';
import {Group} from './SDSGroup';
import {History} from './../../layouts/contentprop/Properties';

/* Maximum dimensions count that the application can manage. */
export const maxDimensionsCount: number = 4;

export class Sdstree extends SDSNode { // Dico
  history: History;
  groups ?: Group[];

  constructor() {
    super();
  }

  static [Symbol.hasInstance](obj) {
    if (obj.history ) { return true; }
  }

}

export const  sdtreeVide : Sdstree = {
  name: 'Rename SDS' ,
  comment: 'Please comment',
  history : {
		'tool': '',
		'user': '',
		'date': ''
	},
  groups : [
    {
      name: 'Rename first group',
      comment: 'Please comment',
      matrices : [
      ]
    }
  ]
};
