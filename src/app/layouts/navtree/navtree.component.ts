import {Component, OnInit, ViewChild} from '@angular/core';
import {DxScrollViewComponent} from 'devextreme-angular';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {Item, Navtree} from './navtree';

@Component({
  selector: 'app-navtree',
  templateUrl: './navtree.component.html',
  styleUrls: ['./navtree.component.css']
})
export class NavtreeComponent implements OnInit {
  @ViewChild(DxScrollViewComponent, { static: false }) scrollView: DxScrollViewComponent;
  scrollByContent = true;
  scrollByThumb = true;
  scrollbarMode = 'onScroll';
  pullDown = false;
  reachBottomText = '';

  constructor(private sdsService: SdstreeService) {
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
}
