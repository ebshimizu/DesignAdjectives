const particles = require('particles.js');

let params = [];
let canvasIndex = {};

export default {
  type() {
    return 'Particles.js';
  },
  loadNew(config) {
    // there isn't much to do here? we can have some particle presets
    // need to get the params, while working on rendering setup will be no params
    params = [];
    canvasIndex = {};
    // load/format
  },
  getParams() {
    return params;
  },
  setParam(id, val, _) {
    params[id].value = val;
  },
  setAllParams(vec) {
    for (let i = 0; i < vec.length; i++) {
      params[i].value = vec[i];
    }
  },
  async renderer(canvasTarget, settings) {
    // grab state from settings when applicable
    // going to try to directly give particles.js a canvas element
    // don't want to double init so this backend will track which elements
    // have been seen before
  }
};
