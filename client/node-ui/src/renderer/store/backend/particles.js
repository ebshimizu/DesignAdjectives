/* eslint-disable new-cap */
const rgbHex = require('rgb-hex');

// eslint-disable-next-line no-unused-vars
var particles, window;
let params = [];

const shapes = ['circle', 'edge', 'triangle', 'polygon', 'star'];
const moveDir = [
  'none',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
  'top-left'
];
const hoverMode = ['grab', 'bubble', 'repulse'];
const clickMode = ['push', 'remove', 'bubble', 'repulse'];

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
    { name: 'number.density.value_area', value: 0.5, links: [] },
    { name: 'opacity.value', value: 0.75, links: [] },
    { name: 'opacity.random', value: 0, links: [] },
    { name: 'opacity.anim.enable', value: 0, links: [] },
    { name: 'opacity.anim.speed', value: 0.3, links: [] },
    { name: 'opacity.anim.opacity_min', value: 0.25, links: [] },
    { name: 'opacity.anim.sync', value: 0, links: [] },
    { name: 'size.value', value: 0.5, links: [] },
    { name: 'size.random', value: 0, links: [] },
    { name: 'size.anim.enable', value: 0, links: [] },
    { name: 'size.anim.speed', value: 0.3, links: [] },
    { name: 'size.anim.size_min', value: 0.25, links: [] },
    { name: 'size.anim.sync', value: 0, links: [] },
    { name: 'line_linked.enable', value: 0, links: [] },
    { name: 'line_linked.distance', value: 0.5, links: [] },
    { name: 'line_linked.color.r', value: 1, links: [1, 2] },
    { name: 'line_linked.color.g', value: 1, links: [-1, 1] },
    { name: 'line_linked.color.b', value: 1, links: [-1, -2] },
    { name: 'line_linked.opacity', value: 0.5, links: [] },
    { name: 'line_linked.width', value: 0.15, links: [] },
    { name: 'move.enable', value: 1, links: [] },
    { name: 'move.speed', value: 0.4, links: [] },
    { name: 'move.direction', value: 0, links: [] },
    { name: 'move.random', value: 1, links: [] },
    { name: 'move.straight', value: 0, links: [] },
    { name: 'move.out_mode', value: 0, links: [] },
    { name: 'move.attract.enable', value: 0, links: [] },
    { name: 'move.attract.rotateX', value: 0.5, links: [] },
    { name: 'move.attract.rotateY', value: 0.25, links: [] },
    { name: 'interactivity.events.onhover.enable', value: 0, links: [] },
    { name: 'interactivity.events.onhover.mode', value: 0, links: [] },
    { name: 'interactivity.events.onclick.enable', value: 0, links: [] },
    { name: 'interactivity.events.onclick.mode', value: 0, links: [] },
    { name: 'interactivity.events.modes.grab.distance', value: 0.2, links: [] },
    {
      name: 'interactivity.events.modes.grab.link_linked.opacity',
      value: 0.75,
      links: []
    },
    {
      name: 'interactivity.events.modes.bubble.distance',
      value: 100,
      min: 0,
      max: 500,
      links: []
    },
    {
      name: 'interactivity.events.modes.bubble.duration',
      value: 0.4,
      min: 0,
      max: 2,
      links: []
    },
    {
      name: 'interactivity.events.modes.repulse.distance',
      value: 200,
      min: 0,
      max: 500,
      links: []
    },
    {
      name: 'interactivity.events.modes.repulse.duration',
      value: 1.2,
      min: 0,
      max: 2,
      links: []
    },
    {
      name: 'interactivity.events.modes.push.particles_nb',
      value: 4,
      min: 0,
      max: 10,
      links: []
    }
  ];

  // additional processing
  for (let i = 0; i < rawParams.length; i++) {
    rawParams[i].id = i;
    if (!('min' in rawParams[i])) {
      rawParams[i].min = 0;
      rawParams[i].max = 1;
    }

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
          value_area: 100 + state[10] * 1400
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
        value: state[11],
        random: state[12] >= 0.5,
        anim: {
          enable: state[13] >= 0.5,
          speed: state[14] * 10,
          opacity_min: state[15],
          sync: state[16] >= 0.5
        }
      },
      size: {
        value: state[17] * 40,
        random: state[18] >= 0.5,
        anim: {
          enable: state[19] >= 0.5,
          speed: state[20] * 30,
          size_min: state[21] * 40,
          sync: state[22] >= 0.5
        }
      },
      line_linked: {
        enable: state[23] >= 0.5,
        distance: state[24] * 300,
        color: `#${rgbHex(state[25] * 255, state[26] * 255, state[27] * 255)}`,
        opacity: state[28],
        width: state[29] * 10
      },
      move: {
        enable: state[30] >= 0.5,
        speed: state[31] * 10,
        direction:
          moveDir[Math.max(0, Math.floor(state[32] * moveDir.length - 1e-6))],
        random: state[33] >= 0.5,
        straight: state[34] >= 0.5,
        out_mode: state[35] >= 0.5 ? 'bounce' : 'out',
        bounce: false, // need to disable, calls exceed call stack
        attract: {
          enable: state[36] >= 0.5,
          rotateX: state[37] * 6000,
          rotateY: state[38] * 6000
        }
      }
    },
    interactivity: {
      events: {
        onhover: {
          enable: state[39] >= 0.5,
          mode:
            hoverMode[
              Math.max(0, Math.floor(state[40] * hoverMode.length - 1e-6))
            ]
        },
        onclick: {
          enable: state[41] >= 0.5,
          mode:
            clickMode[
              Math.max(0, Math.floor(state[42] * clickMode.length - 1e-6))
            ]
        }
      },
      modes: {
        grab: {
          distance: state[43] * 500,
          line_linked: {
            opacity: state[44]
          }
        },
        bubble: {
          distance: state[45],
          duration: state[46]
        },
        repulse: {
          distance: state[47],
          duration: state[48]
        },
        push: {
          particles_nb: state[49]
        }
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
      pjs.pJS.fn.updateParams(particleParams);
      // Object.deepExtend(pjs.pJS, particleParams);
      // pjs.pJS.fn.particlesRefresh();
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
