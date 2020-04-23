import {  Component, enableProdMode } from '@angular/core';
import {  AppInfoService } from '../../shared/services';
import {MessageService} from '../../models/messages/message.service';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-menus',
  templateUrl: './menus.component.html',
  styleUrls: ['./menus.component.scss']
})
export class MenusComponent {
    currentItem: string ;
    popupVisible: boolean ;
    menuItems = [{
        name: 'File',
        items: [
            { name: 'New'},
            { name: 'Open'},
            { name: 'Save'}
        ]
    }, {
        name: 'Help',
        items: [
            { name: 'About'}]
    }];

    constructor(public appInfo: AppInfoService,
                private messageService: MessageService,
                private sdsService: SdstreeService) {
      if (this.sdsService) {
        this.sdsService.setMenusComponentInstance(this);
      }
    }

    showPopup() {
      this.popupVisible = true;
    }

    hidePopup() {
      this.popupVisible = false;
    }

    ItemClick(data) {
      const item = data.itemData;
      this.currentItem = item.name;
      this.messageService.add(item.name);
      if (this.currentItem === 'Open') {
        this.showPopup();
      }
      if (this.currentItem === 'About') {
        this.showPopup();
      }
      if (this.currentItem === 'Save') { this.sdsService.saveZip() ; }
      if (this.currentItem === 'New') { this.sdsService.constructSdtreeVide() ; }
    }
}
