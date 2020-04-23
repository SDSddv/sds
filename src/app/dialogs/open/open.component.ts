import {Component, OnInit} from '@angular/core';
import {MessageService} from '../../models/messages/message.service';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.css']
})
export class OpenComponent implements OnInit {
  theText: string;
  constructor(private messageService: MessageService , private sdsService: SdstreeService) {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.sdsService.zip.loadAsync(file, {base64: true});
    }
  }


  okClicked(e) {
    this.sdsService.getJsonIndex();
    let menusComponent = this.sdsService.getMenusComponentInstance();
    if (menusComponent) {
      menusComponent.hidePopup();
    }
  }

  ngOnInit() {
  }

}
