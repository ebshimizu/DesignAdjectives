const Promise = require('bluebird');
const sio = require('socket.io-client');

let socket;

export function Training(x, y) {
  return { x, y };
}

export class DsDriver {
  constructor(port = 5234) {
    this.addr = `http://localhost:${port}`;
    socket = sio(this.addr);
    socket.emitAsync = Promise.promisify(socket.emit);
    this.sampleCallback = null;
    this.connectCallback = null;
    this.sampleFinalCallback = null;
    this.connected = false;
    this.snippetServerOnline = false;

    this.bind();
  }

  bind() {
    const self = this;

    socket.on('connect', function() {
      console.log(`Snippets Node Driver connected to ${self.addr}`);
      self.connected = true;

      if (self.connectCallback)
        self.connectCallback(self.connected, self.snippetServerOnline);
    });

    socket.on('getType', function(cb) {
      // eslint-disable-next-line standard/no-callback-literal
      cb('client');
    });

    socket.on('disconnect', function() {
      console.log(`Snippets Node Driver disconnected from ${self.addr}`);
      self.connected = false;
      self.snippetServerOnline = false;

      if (self.connectCallback)
        self.connectCallback(self.connected, self.snippetServerOnline);
    });

    socket.on('single sample', function(data, snippetName) {
      self.sampleReturned(data, snippetName);
    });

    socket.on('sampler complete', function(data, snippetName) {
      self.samplerComplete(data, snippetName);
    });

    socket.on('no server', function() {
      console.log('No server connected. Unable to use snippet functions.');
      self.snippetServerOnline = false;

      if (self.connectCallback)
        self.connectCallback(self.connected, self.snippetServerOnline);
    });

    socket.on('server ok', function() {
      console.log('Snippet server online');
      self.snippetServerOnline = true;

      if (self.connectCallback)
        self.connectCallback(self.connected, self.snippetServerOnline);
    });
  }

  disconnect() {
    socket.close();
    this.connected = false;
    this.snippetServerOnline = false;

    if (this.connectCallback)
      this.connectCallback(this.connected, this.snippetServerOnline);
  }

  // Calls a user provided callback function when a sample gets returned
  // in process
  sampleReturned(data, snippetName) {
    console.log(
      `Received sample for snippet ${snippetName} with id ${data.idx}`
    );

    if (this.sampleCallback) this.sampleCallback(data, snippetName);
  }

  samplerComplete(data, snippetName) {
    console.log(`Received final snippet data from ${snippetName}`);

    if (this.sampleFinalCallback) this.sampleFinalCallback(data, snippetName);
  }

  // most functions in this driver will be using the async/await format to pretend
  // like this is synchronous
  async exec(fn, args) {
    try {
      const res = await socket.emitAsync('action', { fn, args });
      return res;
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  // and here's a function that'll use the traditional callbacks if needed
  execCb(fn, args, cb) {
    socket.emit('action', { fn, args }, cb);
  }

  // the following functions are basically convenience functions
  async addSnippet(name) {
    const res = await this.exec('add snippet', { name });
    return res;
  }

  async deleteSnippet(name) {
    const res = await this.exec('delete snippet', { name });
    return res;
  }

  async listSnippets() {
    const res = await this.exec('list snippets', {});
    return res;
  }

  async setData(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet set data', { name, data });
    return res;
  }

  async addData(name, x, y) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet add data', { name, x, y });
    return res;
  }

  async removeData(name, index) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet remove data', { name, index });
    return res;
  }

  async train(name) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet train', { name });
    return res;
  }

  async showLoss(name) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet plotLastLoss', { name });
    return res;
  }

  async plot1D(name, x, dim, rmin = 0.0, rmax = 1.0, n = 100) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet plot1D', {
      name,
      x,
      dim,
      rmin,
      rmax,
      n
    });
    return res;
  }

  async predictOne(name, x) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.predict(name, [x]);
    return res;
  }

  async predict(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet predict', { name, data });
    return res;
  }

  async sample(name, params) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet sample', { name, data: params });
    return res;
  }

  async setProp(name, propName, val) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet setProp', { name, propName, val });
    return res;
  }

  async getProp(name, propName) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet getProp', { name, propName });
    return res;
  }

  async stopSampler() {
    const res = await this.exec('stop sampler');
    return res;
  }

  async samplerRunning() {
    const res = await this.exec('sampler running');
    return res;
  }

  async reset() {
    await this.exec('reset');
    console.log('Server reset performed');
  }
}

export default DsDriver;
