
var five = require('johnny-five');
const { SerialPort } = require('serialport')
var Interfaz = require("./interfaz")(five);
const utf8 = require('utf8');

/*
const port = new SerialPort({ path: "/dev/tty.usbserial-A94FS1TK", baudRate: 115200 })

this.board = new five.Board({
  port: port,
  repl: false
});

this.board.on("ready", function() {
  var led = new five.Led(13);
  led.blink(500);
});    

*/
function Serial() {
  this.serialport = SerialPort;
  this.port = false;
  this.board = false;
  this.ifaz = false;
  this.connected = false;

  this.getIfaz = function() {
    return this.ifaz;
  }

  this.connect = async function(port, callback) {
    var me = this;
    if(this.port && this.port.port) {
      if(this.port.port.isOpen) {
        this.port.port.close();
      }
    }
    return await SerialPort.list().then(ports => {
      p = ports.filter(o => {return o.path == port});
      //console.log(port, p.length)
      if(p.length) {
        _port = new SerialPort({ path: port, baudRate: 57600 })
        this.board = new five.Board({
          port: _port,
          repl: false
        });

        this.board.on("error", function (err) {
          console.log("ERROR TIMEOUT");
          me.connected = false;
          if(callback)
          callback({"type": "error", "msg" :err});
        })     
        
        this.board.on("close", function (err) {
          console.log("ERROR CLOSE ");
          me.connected = false;
          if(callback)
          callback({"type": "disconnect", "msg" :"Board disconnected"});
        })        
        
        this.board.on("ready", function() {
          board = me.board;
          me.port = _port;
          me.connected = true;
          var led = new five.Led(13);
          me.ifaz = new Interfaz(board);
          model = me.ifaz.init({model: ""});
          console.log(model)
          //window.localStorage.setItem("model", model);
          if(callback)
          callback({"type": "connect", "msg" : board.port});

          var lcd = me.ifaz.lcd();
          lcd.clear();
          lcd.print(0,"Conectado en");
          lcd.print(1, board.port.substring(board.port.indexOf('/',2)+1));
          /*
          var lcd = new five.LCD({ 
            controller: "PCF8574"
          });    
          lcd.clear();
          lcd.home().print("Conectado en");
          lcd.print(board.port);
          */
        });    
        
        return 1;
      } else {
        console.log("No existe el puerto: ", port);   
        if(callback)
        callback({"type": "error", "msg": "No existe el puerto: "+ port });
        return 0;
      }

  })
}

  this.isConnected = function() {
    return this.connected;
  }

}



module.exports =  {
  serial: new Serial()
}


