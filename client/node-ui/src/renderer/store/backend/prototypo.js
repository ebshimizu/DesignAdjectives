import Settings from 'electron-settings';
import path from 'path';
import fs from 'fs-extra';

// not sure if pytypo is available here?
let params = [];
// eslint-disable-next-line no-unused-vars
let Ptypo, prototypoFontFactory;

let template = null;
let fontIndex = {};

const ptypoSettings = {};

function getParams() {
  return [
    {
      id: 0,
      name: 'xHeight',
      min: 300,
      max: 900,
      value: 500,
      links: []
    },
    {
      id: 1,
      name: 'capDelta',
      min: 100,
      max: 400,
      value: 100,
      links: []
    },
    {
      id: 2,
      name: 'ascender',
      min: 150,
      max: 500,
      value: 250,
      links: []
    },
    {
      id: 3,
      name: 'descender',
      min: -500,
      max: -150,
      value: -250,
      links: []
    },
    {
      id: 4,
      name: 'crossbar',
      min: 0.6,
      max: 1.3,
      value: 1.0,
      links: []
    },
    {
      id: 5,
      name: 'width',
      min: 0.5,
      max: 2,
      value: 1,
      links: []
    },
    { id: 6, name: 'slant', min: -5, max: 12, value: 0, links: [] },
    { id: 7, name: 'thickness', min: 50, max: 160, value: 70, links: [] },
    { id: 8, name: 'aperture', min: 0.5, max: 1.6, value: 1, links: [] },
    { id: 9, name: 'curviness', min: 0.4, max: 1.0, value: 0.5, links: [] },
    { id: 10, name: 'serifWidth', min: 1, max: 90, value: 1, links: [] },
    { id: 11, name: 'serifHeight', min: 0, max: 70, value: 0, links: [] },
    { id: 12, name: 'minWidth', min: 0.5, max: 1.2, value: 0.8, links: [] },
    { id: 13, name: 'serifMedian', min: 0.2, max: 1.3, value: 0.5, links: [] },
    { id: 14, name: 'serifCurve', min: 0, max: 100, value: 0, links: [] },
    { id: 15, name: 'serifRoundness', min: 0, max: 1.8, value: 0, links: [] },
    { id: 16, name: 'serifArc', min: 0, max: 0.1, value: 0, links: [] },
    { id: 17, name: 'serifTerminal', min: 0, max: 0.7, value: 0, links: [] },
    {
      id: 18,
      name: 'serifTerminalCurve',
      min: 0,
      max: 1.5,
      value: 0,
      links: []
    }
  ];
}

function changeParams(identifier, state) {
  let paramObj = {};

  for (let i = 0; i < state.length; i++) {
    paramObj[params[i].name] = state[i];
  }

  fontIndex[identifier].changeParams(paramObj);
}

export default {
  type() {
    return 'Prototypo';
  },
  loadNew(config) {
    if (!Ptypo) {
      Ptypo = config.window.Ptypo;
      // eslint-disable-next-line new-cap
      prototypoFontFactory = new Ptypo.default(); // process.env.PTYPO_API_KEY);
    }

    // load backend settings
    const loadedSettings = Settings.get('ptypoBackendSettings');
    if (loadedSettings) {
      for (const key in loadedSettings) {
        if (key in ptypoSettings) {
          ptypoSettings[key].value = loadedSettings[key].value;
        }
      }
    }

    params = getParams();

    // should load the template from the file
    const file = path.join(config.dir, config.filename);
    const loadedData = JSON.parse(fs.readFileSync(file));
    template = loadedData.template;

    // no params for dev stage yet
    fontIndex = {};
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
  async renderer(canvasTarget, textTarget, settings) {
    // create a font if not exists
    if (!(settings.identifier in fontIndex)) {
      fontIndex[settings.instanceID] = await prototypoFontFactory.createFont(
        settings.instanceID,
        template
      );
    }

    const state =
      'state' in settings && settings.state.length > 0
        ? settings.state
        : params.map(p => p.value);

    // change the params
    changeParams(settings.instanceID, state);
  },
  getSettings() {
    return ptypoSettings;
  },
  setSetting(key, value) {
    ptypoSettings[key].value = value;
    Settings.set('ptypoBackendSettings', ptypoSettings);
  }
};
