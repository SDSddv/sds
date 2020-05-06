import {Component, OnInit} from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.component.html',
  styleUrls: ['./contextmenu.component.css']
})

export class ContextmenuComponent implements OnInit {

  constructor(private sdsService: SdstreeService) { }

  ngOnInit() {
  }

  contextMenuItems = [
    { text: 'Create' },
    { text: 'Delete' }
  ];

  sdsContextMenuItems = [
    { text: 'Create',
      items: [
        { text: 'Group' },
      ]
    }
  ];

  groupContextMenuItems = [
    { text: 'Create',
      items: [
        { text: 'Group' },
        { text: 'Matrix' }
      ]
    },
    { text: 'Delete' }
  ];

  matrixContextMenuItems = [
    { text: 'Delete' }
  ];

  /* Before the context menu is shown, build dynamically the menu items. */
  onShowing(e) {
    let treeViewItem = this.sdsService.getTreeViewItem();
    let isMatrix = this.sdsService.isMatrix(treeViewItem)
    let isGroup = this.sdsService.isGroup(treeViewItem)
    if (!isGroup && !isMatrix) { /* Root node use case. */
      if (e.component) {
        e.component.option('items', this.sdsContextMenuItems);
      }
    }
    else if (isGroup && !isMatrix) { /* Group use case. */
      if (e.component) {
        e.component.option('items', this.groupContextMenuItems);
      }
    }
    else if (isMatrix) { /* Matrix use case. */
      if (e.component) {
        e.component.option('items', this.matrixContextMenuItems);
      }
    }
  }

  /* Context menu item click handler. */
  onClick(e) {
    let treeViewItem = this.sdsService.getTreeViewItem();
    if (e.itemData.text == "Group") {
      console.log("Creating group node for " + treeViewItem.id);
      this.sdsService.createGroupNode(treeViewItem, "new group");
    }
    else if (e.itemData.text == "Matrix") {
      console.log("Creating matrix node for " + treeViewItem.id);
      this.sdsService.createMatrixNode(treeViewItem, "new matrix");
    }
    else if (e.itemData.text == "Delete") {
      console.log("Deleting node " + treeViewItem.id);
      this.sdsService.deleteNode(treeViewItem.id);
    }
    let treeViewInstance = this.sdsService.getTreeViewInstance()
    if (treeViewInstance) {
      treeViewInstance.refreshTree()
    }
  }

}
