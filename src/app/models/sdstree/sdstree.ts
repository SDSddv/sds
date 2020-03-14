import {SDSNode} from './SDSNode';
import {Group} from './SDSGroup';

export class Sdstree extends SDSNode { // Dico
  history: string;
  groups ?: Group[];

  constructor() {
    super();
  }

  static [Symbol.hasInstance](obj) {
    if (obj.history ) { return true; }
  }

}

export const  sdtreeVide : Sdstree = {
  name: 'rename Dico' ,
  comment: 'Please comment',
  history : 'creation',
  groups : [
    {name: 'rename first group' , comment: 'Please comment',
     matrices : [
      {name : 'g', comment : 'gravity acceleration',
        type : 'float' , unit : 'm*(s**-2)', values : 9.80665 }
      ]
    }
  ]
};
