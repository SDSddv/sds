import { Component, OnInit, ViewChild } from '@angular/core';
import {saveAs} from 'file-saver';
import {SdstreeService} from '../../models/sdstree/sdstree.service';
import {getFormattedCurrentDateTime} from '../../models/sdstree/common';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css']
})

export class LoggerComponent implements OnInit {
  loggerDataSource = null;
  loggerItems:LoggerItem[] = null;
  listComponent = null;
  exportButtonOptions: any;
  exportButtonInstance: any = null;
  clearButtonOptions: any;
  clearButtonInstance: any = null;
  selectBoxOptions: any;
  disableState: boolean = true;
  allowedLoggerLevels: string[] = [
    "all",
    "info",
    "warning",
    "error"
  ];

  constructor(private sdsService: SdstreeService) {
    this.sdsService.setLoggerInstance(this);
    this.selectBoxOptions = {
      width: 100,
      items: this.getLevelItems(),
      displayExpr: 'text',
      valueExpr: 'text',
      value: this.getLevelInitialValue(),
      onValueChanged: (args) => {
        let items = this.getLoggerItems();
        if (args.value != "all") {
          items = this.getFilteredItems(args.value);
        }
        this.refreshList(items);
      }
    };

    this.exportButtonOptions = {
      icon: "export",
      hint: "Export",
      disabled: true,
      onInitialized: (e) => {
        if (e) {
          this.exportButtonInstance = e.component;
        }
      },
      onClick: () => {
        this.exportLogFile();
      }
    };

    this.clearButtonOptions = {
      icon: "clear",
      hint: "Delete",
      disabled: true,
      onInitialized: (e) => {
        if (e) {
          this.clearButtonInstance = e.component;
        }
      },
      onClick: () => {
        this.clearList();
      }
    };
  }

  ngOnInit() {
  }

  /*
    Component initialization handler.
    Used to the save the list component instance.
  */
  onInitialized(e) {
    if (e) {
      this.listComponent = e.component;
    }
  }

  /*
    Gets a string containing all the log items contents.
  */
  getLogFileData() {
    let data = "";
    let items = this.getLoggerItems();
    if (items) {
      /*
        Reverse the items list (and create a deep copy) in order to
        write them in the log file by the creation order.
      */
      let reversedItems = Object.assign([], items);
      if (reversedItems) {
        reversedItems = reversedItems.reverse();
        /* Prepend the tool name & version to the items that will be written in the log file. */
        let toolInfoItem = new LoggerItem();
        toolInfoItem.level = "info";
        toolInfoItem.text = "Using " + this.sdsService.getToolName() + " v" + this.sdsService.getToolVersion();
        reversedItems.unshift(toolInfoItem);
        for (let iter = 0; iter < reversedItems.length; iter++) {
          let item = reversedItems[iter];
          if (item) {
            if (item.dateTime != null) {
              data += item.dateTime;
              data += " - ";
            }
            data += item.level;
            data += " - ";
            data += item.text;
            data += "\n";
          }
        }
      }
    }
    return data;
  }

  /*
    Gets the log filename that will be exported.
    The filename is computed as follows:
      TOOLLog_DDMMYY_HHhMM.txt
      with
        TOOL: the tool name that generates the log file.
        DD: the day of the month on 2 digits.
        MM: the month on 2 digits.
        YY: the year on 2 digits.
        HH: the hours on 2 digits.
        MM: the minutes on 2 digits.
  */
  getFilename() {
    let filename = this.sdsService.getToolName();
    filename += "Log";
    let formattedDateTime = getFormattedCurrentDateTime();
    if (formattedDateTime) {
      filename += "_";
      let formattedDay = formattedDateTime.day;
      let formattedMonth = formattedDateTime.month;
      let formattedYear = formattedDateTime.year;
      let formattedHours = formattedDateTime.hours;
      let formattedMinutes = formattedDateTime.minutes;
      filename += formattedDay +
                  formattedMonth +
                  formattedYear +
                  "_" +
                  formattedHours +
                  "h" +
                  formattedMinutes;
    }
    filename += ".txt";
    return filename;
  }

  /*
    Exports the log file on the file system.
  */
  exportLogFile() {
    let filename = this.getFilename();
    /* The file is saved as a plain text blob. */
    let blob = new Blob([this.getLogFileData()], {type: "text/plain;charset=utf-8"});
    if (blob) {
      saveAs(blob, filename);
    }
  }

  /*
    Filters log items by the provided log level.
  */
  getFilteredItems(level) {
    let filteredItems = null;
    let items = this.getLoggerItems();
    if (items) {
      filteredItems = new Array();
      for (let iter = 0; iter < items.length; iter++) {
        let item = items[iter];
        if (item && item.level == level) {
          filteredItems.push(item);
        }
      }
    }
    return filteredItems;
  }

  /*
    Gets the available log levels.
  */
  getLevelItems() {
    let levelItems = new Array();
    for (let iter = 0; iter < this.allowedLoggerLevels.length; iter++) {
      let level = this.allowedLoggerLevels[iter];
      if (level) {
        levelItems.push({text: level});
      }
    }
    return levelItems;
  }

  /*
    Gets the default log level.
  */
  getLevelInitialValue() {
    let initialValue = null;
    let levelItems = this.getLevelItems();
    if (levelItems && levelItems.length > 0) {
      /* Default log level is the first item of the allowedLoggerLevels variable. */
      initialValue = levelItems[0].text;
    }
    return initialValue;
  }

  /*
    Gets the icon name that will be displayed from the provided log level.
  */
  getIconFromLevel(level: string) {
    let icon = null;
    if (level) {
      if (level == "info") {
        icon = "info";
      }
      else if (level == "warning") {
        icon = "warning";
      }
      else if (level == "error") {
        icon = "clear";
      }
    }
    return icon;
  }

  /*
    Gets all the logged items.
  */
  getLoggerItems() {
    if (this.loggerItems) {
      for (let iter = 0; iter < this.loggerItems.length; iter++) {
        let item = this.loggerItems[iter];
        if (item) {
          let itemLevel = item.level;
          if (itemLevel) {
            item.icon = this.getIconFromLevel(itemLevel);
          }
        }
      }
    }
    return this.loggerItems;
  }

  /*
    Updates the "clear" & "export" buttons disable states.
  */
  updateButtonsStates() {
    let enable = false;
    let items = this.getLoggerItems();
    /* If there is at least one element in the log items, enable the buttons. */
    if (items && items.length > 0) {
      enable = true;
    }
    if (this.exportButtonInstance) {
      this.exportButtonInstance.option("disabled", !enable);
    }
    if (this.clearButtonInstance) {
      this.clearButtonInstance.option("disabled", !enable);
    }
  }

  /*
    Clears the logged items list.
  */
  clearList() {
    this.loggerItems.length = 0;
    this.refreshList();
  }

  /*
    Reloads the log list component.
  */
  refreshList(items?) {
    if (this.listComponent != null) {
      let itemsToRefresh = this.getLoggerItems();
      if (items != null) {
        itemsToRefresh = items;
      }
      this.listComponent.option('items', itemsToRefresh);
    }
    this.updateButtonsStates();
  }

  /*
    Adds a new log item in the items list.
  */
  addLog(level: string, message: string) {
    let dateTimeStr: string = null;
    if (!this.loggerItems) {
      this.loggerItems = new Array();
    }
    let formattedDateTime = getFormattedCurrentDateTime();
    if (formattedDateTime) {
      let formattedDay = formattedDateTime.day;
      let formattedMonth = formattedDateTime.month;
      let formattedYear = formattedDateTime.year;
      let formattedHours = formattedDateTime.hours;
      let formattedMinutes = formattedDateTime.minutes;
      let formattedSeconds = formattedDateTime.seconds;
      dateTimeStr = formattedDay + "/" +
                    formattedMonth + "/" +
                    formattedYear +
                    " " +
                    formattedHours + ":" +
                    formattedMinutes + ":" +
                    formattedSeconds;
    }
    let item = new LoggerItem();
    item.level = level;
    item.text = message;
    if (dateTimeStr != null) {
      item.dateTime = dateTimeStr;
    }
    /*
      Prepend the items in the items list in order to
      display the last log item on top of the widget.
    */
    this.loggerItems.unshift(item);
    this.refreshList();
  }

}

export class LoggerItem {
  level: string;
  dateTime?: string;
  icon?: string;
  text: string;
}

export class LoggerLevel {
  text: string;
}
