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
  scrollbarMode = 'onScroll';
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

  selectItem(e) {
      // console.log('in navtree.component ' +  e.itemData.text);
      this.sdsService.setCurrentNode(e.itemData.id);
  }

  /* Refreshes the whole tree view widget. */
  refreshTree() {
    if (this.treeView) {
      this.treeView.instance.option("dataSource", this.sdsService.getNavTree());
    }
  }

  /* Tree view item right click handler. */
  onRightClick(e) {
	  // Save the tree view that was right clicked in order to
	  // allowing the contextual menu to be aware of this node.
	  this.sdsService.setTreeViewItem(e.itemData)
  }

}
