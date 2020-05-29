import {Component, OnInit} from '@angular/core';
import {MessageService} from '../../models/messages/message.service';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import * as JSZip from 'jszip';

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.css']
})
export class OpenComponent implements OnInit {
  theText: string;
  filename: string;
  constructor(private messageService: MessageService , private sdsService: SdstreeService) {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.filename = file.name;
      this.sdsService.zip = new JSZip();
      this.sdsService.zip
        .loadAsync(file, {base64: true})
        .catch(error => this.onLoadError(error));
    }
  }

  onLoadError(error) {
    let message = "Failed to load the SDS tree (" + this.filename + " is not a valid zip archive).";
    this.sdsService.addLog("error", message);
    let menusComponent = this.sdsService.getMenusComponentInstance();
    if (menusComponent) {
      menusComponent.hidePopup();
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
