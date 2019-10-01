/* eslint-disable new-cap */
// eslint-disable-next-line no-unused-vars
var particles, window;
let params = [];

function findSameCanvas(target) {
  for (const pjs of window.pJSDom) {
    if (pjs.pJS.canvas.el.isSameNode(target)) {
      return pjs;
    }
  }

  return null;
}

export default {
  type() {
    return 'Particles.js';
  },
  loadNew(config) {
    if (!window) {
      window = config.window;
      particles = require('particles.js');
    }

    // there isn't much to do here? we can have some particle presets
    // need to get the params, while working on rendering setup will be no params
    params = [];
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
    const pjs = findSameCanvas(canvasTarget);
    if (pjs) {
      // modify settings
    } else {
      // create new, should render to specified target
      window.particlesJSWithCanvas(canvasTarget, {});
    }
  },
  getSettings() {
    return {};
  },
  setSetting(key, value) {
    // noop
  }
};
