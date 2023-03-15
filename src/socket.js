const { Server } =  require('socket.io')
var fs = require('fs');

//const createTable = require('data-table');

function Socket() {

  this.io = false;
  this.ifaz = false;
  this.instances = new Array();


  this.handler = function(req, res) {
      //console.log(__dirname + '/public' + req.url);
      url = req.url;
      if(req.url == "/socket.io-client") {
        url += ".min.js";
      }
      fs.readFile(__dirname + '/public' + url,
        function (err, data) {
          if (err) {
            res.writeHead(404);
            return res.end('Not found');
          }
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');          
          res.writeHead(200);
          res.end(data);
        });
    }

  this.init = function() {
    var http = require('http').createServer(this.handler)
    this.io = new Server(http, {
      cors: {
        origin: "*",
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true
      }    
    });
    try {
      http.listen(4268);
    } catch (err) {
      console.log(err)
    }
  }
  
  this.initMessage = function() {
    if(!this.ifaz) return false;
    if(typeof this.ifaz.lcd() == "undefined") return false;
   // this.ifaz.lcd().clearTimeout();  
    return true;
  }
  
  this.setInterfaz = function(ifaz) {
    this.ifaz = ifaz;
    this.initEvents();
  }

  this.initEvents = function() {

    var ifaz = this.ifaz;
    var me = this;
    
    this.io.sockets.on('connection', function (socket) {
      console.log("Conexion")
      socket.conn.on("packet", ({ type, data }) => {
        // called for each packet received
        console.log(type, data)
        ifaz = me.ifaz;
        me.initMessage();
      });      
      
      me.socketInstance = socket;

      socket.emit("SOCKET_CONNECTED");
      

      socket.on('RESTART', function () {
        //window.location.reload();
      })
    
    
      socket.on('OUTPUT', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var result = ifaz.output(data.index)[data.method](data.param);
        //
      })
    
      socket.on('PIN', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var result = ifaz.pin(data.index)[data.method](data.param);
      })
      
      socket.on('STEPPER', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var result = ifaz.stepper(data.index)[data.method](data.param, function (result) {
          socket.emit('STEPPER_MESSAGE', { index: data.index, value: result });
        });
      })
      
      socket.on('SERVO', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var result = ifaz.servo(data.index)[data.method](data.param);
      })
      
      socket.on('ANALOG', (data, callback) => {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        obj = ifaz.analog(data.index);
        if(!obj.changeCallback) obj.change((result) => {
          socket.emit('ANALOG_MESSAGE', { index: data.index, value: result });
        })
        var result = ifaz.analog(data.index)[data.method]();
        if(callback) {
          callback(result);
        }
      })
      
      socket.on('PING', (data, callback) => {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var obj = ifaz.ping(data.index);
        var result = obj[data.method](function (result) {
          //console.log(result)
          ifaz.ping(data.index).cm = result.cm;
          socket.emit('PING_MESSAGE', { index: data.index, cm: result.cm, inches: result.inches, value: result.cm });
        }, data.controller);
        let value = ifaz.ping(data.index).value();
        if(callback) callback(value);        
      })
      
      socket.on('PIXEL', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var obj = ifaz.pixel(data.index);
        var result = obj[data.method](data.param, data.param2, data.param3);
      })
      
      socket.on('I2CJOYSTICK', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var obj = ifaz.I2CJoystick(data.index);
        if(data.method == "on") {
    
          var result = obj[data.method](function(d) {
            x = d[0].value < 500 ? -1 : d[0].value < 950 ? 0 : 1;
            y = d[1].value < 500 ? -1 : d[1].value < 950 ? 0 : 1;
            btn = d[2].value < 1 ? 1 : 0;
            socket.emit('I2CJOYSTICK_MESSAGE', { "x": x, "y": y, "button": btn });
          });
            /*
          var result = obj[data.method](function(d) {
            console.log("x: ",d);
           socket.emit('I2CJOYSTICK_MESSAGE', { "x": d });
          }, function(d) {
            console.log("y: ",d);
            d = d < 500 ? -1 : d < 950 ? 0 : 1;
            socket.emit('I2CJOYSTICK_MESSAGE', { y: d });
          }, function(d) {
            console.log("b: ",d);
            d = d < 50 ? 1 : 0;
            socket.emit('I2CJOYSTICK_MESSAGE', { button: d });
          });
            */
        }
      })
    
      socket.on('DIGITAL', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        obj = ifaz.digital(data.index);
        if(!obj.changeCallback) obj.change((result) => {
            socket.emit('DIGITAL_MESSAGE', { index: data.index, value: result });
            console.log(result)
        })
        var result = ifaz.digital(data.index)[data.method]();
      })
    
      socket.on('LCD', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        var result = ifaz.lcd()[data.method](data.param, data.param2);
    
      })
      
      
      socket.on('I2C', function (data) {
        if(!ifaz)  return;
        data = typeof data == "string" ? JSON.parse(data) : data;
        ifaz.i2c(data.address)[data.method](data.register, data.param, function (result) {
          socket.emit('I2C_MESSAGE', { address: data.address, register: data.register, value: result });
        });
      })
      
      socket.on('DEVICES_RESET', function () {
        me.instances = new Array();
      });
    
      socket.on('DEVICE_REMOVE', function (data) {
        me.instances = me.instances.filter(i => i.id != data.id);
        if (typeof ins== "object") {
          ins.device.removeAllListeners();
        }
      });
    
    
      socket.on('DEVICE', function (data, fn) {
        if(typeof data == "string") data = JSON.parse(data);
        var ins = me.instances.filter(i => i.id == data.id).shift();
        // SI YA EXISTE SALGO
        if(ins) {
          if(typeof fn !="undefined") fn(false);
          return;
        }
        //let vm = new VM({ sandbox: { me.instances: me.instances, data: data, five: five }, require: {external: true,root: "./", }});
        try {
          console.log(data.options);
          data.options = (typeof data.options == "string") ? data.options : JSON.stringify(data.options);
          let result = eval('new five.' + data.device + '(' + data.options + ')');
          me.instances.push({id: data.id, device: result});
          console.log(me.instances)
        }
        catch (error) {
          console.error(error);
          if(typeof fn !="undefined")  fn(false);
        }
        socket.emit("DEVICE_ID", {"device": data.device, "id": me.instances.length - 1});
        if(typeof fn !="undefined") fn(me.instances.length - 1);
      })
    
      socket.on('DEVICE_EVENT', function (data, fn) {
        if(typeof data == "string") data = JSON.parse(data);
        console.log(data);
        var ins = me.instances.filter(i => i.id == data.id).shift();
        if (typeof ins== "object") {
          if(typeof data.attributes == "string") data.attributes = JSON.parse(data.attributes);
          ins.device.on(data.event, function () {
            results = {};
            try {
              if(typeof data.attributes != "undefined")
              data.attributes.forEach((reg) => {
                results[reg] = eval("this."+reg);
              })
              socket.emit('DEVICE_MESSAGE', { event: data.event , id: data.id, attributes: results });
            } catch (error) {
              console.log(error);
              if(typeof fn !="undefined") fn(false);
            }
          });
          if(typeof fn !="undefined") fn(true);
        } else {
          if(typeof fn !="undefined") fn(false);
        }
      })
    
      socket.on('DEVICE_CALL', function (data, fn) {
        if(!ifaz)  return;
        console.log(me.instances, data);
        var ins = me.instances.filter(i => i.id == data.id).shift();
        if(!ins) { 
          if(typeof fn !="undefined") fn(false);
          return;
        };
        //let vm = new VM({ sandbox: { ins: ins, data: data, five: five } });
        try {
          let result = eval('ins.device.' + data['method']);
          //let result = eval('ins.device.' + data['method']);
        }
        catch (error) {
          console.error(error);
          if(typeof fn !="undefined") fn(false);
        }
        if(typeof fn !="undefined") fn(true);
      })

      
    })
  }
    
}


module.exports = {
    socket: new Socket()
  };