import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MenusComponent } from './layouts/menus/menus.component';
import {
  DxButtonModule, DxContextMenuModule,
  DxMenuModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTreeViewModule,
  DxTextBoxModule,
  DxValidatorModule
} from 'devextreme-angular';
import {AppInfoService, ScreenService} from './shared/services';
import { NavtreeComponent } from './layouts/navtree/navtree.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import {SplitModule} from './layouts/split/split.module';
import {RouterModule} from '@angular/router';
import { PagesplitComponent } from './layouts/pagesplit/pagesplit.component';
import { MessageService } from './models/messages/message.service';
import { MessagesComponent } from './models/messages/messages.component';
import { DxPopupModule } from 'devextreme-angular';
import { OpenComponent } from './dialogs/open/open.component';
import {FormsModule} from '@angular/forms';
import { ContentpageComponent } from './layouts/contentpage/contentpage.component';
import { ContentpropComponent } from './layouts/contentprop/contentprop.component';
import { ContentvalueComponent } from './layouts/contentvalue/contentvalue.component';
import {TableModule} from 'primeng/table';
import { AboutComponent } from './dialogs/about/about.component';
import { ContextmenuComponent } from './layouts/contextmenu/contextmenu.component';
import {DxDataGridModule} from 'devextreme-angular';
import {DxNumberBoxModule} from 'devextreme-angular';
import {DxListModule} from 'devextreme-angular';
import {DxToolbarModule} from 'devextreme-angular';
import { LoggerComponent } from './layouts/logger/logger.component';
import { DataModelBrowserComponent } from './dialogs/data-model-browser/data-model-browser.component';

@NgModule({
  declarations: [
    AppComponent,
    MenusComponent,
    NavtreeComponent,
    PagesplitComponent,
    MessagesComponent,
    OpenComponent,
    ContentpageComponent,
    ContentpropComponent,
    ContentvalueComponent,
    AboutComponent,
    ContextmenuComponent,
    LoggerComponent,
    DataModelBrowserComponent
  ],
  imports: [
    BrowserModule,
    DxMenuModule,
    FlexLayoutModule,
    SplitModule,
    DxScrollViewModule,
    DxTreeViewModule,
    DxContextMenuModule,
    DxPopupModule,
    RouterModule,
    FormsModule,
    DxButtonModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxSelectBoxModule,
    DxDataGridModule,
    DxNumberBoxModule,
    DxListModule,
    DxToolbarModule,
    TableModule
  ],
  providers: [ScreenService, AppInfoService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    }
}
