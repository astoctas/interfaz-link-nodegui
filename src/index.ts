import {QApplication, QMainWindow, QWidget, QLabel, FlexLayout, QComboBox, QPushButton, QIcon, WidgetEventTypes, QSystemTrayIcon, QMenu, QAction } from '@nodegui/nodegui';
import { truncate } from 'fs';
import { SocketAddress } from 'net';
import { inherits } from 'util';
import { isStringObject } from 'util/types';
import logo from '../assets/64.png';
const {fork, spawn} = require('child_process');
const path = require('path');
const storage = require('node-persist');

var serialPorts = Array();
var connected = 1;
var port = "";

async function start() {
  await storage.init();
  port = await storage.getItem('port')
  if(port) {
    sendConnect(port)
  }
}

const qApp = QApplication.instance();
qApp.setQuitOnLastWindowClosed(false);

const win = new QMainWindow();
win.setWindowTitle("Interfaz Link");
win.setWindowIcon(new QIcon(logo));
win.setMinimumSize(640,480);

const menu = new QMenu();
// -------------------
// Quit Action
// -------------------
const quitAction = new QAction();
quitAction.setText("Salir");
quitAction.addEventListener("triggered", () => {
  socket.kill();
  qApp.exit(0);
});

menu.addAction(quitAction);


const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const topWidget = new QWidget();
topWidget.setObjectName("top");
const topLayout = new FlexLayout();
topWidget.setLayout(topLayout);

const top2Widget = new QWidget();
top2Widget.setObjectName("top2");
const top2Layout = new FlexLayout();
top2Widget.setLayout(top2Layout);
top2Widget.setInlineStyle("background-color: red;");

const midWidget = new QWidget();
midWidget.setObjectName("mid");
const midLayout = new FlexLayout();
midWidget.setLayout(midLayout);

const label = new QLabel();
label.setObjectName("mylabel");
label.setText("Servidor socket:");
label.setInlineStyle("color: #FFFFFF;");

const label2 = new QLabel();
label2.setObjectName("mylabel2");
//label2.setText("127.0.0.1:4268");
label2.setInlineStyle("color: #FFFFFF;");

const label3 = new QLabel();
label3.setObjectName("mylabel3");
label3.setInlineStyle("color: #FFFFFF;");

const button = new QPushButton();
button.setObjectName("mybutton");
button.setText("Conectar");
button.setInlineStyle("width: 100px; font-weight: bold");

const combo = new QComboBox();
combo.setObjectName("mycombo");
combo.setInlineStyle("color: #009688;margin-bottom: 5px; padding: 5px;");

const tray = new QSystemTrayIcon();
tray.setIcon(new QIcon(logo));
tray.setContextMenu(menu);
tray.show();
tray.addEventListener("activated", () => {
  win.show();
  win.raise();
  win.activateWindow();
})

topLayout.addWidget(label);
topLayout.addWidget(label2);
top2Layout.addWidget(label3);
midLayout.addWidget(combo);
midLayout.addWidget(button);
rootLayout.addWidget(topWidget);
rootLayout.addWidget(top2Widget);
rootLayout.addWidget(midWidget);

win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #myroot {
      background-color: #FFF;
      height: '100%';
      align-items: 'top';
      justify-content: 'left';
      padding: 10px;
    }
    #top {
      background-color: #009688;
      align-items: 'top';
      justify-content: 'left';
      padding: 10px;    
      border-radius: 10px; 
    }
    #top2 {
      align-items: 'left';
      justify-content: 'center';
      padding: 10px;   
      margin-top: 5px; 
      border-radius: 10px; 
      display: flex;
    }
    #mid {
      background-color: #FFF;
      align-items: 'left';
      color: #333;
      justify-content: 'left';
      padding-top: 20px ;    
      border-radius: 10px; 
    }    
    #mybutton{
      color: #009688;
    }
    #mylabel {
      font-size: 18px;
      font-weight: bold;
      text-align: left;
      padding: 1;
    }
    #mylabel2 {
      font-size: 14px;
      font-weight: bold;
      text-align: left;
      padding: 1;
    }
    #mylabel3 {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      padding: 1;
    }    
    #combo {
    }
  `
);

function notify(msg: string) {
  tray.showMessage("Interfaz Link", msg, new QIcon(logo));
}

async function setConnected(p:string) {
  connected = 1; 
  await storage.setItem('port',p)
  label3.setText("Conectado: "+p);
  notify('Interfaz conectada en '+p);
  setTimeout(()=>{
    label3.adjustSize();
  },100)
  top2Widget.setInlineStyle("background-color: green;");
}
function setConnecting(p:string) {
  connected = 1; 
  label3.setText("Conectando en: "+p);
  setTimeout(()=>{
    label3.adjustSize();
  },100)
  top2Widget.setInlineStyle("background-color: orange;");
}
function setDisconnected() {
  connected = 0; 
  label3.setText("Interfaz desconectada");
  notify('Interfaz desconectada');
  setTimeout(()=>{
    label3.adjustSize();
  },100)
  top2Widget.setInlineStyle("background-color: red;");
}

function sendConnect(p: string) {
  socket.kill();
  socket = fork_child();  
  socket.send({"type": "serialConnect", "port": p});
}

function fork_child() {

  let child = fork("./dist/child.js", [], {
    stdio: ['pipe', 'inherit', 'inherit', 'ipc']
  })
  
  child.on("message", (m: any) => {
    console.log('Got message:', m);
    const t = m.type;
    switch (t) {
      case  "listSerialPorts": 
        if(serialPorts.length == m.ports.length) break;
        combo.clear();
        m.ports.forEach( (element : any) => {
          combo.addItem(undefined, element.path);
        });
        // CONECTAR AL NUEVO PUERTO
        let newports = m.ports.filter((x:any) => !serialPorts.includes(x.path)) ;
        if(newports.length == 1) {
          sendConnect(newports[0].path);
          setConnecting(newports[0].path);
        } 
        serialPorts = [];
        m.ports.forEach( (element : any) => {
          serialPorts.push(element.path);
        }) 
      break;
      case "socketList":
        label2.clear();
        m.sockets.forEach((e: string)=>{
          label2.setText(label2.text() + e + ":4268"+ "\n");
        })
      break;
      case "connect":
        setConnected(m.msg);
      break;
      case "disconnect":
        setDisconnected();
      break;
      case "error":
        setDisconnected();
      break;
    }   
  })
  return child; 
}

connected = 0; 
start();
var socket = fork_child();

setInterval(()=>{
  if(!connected) {
    socket.send({"type": "listSerialPorts"});
  }
},1000)

win.addEventListener(WidgetEventTypes.Close, () => {
  console.log("closed");
});

button.addEventListener('clicked', () => {
  var p = combo.currentText();
  setConnecting(p);
  sendConnect(p);
});

//win.show();


(global as any).win = win;
