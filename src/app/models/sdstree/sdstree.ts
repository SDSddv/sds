import {SDSNode} from './SDSNode';
import {Group} from './SDSGroup';
import {History} from './../../layouts/contentprop/Properties';

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
		'tool': 'SDSGui',
		'user': '',
		'date': ''
	},
  groups : [
    {
      name: 'Rename first group',
      comment: 'Please comment',
      matrices : [
        {
            name : 'g',
            comment : 'gravity acceleration',
            type : 'float',
            unit : 'm*(s**-2)',
            values : 9.80665
        }
      ]
    }
  ]
};
