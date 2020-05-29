import {Component, OnInit, ViewChild} from '@angular/core';
import {DxScrollViewComponent, DxTreeViewComponent} from 'devextreme-angular';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {Item, Navtree} from './navtree';

@Component({
  selector: 'app-navtree',
  templateUrl: './navtree.component.html',
  styleUrls: ['./navtree.component.css']
})
export class NavtreeComponent implements OnInit {
  @ViewChild(DxScrollViewComponent, { static: false }) scrollView: DxScrollViewComponent;
  @ViewChild(DxTreeViewComponent, { static: false }) treeView: DxTreeViewComponent
  scrollByContent = true;
  scrollByThumb = true;
  scrollbarMode = 'always';
  pullDown = false;
  reachBottomText = '';

  constructor(private sdsService: SdstreeService) {
    this.sdsService.setTreeViewInstance(this);
  }

  hierarchicalData(): Navtree {
    return this.sdsService.getNavTree();
  }

  ngOnInit() {
  }

  /*
    Adds an icon to the provided node.
  */
  addIcon(node, icon) {
    if (node) {
      node.icon = icon;
    }
  }

  /*
    Removes any previously set node icon.
  */
  removeIcon(node) {
    if (node && node.icon) {
      delete node.icon;
    }
  }

  selectItem(e) {
    /* Remove the icon (if any) when selecting a node. */
    this.removeIcon(e.itemData);
    // console.log('in navtree.component ' +  e.itemData.text);
    this.sdsService.setCurrentNode(e.itemData.id);
  }

  /*
    Refreshes the whole tree view widget.
    FIXME_21: The navtree instance must be constantly refreshed when some node is inserted/removed.
             Appending/removing items to currently displayed array should be sufficient.
  */
  refreshTree() {
    if (this.treeView) {
      /*
        Memorize the scroll bar position in order to
        restore it after the tree view update.
        This is done because updating the tree view data makes
        the scroll bar to be reset to the top of its scroll region.
      */
      let scrollOffset = null;
      if (this.scrollView && this.scrollView.instance) {
        scrollOffset = this.scrollView.instance.scrollOffset();
      }
      this.treeView.instance.option("dataSource", this.sdsService.getNavTree());
      // Restore the scroll bar position.
      if (this.scrollView && this.scrollView.instance) {
        this.scrollView.instance.scrollTo(scrollOffset);
      }
    }
  }

  /* Tree view item right click handler. */
  onRightClick(e) {
	  // Save the tree view that was right clicked in order to
	  // allowing the contextual menu to be aware of this node.
	  this.sdsService.setTreeViewItem(e.itemData)
  }

}
