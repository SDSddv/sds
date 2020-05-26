import {Component, OnInit} from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.component.html',
  styleUrls: ['./contextmenu.component.css']
})

export class ContextmenuComponent implements OnInit {
  groupFreeId = 0;
  dataStructureFreeId = 0;
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
        { text: 'Data' }
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
    let isDataStructure = this.sdsService.isDataStructure(treeViewItem)
    let isGroup = this.sdsService.isGroup(treeViewItem)
    if (!isGroup && !isDataStructure) { /* Root node use case. */
      if (e.component) {
        e.component.option('items', this.sdsContextMenuItems);
      }
    }
    else if (isGroup && !isDataStructure) { /* Group use case. */
      if (e.component) {
        e.component.option('items', this.groupContextMenuItems);
      }
    }
    else if (isDataStructure) { /* Data structure use case. */
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
      let groupName = "newGroup" + this.groupFreeId;
      this.sdsService.createGroupNode(treeViewItem, groupName);
      this.groupFreeId++;
    }
    else if (e.itemData.text == "Data") {
      console.log("Creating data structure node for " + treeViewItem.id);
      let dataStructureName = "newData" + this.dataStructureFreeId;
      this.sdsService.createDataStructureNode(treeViewItem, dataStructureName);
      this.dataStructureFreeId++;
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
