const { LCD } = require("johnny-five");
var pixel = require("./lib/pixel.js");

String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

const DC_MESSAGE = 2
const DC_ON = 1
const DC_OFF = 2
const DC_BRAKE = 3
const DC_INVERSE = 4
const DC_DIR = 5
const DC_SPEED = 6

const LCD_DATA = 3;
const LCD_PRINT = 0;
const LCD_PUSH = 1;
const LCD_CLEAR = 2;


module.exports = function (five) {
    return (function(opts) {
  
      function Interfaz(board) {
        if (!(this instanceof Interfaz)) {
          return new Interfaz(opts);
        }

        this.SERVOJ5 = class Servo {
            constructor(deviceNum) {
                this.deviceNum = deviceNum; 
                board.pinMode(deviceNum, five.Pin.SERVO)
                this.io = new five.Servo(deviceNum);
            }
            destructor() {}
            name() { return Servo.name }
            position = function (pos) {
                this.io.to(pos);
                return true;
            }
        }

        this.SENSOR = class Sensor {
            constructor(channel) {
                this.channel = channel;
                this.sensor = new five.Sensor("A"+this.channel);
                this.changeCallback = false;
                board.pinMode(channel, five.Pin.ANALOG)
            }
            destructor() {
                this.off();
            }
            name() { return Sensor.name }
            change = function(callback) {
                this.changeCallback = callback;
            } 
            on = function() {
                //this.io.pinMode(this.pin, this.mode);
                this.sensor.on("change", this.changeCallback);
                return true;
            }
            off = function () { 
                if(this.sensor) this.sensor.removeAllListeners();
                board.io.reportAnalogPin(this.channel, 0);
                return true;
            }
            value = function() {
                return this.sensor.raw;
            }
        }
        
        this.DC = class DCOutput {
            constructor (deviceNum) {
                this.dir = 0;
                this.deviceNum = deviceNum;
                this.speed = 100;
            }
            destructor() {
            }
            name() { return DCOutput.name }
            on = function() {
                board.io.sysexCommand([DC_MESSAGE,DC_ON,this.deviceNum]);
                return true;
            }
            off = function() {
                board.io.sysexCommand([DC_MESSAGE,DC_OFF,this.deviceNum]);
                return true;
            }
            brake = function() {
                board.io.sysexCommand([DC_MESSAGE,DC_BRAKE,this.deviceNum]);
                return true;
            }
            inverse = function() {
                this.dir = !this.dir;
                board.io.sysexCommand([DC_MESSAGE,DC_INVERSE,this.deviceNum]);
                return true;
            }
            direction = function(dir) {
                this.dir = dir;
                board.io.sysexCommand([DC_MESSAGE,DC_DIR,this.deviceNum, dir]);
                return true;
            }
            power = function(pow) {
                this.speed = pow;
                board.io.sysexCommand([DC_MESSAGE,DC_SPEED,this.deviceNum, pow]);
                return true;
            }
        }

        this.PIN = class Pin {
            constructor(deviceNum) {
                this.deviceNum = deviceNum;
                this.io = new five.Pin(deviceNum)
            }
            destructor() {
            }
            name() { return Pin.name }
            on = function() {
                board.io.pinMode(this.deviceNum, five.Pin.OUTPUT);
                this.io.high();
            }
            off = function() {
                board.io.pinMode(this.deviceNum, five.Pin.OUTPUT);
                this.io.low();
            }
            write = function(value) {
                board.io.pinMode(this.deviceNum, five.Pin.PWM);
                board.analogWrite(this.deviceNum, value)
            }
        }

        this.DIGITAL = class Digital {
            constructor(pin) {
                this.pin = pin;
                this.changeCallback = false;
                this.mode = board.io.MODES.INPUT;
            }
            destructor() {
            }
            name() { return Digital.name }
            change = function(callback) {
                this.changeCallback = callback;
            } 
            on = function () {
                board.io.pinMode(this.pin, this.mode);
                board.digitalRead(this.pin, this.changeCallback);
                return true;
            }
            pullup = function (enabled) {
                this.mode = (enabled) ? board.io.MODES.PULLUP : board.io.MODES.INPUT;
                board.io.pinMode(this.pin, this.mode);
                return true;
            }
            off = function () { 
                board.io.reportDigitalPin(this.pin, 0);
                return true;
        
            }    
        }

        this.LCDPCF8574 = class {
            constructor() {
                this.io = new five.LCD({
                    controller: "PCF8574",
                    address:  0x27,
                    bus: 2,
                    rows: 2,
                    cols: 16
                });
                this.enabled = true;
                this.io.backlight().home().noBlink().noCursor().on();
            }
            on = function() {
                this.io.backlight().on();
                this.enabled = true;
                return {};
            }
            off = function() {
                this.io.noBacklight();
                this.silence();
                return {};
            }
            silence = function() {
                this.enabled = false;
                return {};
            }
            clear = function() {
                this.io.clear();
                return {};
            }
            print = function(row, str) {
                var col = Math.floor((16-(str.length))/2);
                this.io.cursor(row,col).print(str);
                return {};
            }
        }     
        
        this.I2C = class {
            constructor(address, delay) {
                this.address = address;
                board.io.i2cConfig({ address: address, delay: delay });
            }
            on = function (register, numberOfBytesToRead, callback) {
                board.io.i2cRead(this.address, register, numberOfBytesToRead, callback);
            }
            /* NOT IMPLEMENTED 
            this.off = function (register) {
                this.io.i2cRead(this.address, register, 0, function () { });
            }
            /****/
            read = function (register, numberOfBytesToRead, callback) {
                board.io.i2cReadOnce(this.address, register, numberOfBytesToRead, callback);
            }
            write = function (register, data) {
                board.io.i2cWrite(this.address, register, data);
            }
        }        

        this.PIXEL = class Pixel {
            constructor(pin) {
                this.pin = pin;
                this.strip = false;
                this.length = 1;
                board.io.pinMode(this.pin, five.Pin.OUTPUT);
            }
            destructor() {
            }
            name() { return Pixel.name }
            create = function(length) {
                this.length = length;
                this.strip = new pixel.Strip({
                    data: this.pin,
                    length: this.length,
                    skip_firmware_check: true,
                    color_order: pixel.COLOR_ORDER.GRB,
                    board: board,
                    controller: "FIRMATA",
                });        
                return true;
            }
            pixel = function(i) {
                return (this.strip) ?  this.strip.pixel(i-1) : false;
            }
            color = function(color, i) {
                if(!this.strip) return;
                if(i > 0) {
                    if(i > this.length) return;
                    var el = this.strip.pixel(i - 1);
                } else {
                    var el = this.strip;
                }
                el.color(color);
                this.strip.show();
                return true;
            }
            shift = function(offset, direction, wrap) {
                if(!this.strip) return;
                this.strip.shift(offset, direction, wrap);
                this.strip.show();
                return true;
            }
            on = function(i) {
                if(!this.strip) return;
                if(i > 0) {
                    if(i > this.length) return;
                    var el = this.strip.pixel(i - 1);
                } else {
                    var el = this.strip;
                }
                el.color("white");
                this.strip.show();
                return true;
            }
            off = function (i) { 
                if(!this.strip) return;
                if(i > 0) {
                    if(i > this.length) return;
                    var el = this.strip.pixel(i - 1);
                } else {
                    var el = this.strip;
                }
                el.off();
                this.strip.show();
                return true;
            }
        
        }

        // Board.Component
        //    - Register the component with an
        //      existing Board instance.
        //
        // Board.Options
        //    - Normalize incoming options
        //      - Convert string or number pin values
        //        to `this.pin = value`
        //      - Calls an IO Plugin's `normalize` method
        //
        five.Board.Component.call(
          this, opts = five.Board.Options(opts)
        );
  
        this.board = board;
        this._pins = new Array();
        this._dc = new Array();
        this._i2cs = new Array();
        this.MAXOUTPUTS = 4;

        
        this._lcd = new this.LCDPCF8574();
        
        //this._lcd = new LCDInternal(this.io)
        
    }
    
    Interfaz.prototype.init = function(opts = {}) {
        console.log(board);
        // Define Component initialization
        switch(this.board.type) {
            case "UNO": opts.model = "uno"; break;
            case "MEGA": opts.model = "mega"; break;
            case "OTHER": opts.model = "rasti"; break;
        }
        this.opts = opts;
        switch(opts.model) {
            case "uno":
                if(this.board.type != "UNO") return;
                this.MAXOUTPUTS = 4;
                this.MAXSTEPPERS = 0;
                this.MAXSERVOS = 2;
                this.MAXDIGITAL = 4;
                this.MAXPIXELS = 2;
                this.MAXPINS = 2;
                this.MAXI2CJOYSTICK = 1;
                //var configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V1;
                //this.dc_config = [configs.M1,configs.M2, configs.M3, configs.M4];
                this.servo_config = [9,10];
                this.pins_config = [9,10];
                this.pings_config = ["A0","A1","A2","A3"];
                this.digital_config = [14,15,16,17];
                this.pixels_config = [9,10];
                this._servos = new Array(); 
                this._analogs = new Array(); 
                this._digitals = new Array();
                this._pings = new Array();
                this._pixels = new Array();
                this._i2cjoysticks = new Array();
            break;
            case "mega":
                if(this.board.type != "MEGA") return;
                this.MAXOUTPUTS = 8;
                this.MAXSTEPPERS = 3;
                this.MAXSERVOS = 3;
                this.MAXANALOGS = 8;
                this.MAXDIGITAL = 6;
                this.servo_config = [10,11,12];
                this.digital_config = [64,65,66,67,68,69];
                this.pings_config = ["A0","A1","A2","A3","A4","A5"];
                this.dc_config = [
                    {pins: {pwm:2,dir:22,cdir:23}}, 
                    {pins: {pwm:3,dir:24,cdir:25}}, 
                    {pins: {pwm:4,dir:26,cdir:27}},
                    {pins: {pwm:5,dir:28,cdir:29}},
                    {pins: {pwm:6,dir:30,cdir:31}},
                    {pins: {pwm:7,dir:32,cdir:33}},
                    {pins: {pwm:8,dir:34,cdir:35}},                  
                    {pins: {pwm:9,dir:36,cdir:37}}                        
                ];
                this._steppers.push(new ACCELSTEPPER(this.io, 38, 39, 40, 0));
                this._steppers.push(new ACCELSTEPPER(this.io, 41, 42, 43, 1));
                this._steppers.push(new ACCELSTEPPER(this.io, 44, 45, 46, 2));
                this._servos = new Array();
                this._analogs = new Array();
                this._digitals =new Array(); 
                this._pings = new Array();
                break;
                case "rasti":
                    this.MAXANALOGS = 4;
                    this.MAXDIGITAL = 4;
                    this.MAXPINS = 4;
                    this.MAXOUTPUTS = 2;
                    this.MAXSERVOS = 4;
                    this.MAXPIXELS = 4;
                    this.MAXI2CJOYSTICK = 1;
                    this.digital_config = [9,10,11,12];
                    this.analog_config = [14,15,16,17];
                    this.pixels_config = [9,10,11,12];
                    this.pings_config = [9,10,11,12];
                    //this.dc_config = [[6,7],[4,5]]
                    this.pins_config = [9,10,11,12];
                    this.servo_config = [9,10,11,12];
                    this._servos = new Array();
                    this._analogs = new Array();
                    this._digitals = new Array();
                    this._pins = new Array();
                    this._pings = new Array();
                    this._pixels = new Array();
                    this._i2cjoysticks = new Array();
            break;
        }
           //console.log(this);
            return opts.model;
    }

  
        Interfaz.prototype.output = function (index) {
            if (index < 0)  index = 0;
            if (index > this.MAXOUTPUTS) return index = this.MAXOUTPUTS;
            if(typeof this._dc[index] == "undefined") {
                /*
                if(this.opts.model == "rasti") {
                    this._dc[index-1] = new RastiCC(this.io, this.dc_config[index-1], index-1);
                } else {
                    this._dc[index-1] = new DCL293(new five.Motor(this.dc_config[index-1]), index-1);
                }
                */
               this._dc[index] = new this.DC(index);

            }
            return this._dc[index];
        }

        Interfaz.prototype.servo = function (index) {
            if (index < 0) index = 0;
            if (index > this.io.pins.length - 1) index = this.io.pins.length - 1;
            if(typeof this._pins[index] == "undefined" ||  this._pins[index].name() != "Servo") {
                if(typeof this._pins[index] != "undefined" && typeof  this._pins[index].destructor == "function") this._pins[index].destructor();
                this._pins[index] = new this.SERVOJ5(index);
            }
            return this._pins[index];
        }

        Interfaz.prototype.analog = function (index) {
            if (index < 0) index = 0;
            if (index > this.io.analogPins.length - 1) index = this.io.analogPins.length - 1;
            var offset = this.io.analogPins[index]
            if(typeof this._pins[offset] == "undefined" ||  this._pins[offset].name() != "Sensor") {
                if(typeof this._pins[offset] != "undefined") this._pins[offset].destructor();
                this._pins[offset] = new this.SENSOR(index);
            }
            return this._pins[offset];

            /*
            if (index < 1) return this._analogs[0];
            if (index > this.MAXANALOGS) return this._analogs[this.MAXANALOGS - 1];
            return this._analogs[index - 1];
            */
        }

        Interfaz.prototype.digital = function (index) {
            if (index < 0)  index = 0;
            if (index > this.board.pins.length) return index = this.board.pins.length;
            if(typeof this._pins[index] == "undefined" ||  this._pins[index].name() != "Digital") {
                if(typeof this._pins[index] != "undefined" && typeof  this._pins[index].destructor == "function") this._pins[index].destructor();
                this._pins[index] = new this.DIGITAL(index);
            }
            return this._pins[index];
        }

        Interfaz.prototype.pin = function (index) {
            if (index < 0)  index = 0;
            if (index > this.board.pins.length) return index = this.board.pins.length;
            if(typeof this._pins[index] == "undefined" ||  this._pins[index].name() != "Pin") {
                if(typeof this._pins[index] != "undefined" && typeof  this._pins[index].destructor == "function") this._pins[index].destructor();
                this._pins[index] = new this.PIN(index);
            }
            return this._pins[index];
        }
    
        Interfaz.prototype.i2c = function (address, delay) {
            if (typeof this._i2cs[address] == "undefined") {
                if (typeof delay == "undefined") delay = 50;
                this._i2cs[address] = new this.I2C(address, delay);
            }
            return this._i2cs[address];
        }

        Interfaz.prototype.lcd = function() {
            return this._lcd;
        }

        Interfaz.prototype.ping = function (index, controller) {
            if (index < 1) index = 1;
            if (index > this.MAXANALOGS) index = this.MAXANALOGS;
            if(typeof controller == "undefined") controller = "HCSR04";
            var channel = this.pings_config[index-1];
            if(typeof this._pings[index-1] == "undefined") {
                this._pings[index-1] = new PING(five, channel, controller, this.io, index);
            }
            return this._pings[index-1];
        }
        
        Interfaz.prototype.pixel = function (index, controller) {
            if (index < 0)  index = 0;
            if (index > this.board.pins.length) return index = this.board.pins.length;
            if(typeof this._pins[index] == "undefined" ||  this._pins[index].name() != "Pixel") {
                if(typeof this._pins[index] != "undefined" && typeof  this._pins[index].destructor == "function") this._pins[index].destructor();
                this._pins[index] = new this.PIXEL(index);
            }
            return this._pins[index];
        }

  
      return Interfaz;
    }());
  };
  
  
  /**
   *  To use the plugin in a program:
   *
   *  var five = require("johnny-five");
   *  var Interfaz = require("interfaz")(five);
   *
   *
   */