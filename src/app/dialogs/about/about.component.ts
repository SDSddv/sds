import { Component, OnInit } from '@angular/core';
import {SdstreeService} from '../../models/sdstree/sdstree.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  toolVersion: string = null;
  constructor(private sdsService: SdstreeService) {
    this.toolVersion = this.sdsService.getToolVersion();
  }

  ngOnInit() {
  }

}
