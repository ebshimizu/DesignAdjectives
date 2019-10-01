/* eslint-disable new-cap */
const rgbHex = require('rgb-hex');

// eslint-disable-next-line no-unused-vars
var particles, window;
let params = [];

const shapes = ['circle', 'edge', 'triangle', 'polygon', 'star'];

// returns the default param set
// at some point this might be transferred to an external json file
function getParamSet() {
  const rawParams = [
    { name: 'number.value', value: 0.2, links: [] },
    { name: 'color.r', value: 1, links: [1, 2] },
    { name: 'color.g', value: 1, links: [-1, 1] },
    { name: 'color.b', value: 1, links: [-1, -2] },
    { name: 'shape.type', value: 0, links: [] },
    { name: 'shape.stroke.width', value: 0, links: [] },
    {
      name: 'shape.stroke.color.r',
      value: 0,
      links: [1, 2]
    },
    {
      name: 'shape.stroke.color.g',
      value: 0,
      links: [-1, 1]
    },
    {
      name: 'shape.stroke.color.b',
      value: 0,
      links: [-1, -2]
    },
    {
      name: 'shape.polygon.nb_sides',
      value: 0.5,
      links: []
    },
    { name: 'opacity.value', value: 0.75, links: [] },
    { name: 'opacity.random', value: 0, links: [] },
    { name: 'number.density.value_area', value: 0.5, links: [] }
  ];

  // additional processing
  for (let i = 0; i < rawParams.length; i++) {
    rawParams[i].id = i;
    rawParams[i].min = 0;
    rawParams[i].max = 1;

    for (let l = 0; l < rawParams[i].links.length; l++) {
      rawParams[i].links[l] = i + rawParams[i].links[l];
    }
  }

  return rawParams;
}

function paramsToPjs(state) {
  // number.value
  return {
    particles: {
      number: {
        value: state[0] * 500,
        density: {
          value_area: 100 + state[12] * 1400
        }
      },
      color: {
        value: {
          r: 255 * state[1],
          g: 255 * state[2],
          b: 255 * state[3]
        }
      },
      shape: {
        type: shapes[Math.max(0, Math.floor(state[4] * 5 - 1e-6))],
        stroke: {
          width: state[5] * 10,
          color: `#${rgbHex(state[6] * 255, state[7] * 255, state[8] * 255)}`
        },
        polygon: {
          nb_sides: Math.floor(state[9] * 10)
        }
      },
      opacity: {
        value: state[10],
        random: state[11] >= 0.5
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

function prunePJSDom() {
  const toRemove = [];
  for (let i = 0; i < window.pJSDom.length; i++) {
    if (!window.document.body.contains(window.pJSDom[i].pJS.canvas.el)) {
      delete window.pJSDom[i];
      toRemove.push(i);
    }
  }

  window.pJSDom = window.pJSDom.filter((_, i) => !toRemove.includes(i));
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

    prunePJSDom();
  },
  getSettings() {
    return {};
  },
  setSetting(key, value) {
    // noop
  }
};
