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
                private messageService: MessageService, private sdsService: SdstreeService) {}

    ItemClick(data) {
      const item = data.itemData;
      this.currentItem = item.name;
      this.messageService.add(item.name);
      if (this.currentItem === 'Open') {
        this.popupVisible = true;
      }
      if (this.currentItem === 'About') {
        this.popupVisible = true;
      }
      if (this.currentItem === 'Save') { this.sdsService.saveZip() ; }
      if (this.currentItem === 'New') { this.sdsService.constructSdtreeVide() ; }
    }
}
