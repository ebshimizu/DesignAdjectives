const socket = require("socket.io-client")("http://localhost:5234");

socket.on("connect", function() {
  console.log("connected");
});

socket.on("getType", function(cb) {
  cb("client");
});

setTimeout(() => {
  console.log("attempting send");
  socket.emit("action", { fn: "add snippet", args: { name: "test" } }, function(
    resp
  ) {
    console.log(resp);
  });
}, 2000);
