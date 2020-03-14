import {Matrix} from './SDSMatrix';
import {SDSNode} from './SDSNode';

export class Group extends SDSNode {
  groups ?: Group[];
  matrices ?: Matrix[];
  // the following function permits to use "instanceof this class"
  static [Symbol.hasInstance](obj) {
    if (obj.groups || obj.matrices ) { return true; }
  }
}
