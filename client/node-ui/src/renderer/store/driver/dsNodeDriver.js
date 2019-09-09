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
    this.lossCallback = null;
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

    socket.on('training loss', function(data, snippetName) {
      if (self.lossCallback) self.lossCallback(data, snippetName);
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

  async setParamInfo(params) {
    await socket.emitAsync('set param info', params);
  }

  /**
   * This is the function that gets executed when a sample gets returned from the server.
   * @param {Object} data
   * @param {number[]} data.x Feature vector, numeric
   * @param {number} data.mean Mean value of the GPR at this point
   * @param {number} data.cov Covariance of the GPR at this point
   * @param {number} data.idx Sample Index
   * @param {string} snippetName Snippet ID
   */
  sampleReturned(data, snippetName) {
    console.log(
      `Received sample for snippet ${snippetName} with id ${data.idx}`
    );

    if (this.sampleCallback) this.sampleCallback(data, snippetName);
  }

  /**
   * Accepts a final message from the server containing all generated samples.
   * @param {Object} data
   * @param {string} snippetName
   */
  samplerComplete(data, snippetName) {
    console.log(`Received final snippet data from ${snippetName}`);

    if (this.sampleFinalCallback) this.sampleFinalCallback(data, snippetName);
  }

  // most functions in this driver will be using the async/await format to pretend
  // like this is synchronous
  /**
   * Utility function to call functions on the server
   * @param {string} fn Function identifier (see dsServer.py)
   * @param {Object} args Object containing arguments to forward to the server
   */
  async exec(fn, args) {
    try {
      const res = await socket.emitAsync('action', { fn, args });
      return res;
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  // and here's a function that'll use the traditional callbacks if needed
  /**
   * Utility function to call functions on the server. Callback version.
   * @see exec
   * @param {string} fn Function identifier
   * @param {Object} args Object containing arguments to forward to the server
   * @param {function(data: Object)} cb Callback for returned data
   */
  execCb(fn, args, cb) {
    socket.emit('action', { fn, args }, cb);
  }

  // the following functions are basically convenience functions
  /**
   * Creates a new snippet. If a snippet already exists, the function returns false.
   * @param {string} name Snippet name
   * @return {boolean} True on success, false if a snippet already exists.
   */
  async addSnippet(name) {
    const res = await this.exec('add snippet', { name });
    return res;
  }

  /**
   * Deletes a snippet on the server
   * @param {string} name Snippet name
   */
  async deleteSnippet(name) {
    const res = await this.exec('delete snippet', { name });
    return res;
  }

  /**
   * @return {string[]} List of snippets that are currently available on the server.
   */
  async listSnippets() {
    const res = await this.exec('list snippets', {});
    return res;
  }

  /**
   * Sets the training data for the specified snippet.
   * @param {string} name Snippet name, required
   * @param {Object[]} data Data array. Consists of objects with fields {x: number[], y: number}
   */
  async setData(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet set data', { name, data });
    return res;
  }

  /**
   * Adds a single data point to the specified snippet.
   * @param {string} name Snippet name
   * @param {number[]} x Feature vector
   * @param {number} y Preference score
   */
  async addData(name, x, y) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet add data', { name, x, y });
    return res;
  }

  /**
   * Removes a training point from a snippet.
   * @param {string} name Snippet name
   * @param {number} index Integer array index indicating value to remove
   */
  async removeData(name, index) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet remove data', { name, index });
    return res;
  }

  /**
   * Starts the training process for the specified snippet.
   * @param {string} name Snippet name
   * @return {Object} Contains information about the learned GPR values. Client applications should save.
   */
  async train(name, customFilter = null) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const args = {
      name
    };

    if (customFilter) args.customFilter = customFilter;

    const res = await this.exec('snippet train', args);
    return res;
  }

  /**
   * Asks the server to display the loss graph from the specified snippet.
   * This is unavailable if the snippet was loaded from a client application instead of recently trained.
   * @param {string} name Snippet name
   */
  async showLoss(name) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet plotLastLoss', { name });
    return res;
  }

  /**
   * Asks the server to display a plot of the GPR over one dimension, with other dimensions held constant.
   * @param {string} name Snippet name
   * @param {number[]} x Current feature vector
   * @param {number} dim Index of the dimension to plot over in feature space, numeric between 0 and x.length
   * @param {number} rmin minimum value for the specified dimension
   * @param {number} rmax maximum value for the specified dimension
   * @param {number} n Number of samples to take between min and max
   */
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

  /**
   * Returns the value and covariance of the GPR at point x
   * @param {string} name Snippet name
   * @param {number[]} x Feature vector
   * @return {Object} Contains fields "mean" and "cov"
   */
  async predictOne(name, x) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet predict one', { name, data: x });
    return res;
  }

  /**
   * Predicts multiple data points at the same time.
   * @param {string} name Snippet name
   * @param {number[][]} data Prediction points
   * @return {Object} Contains fields "mean" and "cov", number[]
   */
  async predict(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet predict', { name, data });
    return res;
  }

  /**
   *
   * @param {name} name Snippet name
   * @param {Object} data Parameters for predict1D
   * @param {number[]} data.x Initial parameter vector
   * @param {number} data.dim Dimension to evaluate over
   * @param {?number} data.rmin Minimum value between 0 and 1 to start evaluation at
   * @param {?number} data.rmax Maximum value between 0 and 1 to stop evaluation at
   * @param {?number} data.n Number of steps
   */
  async predict1D(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet 1DPredict', { name, data });
    return res;
  }

  /**
   *
   * @param {String} name Snippet name
   * @param {Object} data Parameters for predictAll1D
   * @param {number[]} data.x Initial parameter vector
   * @param {?number} data.rmin Minimum value between 0 and 1 to start evaluation at
   * @param {?number} data.rmax Maximum value between 0 and 1 to stop evaluation at
   * @param {?number} data.n Number of steps
   */
  async predictAll1D(name, data) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet 1DPredictAll', { name, data });
    return res;
  }

  /**
   * Start sampling the specified snippet
   * @param {string} name Snippet name
   * @param {Object} params Sampling parameters. See below for some common options.
   * @param {number[]} params.x0 Initial feature vector
   * @param {?number} params.qMin [Metropolis] quality threshold
   * @param {?number} params.epsilon [Metropolis] sample difference threshold
   * @param {?number} params.n Number of samples to return
   * @param {?number} params.burn [Metropolis] Burn-in time
   * @param {?number} params.limit Number of samples to evaluate. Upper bound on sampling runtime
   * @param {?number} params.stride [Metropolis] Number of samples to skip between accepts
   * @param {?number} params.scale [Metropolis] Step size
   * @param {?number} params.threshold [Rejection] Minimum quality threshold
   * @param {?number} params.free [Rejection] Initial number of parameters to keep free
   */
  async sample(name, params) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet sample', { name, data: params });
    return res;
  }

  /**
   * Starts a refinement sampler process. Uses the Bootstrapper sampler on the server.
   * @param {string} name Snippet name
   * @param {number[]} x0 Starting parameter vector
   * @param {Object} params Bootstrap sampler parameters
   * @param {?number} params.n Number of samples to return
   */
  async refine(name, x0, params) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet refine', { name, x0, data: params });
    return res;
  }

  /**
   * Retrieves the computed default filter for the given snippet.
   * This might not match the currently set filter.
   * @param {string} name Snippet Name
   */
  async getDefaultFilter(name) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet get defaultFilter', { name });
    return res;
  }

  /**
   * Returns parameter indices for the highest impact params
   * @param {string} name Snippet name
   * @param {number[]} x0 Initial parameter vector state
   * @param {Object} args Additional arguments to send to the server
   * @param {?number} args.magnitudeThreshold Minimum proportion of max magnitude to count as impactful
   */
  async identifyHighImpactParams(name, x0, args) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet identifyHighImpact', {
      name,
      x0,
      args
    });
    return res;
  }

  /**
   * Returns parameter indices for the highest scoring params
   * @param {string} name Snippet name
   * @param {number[]} x0 Initial parameter vector state
   * @param {Object} args Additional arguments to send to the server
   * @param {?number} args.bestThreshold Minimum proportion of maximal score to be considered "best"
   */
  async identifyBestParams(name, x0, args) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet identifyBest', {
      name,
      x0,
      args
    });
    return res;
  }

  /**
   * Generic property setter for snippets
   * @param {string} name Snippet name
   * @param {string} propName property name
   * @param {number|string} val property value
   */
  async setProp(name, propName, val) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet setProp', { name, propName, val });
    return res;
  }

  /**
   * Generic property accessor for snippets
   * @param {string} name snippet name
   * @param {string} propName property name
   */
  async getProp(name, propName) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const res = await this.exec('snippet getProp', { name, propName });
    return res;
  }

  /**
   * Loads the GPR from saved data.
   * @param {string} name Snippet name
   * @param {Object[]} trainData Training data points, {x, y}
   * @param {Object} state Should have the same contents as the state field returned from the GPR training process
   * @see train
   */
  async loadGPR(name, trainData, state, filter = null) {
    if (typeof name !== 'string') throw new Error('Missing Snippet Name');

    const args = { name, trainData, state };
    if (filter) args.filter = filter;

    const res = await this.exec('snippet load gpr', args);
    return res;
  }

  /**
   * Mixes parameter values randomly between the two vectors
   * @param {number[]} a
   * @param {number[]} b
   * @param {number} count
   */
  async mix(a, b, count, args) {
    // might need a snippet name at some point

    const res = await this.exec('mix', { a, b, count, args });
    return res;
  }

  /**
   * Combines multiple snippets together. The parameter signature will change constantly while testing.
   * See mixSnippets() in core/mixer.py
   * @param {string[]} snippetNames List of snippet identifiers, assumes all have been trained already
   * @param {Object} params
   */
  async mixSnippets(snippetNames, params) {
    const res = await this.exec('mix snippet', {
      snippets: snippetNames,
      params
    });
    return res;
  }

  async jitter(x0, delta, snippet = null, opt = {}) {
    const args = {
      x0,
      delta,
      opt
    };

    if (snippet) {
      args.snippet = snippet;
    }

    const res = await this.exec('jitter', args);
    return res;
  }

  /**
   * Stop the sampler
   */
  async stopSampler() {
    const res = await this.exec('stop sampler');
    return res;
  }

  /**
   * @return {boolean} True if the sampler is running, false otherwise
   */
  async samplerRunning() {
    const res = await this.exec('sampler running');
    return res;
  }

  /**
   * Deletes all snippets from the server, resets running conditions to as-launched
   */
  async reset() {
    await this.exec('reset');
    console.log('Server reset performed');
  }
}

export default DsDriver;
