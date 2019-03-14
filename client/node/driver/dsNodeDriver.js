var Promise = require("bluebird");
const sio = require("socket.io-client");
var socket;

function Training(x, y) {
  return { x, y };
}

class dsDriver {
  constructor(port = 5234) {
    this.addr = `http://localhost:${port}`;
    socket = sio(this.addr);
    socket.emitAsync = Promise.promisify(socket.emit);

    this.bind();
  }

  bind() {
    const self = this;

    socket.on("connect", function() {
      console.log(`Snippets Node Driver connected to ${self.addr}`);
    });

    socket.on("getType", function(cb) {
      cb("client");
    });

    socket.on("disconnect", function() {
      console.log(`Snippets Node Driver disconnected from ${self.addr}`);
    });
  }

  // most functions in this driver will be using the async/await format to pretend
  // like this is synchronous
  async exec(fn, args) {
    try {
      const res = await socket.emitAsync("action", { fn, args });
      return res;
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  // and here's a function that'll use the traditional callbacks if needed
  execCb(fn, args, cb) {
    socket.emit("action", { fn, args }, cb);
  }

  // the following functions are basically convenience functions
  async addSnippet(name) {
    const res = await this.exec("add snippet", { name });
    return res;
  }

  async deleteSnippet(name) {
    const res = await this.exec("delete snippet", { name });
    return res;
  }

  async listSnippets() {
    const res = await this.exec("list snippets", {});
    return res;
  }

  async setData(name, data) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet set data", { name, data });
    return res;
  }

  async addData(name, x, y) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet add data", { name, x, y });
    return res;
  }

  async removeData(name, index) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet remove data", { name, index });
    return res;
  }

  async train(name) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet train", { name });
    return res;
  }

  async showLoss(name) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet plotLastLoss", { name });
    return res;
  }

  async plot1D(name, x, dim, rmin = 0.0, rmax = 1.0, n = 100) {
    if (typeof name !== "string") throw "Missing Snippet Name";

    const res = await this.exec("snippet plot1D", {
      name,
      x,
      dim,
      rmin,
      rmax,
      n
    });
    return res;
  }
}

exports.dsDriver = dsDriver;
exports.Training = Training;
