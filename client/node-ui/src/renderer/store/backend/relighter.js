import Settings from 'electron-settings';
const relighter = require('simple-relighter');
const path = require('path');

let rl = new relighter.Relighter();
let params = [];

const relightSettings = {
  gamma: {
    type: 'number',
    value: 1,
    name: 'Gamma',
    min: 0,
    max: 5,
    step: 0.01
  },
  level: {
    name: 'Level',
    type: 'number',
    value: 1,
    min: 0,
    max: 20,
    step: 0.01
  }
};

function renderPromise(params, gamma, level) {
  return new Promise((resolve, reject) => {
    rl.renderAsync(params, gamma, level, function(err, buffer) {
      if (err) reject(new Error('Render Failure'));

      resolve(buffer);
    });
  });
}

export default {
  type() {
    return 'Simple Relighter';
  },
  loadNew(config) {
    rl.load(path.join(config.dir));

    // load backend settings
    const loadedSettings = Settings.get('relightBackendSettings');
    if (loadedSettings) {
      for (const key in loadedSettings) {
        if (key in relightSettings) {
          relightSettings[key].value = loadedSettings[key].value;
        }
      }
    }

    // initial param assignment
    const rawParams = rl.paramKey;
    params = [];

    // todo: link parents
    for (const p of rawParams) {
      params.push({
        name: p.name,
        value: p.default,
        type: 'number',
        min: 0,
        max: 1,
        id: params.length,
        links: []
      });
    }
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
    const state =
      'state' in settings && settings.state.length > 0
        ? settings.state
        : params.map(p => p.value);

    canvasTarget.width = rl.width;
    canvasTarget.height = rl.height;

    // rl.renderToCanvas(
    //   state,
    //   imDat,
    //   relightSettings.gamma.value,
    //   relightSettings.level.value
    // );
    const buffer = await renderPromise(
      state,
      relightSettings.gamma.value,
      relightSettings.level.value
    );

    var ctx = canvasTarget.getContext('2d');
    ctx.clearRect(0, 0, canvasTarget.width, canvasTarget.height);
    var imDat = ctx.getImageData(0, 0, canvasTarget.width, canvasTarget.height);
    rl.transferToContext(buffer, imDat);

    createImageBitmap(imDat).then(function(imbit) {
      ctx.drawImage(imbit, 0, 0, canvasTarget.width, canvasTarget.height);
    });
  },
  getSettings() {
    return relightSettings;
  },
  setSetting(key, value) {
    relightSettings[key].value = value;

    Settings.set('relightBackendSettings', relightSettings);
  }
};
