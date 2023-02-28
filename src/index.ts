import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, WidgetEventTypes } from '@nodegui/nodegui';
import logo from '../assets/logox200.png';
const {fork, spawn} = require('child_process');
const path = require('path');

const win = new QMainWindow();
win.setWindowTitle("Hello World");

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
win.show();



(global as any).win = win;
