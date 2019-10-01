/* eslint-disable new-cap */
// eslint-disable-next-line no-unused-vars
var particles, window;
let params = [];

const shapes = [
  'circle',
  'edge',
  'triangle',
  'polygon',
  'star'
];

// returns the default param set
// at some point this might be transferred to an external json file
function getParamSet() {
  return [
    { name: 'number.value', value: 0.2, min: 0, max: 1, id: 0, links: [] },
    { name: 'color.r', value: 1, min: 0, max: 1, id: 1, links: [2, 3] },
    { name: 'color.g', value: 1, min: 0, max: 1, id: 2, links: [1, 3] },
    { name: 'color.b', value: 1, min: 0, max: 1, id: 3, links: [1, 2] },
    { name: 'shape.type', value: 0, min: 0, max: 1, id: 4, links: []}
  ];
}

function paramsToPjs(state) {
  // number.value
  return {
    particles: {
      number: {
        value: state[0] * 500
      },
      color: {
        value: {
          r: 255 * state[1],
          g: 255 * state[2],
          b: 255 * state[3]
        }
      },
      shape: {
        type: shapes[Math.max(0, Math.floor(state[4] * 5 - 1e-6))]
      }
    }
  };
}

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
    params = getParamSet();
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
    const state =
      'state' in settings && settings.state.length > 0
        ? settings.state
        : params.map(p => p.value);

    const particleParams = paramsToPjs(state);

    // going to try to directly give particles.js a canvas element
    // don't want to double init so this backend will track which elements
    // have been seen before
    const pjs = findSameCanvas(canvasTarget);
    if (pjs) {
      // modify settings
      Object.deepExtend(pjs.pJS, particleParams);
      pjs.pJS.fn.particlesRefresh();
    } else {
      // create new, should render to specified target
      window.particlesJSWithCanvas(canvasTarget, particleParams);
    }
  },
  getSettings() {
    return {};
  },
  setSetting(key, value) {
    // noop
  }
};
