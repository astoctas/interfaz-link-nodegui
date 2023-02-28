import {QApplication, QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, WidgetEventTypes, QSystemTrayIcon } from '@nodegui/nodegui';
import { truncate } from 'fs';
import logo from '../assets/logox200.png';
const {fork, spawn} = require('child_process');
const path = require('path');

const qApp = QApplication.instance();


const win = new QMainWindow();
win.setWindowTitle("Hello World");
win.setWindowIcon(new QIcon(logo));

const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const label = new QLabel();
label.setObjectName("mylabel");
label.setText("Hello");

const button = new QPushButton();
button.setIcon(new QIcon(logo));

const label2 = new QLabel();
label2.setText("World");
label2.setInlineStyle(`
  color: red;
`);

const tray = new QSystemTrayIcon();
tray.setIcon(new QIcon(logo));
tray.show();
tray.addEventListener("activated", () => {
  win.showNormal();
})

rootLayout.addWidget(label);
rootLayout.addWidget(button);
rootLayout.addWidget(label2);
win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #myroot {
      background-color: #009688;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
    }
    #mylabel {
      font-size: 16px;
      font-weight: bold;
      padding: 1;
    }
  `
);
var q = fork('./dist/child.js'); 
win.addEventListener(WidgetEventTypes.Close, () => q.kill());
//win.showMinimized();



(global as any).win = win;
