export type Navtree = Item[] ;
export class Item {
  id: string ; // id pattern is : /^d0(g[0-9]+)*(m[0-9]+)*/
  text: string;
  expanded ?: boolean;
  items ?: Item[];

}

