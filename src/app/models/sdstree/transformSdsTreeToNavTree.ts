import {Sdstree} from './sdstree';
import {Item, Navtree} from '../../layouts/navtree/navtree';
import {Group} from './SDSGroup';
import {Matrix} from './SDSMatrix';

// transformSdsTreeToNavTree permits to
// SDSTree application model into NavTree GUI model

// tslint:disable-next-line:class-name
export class transformSdsTreeToNavTree {
  public readonly navtree: Navtree ;
  public readonly mapMatrix = new Map<string, Matrix>(); // hashtable to Matrix

  constructor(sds: Sdstree) {
    this.navtree = this.transformSdsTree2NavTree(sds);
  }

  private transformSdsTree2NavTree( sds: Sdstree): Navtree {
    let nav: Navtree;
    nav = new Array(1);
    nav[0] = new Item();
    nav[0].id = 'd0'; // id shall be unique in the set of tree nodes
    nav[0].text = sds.name;
    nav[0].expanded = true;
    if (sds.groups) {
      nav[0].items = this.transformSdsGroups2NavTreeItems('', nav[0].id, sds.groups);
    }
    return nav;
  }

  private transformSdsGroups2NavTreeItems(lgname: string, parentName: string, gps: Group[]): Item[] {
  // tslint:disable-next-line:one-variable-per-declaration
    let items, itemPartGp, itemPartMx: Item[];
    items = new Array(gps.length);
    for (let i = 0; i < gps.length; i++) {
      items[i] = new Item();
      items[i].id = parentName + 'g' + i;
      items[i].text = gps[i].name;
      if (gps[i].groups) {
        itemPartGp = new Array(gps[i].groups.length);
        itemPartGp = this.transformSdsGroups2NavTreeItems(
          lgname + '/' + gps[i].name,
          items[i].id,
          gps[i].groups);
      }
      if (gps[i].matrices) {
        itemPartMx = new Array(gps[i].matrices.length);
        itemPartMx = this.transformSdsMatrices2NavTreeItems(
          lgname + '/' + gps[i].name,
          items[i].id, gps[i].matrices);
      }
      if (gps[i].matrices || gps[i].groups) {
        if (gps[i].matrices && gps[i].groups) {
          items[i].items = itemPartGp.concat(itemPartMx);
        } else if (gps[i].groups) {
          items[i].items = itemPartGp;
        } else if (gps[i].matrices) {
          items[i].items = itemPartMx;
        }
        // if (items[i].items.length > 0)
        items[i].expanded = true;
      }
    }
    return items;
  }

  private transformSdsMatrices2NavTreeItems(lgname: string, parentName: string, mtc: Matrix[]): Item[] {
    let items: Item[];
    items = new Array(mtc.length);
    for (let i = 0; i < mtc.length; i++) {
      items[i] = new Item();
      items[i].id = parentName + 'm' + i;
      items[i].text = mtc[i].name;
      this.mapMatrix.set(lgname + '/' + mtc[i].name, mtc[i]);
    }
    return items;
  }
}




