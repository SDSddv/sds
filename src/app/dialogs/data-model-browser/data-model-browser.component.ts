import { Component, OnInit } from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-data-model-browser',
  templateUrl: './data-model-browser.component.html',
  styleUrls: ['./data-model-browser.component.css']
})
export class DataModelBrowserComponent implements OnInit {
  scrollByContent = true;
  scrollByThumb = true;
  scrollbarMode = 'always';
  pullDown = false;
  reachBottomText = '';

  constructor(private sdsService: SdstreeService) { }

  ngOnInit() {
  }

  getNavTree() {
    return this.sdsService.getNavTree();
  }

  selectItem(e) {
    if (e && e.itemData) {
      let nodeName = e.itemData.text;
      let rootNode = this.sdsService.getRootNodePath();
      let nodePath = this.sdsService.getNodePath("", nodeName);
      nodePath = nodePath.replace(rootNode, "");
      this.sdsService.setBrowsedScalePath(nodePath);
    }
  }

}
