var os = require('os');
const Socket = require("./socket.js")
const Serial = require("./serial.js")

Socket.socket.init();

function send_msg(type, data) {
  data.type = type;
  process.send(data)
}

async function  listSerialPorts() {
  const ports  =  await Serial.serial.serialport.list();
  return ports;
}

function connectCallback(msg) {
  Socket.socket.setInterfaz(Serial.serial.getIfaz());
  process.send(msg)
}

async function socketList() {
  var ifaces = os.networkInterfaces();
  console.log("ifaces", ifaces)
  var ips = new Array("127.0.0.1");
  
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
  
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
      ips.push(iface.address);
  
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        console.log(ifname, iface.address);
      }
      ++alias;
    });
  });
  return ips;
}

socketList().then((list)=>{
  send_msg("socketList", {"sockets": list});
})

process.on("message", (m) => {
  t = m.type;
  switch (t) {
    case "listSerialPorts":
      listSerialPorts().then(l => {
        send_msg("listSerialPorts", {"ports": l});
      })
    break;
    case "serialConnect":
      Serial.serial.connect(m.port,connectCallback);
    break;
    case "socketDisconnect":
      if(typeof Socket.socket.socketInstance != "undefined")
        Socket.socket.socketInstance.disconnect();
      send_msg("socketDisconnected", {"port": m.port});
    break;
    }
})