var five = require("johnny-five");
var board = new five.Board({
  baudrate: 57600,
  repl: false
});

board.on("ready", function() {

  const proximity = new five.Proximity({
    controller: "HCSR04",
    pin: "A0"
  });

  proximity.on("change", () => {
    const {centimeters, inches} = proximity;
    console.log("Proximity: ");
    console.log("  cm  : ", centimeters);
    console.log("  in  : ", inches);
    console.log("-----------------");
  });

});
