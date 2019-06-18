import { DsDriver } from '../driver/dsNodeDriver';
import * as Constants from '../constants';
import Vue from 'Vue';
import fs from 'fs-extra';
import settings from 'electron-settings';

// main app should not be allowed to access the driver object directly,
// would be able to invoke things outside of mutations/actions
let driver = null;

// normalize a single vector
function normalizeVector(x, key) {
  // key has min/max data for each element
  return x.map((value, i) => {
    const k = key[i];
    return (value - k.min) / (k.max - k.min);
  });
}

// normalize a vector of data objects.
// objects are { x, y } format
function normalizeData(data, key) {
  return data.map(d => {
    return { x: normalizeVector(d.x, key), y: d.y };
  });
}

function unnormalizeVector(x, key) {
  return x.map((value, i) => {
    const k = key[i];
    return value * (k.max - k.min) + k.min;
  });
}

// takes the sample's vector and normalizes it
function unnormalizeSample(sample, key) {
  sample.x = unnormalizeVector(sample.x, key);
}

// this state maintains a list of snippet objects and sync's to the server as needed.
// data format is same as server
// snippet.data format: [{ x: vec, y: val }]
// vectors are saved locally in unnormalized formats, sent to server normalized to [0,1]
export default {
  state: {
    port: 5234,
    settings: {
      paramColor: {
        value: Constants.PARAM_COLOR_MODE.REDGREEN,
        type: 'enum',
        name: 'Parameter Preference Function Colors',
        values: [
          Constants.PARAM_COLOR_MODE.REDGREEN,
          Constants.PARAM_COLOR_MODE.BLUEYELLOW,
          Constants.PARAM_COLOR_MODE.BLUEGREEN,
          Constants.PARAM_COLOR_MODE.REDBLUE,
          Constants.PARAM_COLOR_MODE.GREYSCALE
        ]
      },
      optSteps: {
        value: 200,
        type: 'number',
        name: 'Optimization Steps',
        min: 0,
        max: 2000,
        step: 1
      }
    },
    snippets: {},
    activeSnippet: {},
    activeSnippetScore: { mean: 0, cov: 0 },
    log: [],
    connected: false,
    serverOnline: false,
    cacheKey: '',
    serverStatus: {
      action: 'IDLE',
      message: ''
    },
    paramData: {},
    samples: []
  },
  getters: {
    ready: state => {
      return state.connected && state.serverOnline;
    },
    currentParamState: state => {
      return driver.getCurrentState();
    },
    training: state => {
      return state.serverStatus.action === 'TRAIN';
    },
    sampling: state => {
      return state.serverStatus.action === 'SAMPLE';
    },
    status: state => {
      return state.serverStatus.action;
    },
    activeSnippetName: state => {
      if (state.activeSnippet.name) return state.activeSnippet.name;

      return null;
    },
    paramData: state => {
      return state.paramData;
    },
    hueMin: state => {
      if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.REDGREEN
      ) {
        return 0;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.BLUEGREEN
      ) {
        return 240;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.REDBLUE
      ) {
        return 360;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.GREYSCALE
      ) {
        return 0;
      } else if (
        state.settings.paramColor.value ===
        Constants.PARAM_COLOR_MODE.BLUEYELLOW
      ) {
        return { r: 0, g: 0, b: 255 };
      }

      return 0;
    },
    hueMax: state => {
      if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.REDGREEN
      ) {
        return 120;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.BLUEGREEN
      ) {
        return 120;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.REDBLUE
      ) {
        return 240;
      } else if (
        state.settings.paramColor.value === Constants.PARAM_COLOR_MODE.GREYSCALE
      ) {
        return 0;
      } else if (
        state.settings.paramColor.value ===
        Constants.PARAM_COLOR_MODE.BLUEYELLOW
      ) {
        return { r: 255, g: 255, b: 0 };
      }

      return 120;
    },
    snippetSettings: state => {
      return state.settings;
    },
    maxCurrentSnippetScore: state => {
      if ('meanMax' in state.paramData) {
        return state.paramData.meanMax;
      }

      return 0;
    },
    currentSnippetScore: state => {
      return state.activeSnippetScore.mean;
    },
    currentLosses: state => {
      if (state.activeSnippet.trained)
        return state.activeSnippet.trainData.losses;
      else return [];
    }
  },
  mutations: {
    [Constants.MUTATION.SET_PORT](state, port) {
      state.port = port;
    },
    [Constants.MUTATION.CONNECT](state) {
      if (driver) {
        driver.connectCallback = null;
        driver.disconnect();
        state.connected = false;
        state.serverOnline = false;
      }

      driver = new DsDriver(state.port);

      // register callbacks here? unsure where async things happen
      // async stuff might happen in an action? like call a sampling function
      // which then registers a callback with the driver that commits new samples to the state
    },
    [Constants.MUTATION.DISCONNECT](state) {
      if (driver) {
        driver.disconnect();
        state.connected = false;
        state.serverOnline = false;
        state.serverStatus.action = 'IDLE';
      }
    },
    [Constants.MUTATION.STATUS_UPDATE](state, status) {
      state.connected = status.connected;
      state.serverOnline = status.serverOnline;
    },
    [Constants.MUTATION.NEW_SNIPPET](state, name) {
      if (!(name in state.snippets)) {
        Vue.set(state.snippets, name, {});
        Vue.set(state.snippets[name], 'name', name);
        Vue.set(state.snippets[name], 'data', []);
        Vue.set(state.snippets[name], 'trainData', {});
        Vue.set(state.snippets[name], 'trained', false);
      }
    },
    [Constants.MUTATION.COPY_SNIPPET](state, data) {
      if (!(data.copyTo in state.snippets) && data.active in state.snippets) {
        Vue.set(state.snippets, data.copyTo, {});
        Vue.set(state.snippets[data.copyTo], 'name', data.copyTo);
        Vue.set(state.snippets[data.copyTo], 'data', [
          ...state.snippets[data.active].data
        ]);

        // copied snippets will need to re-train (it's assumed you will modify the copy)
        Vue.set(state.snippets[data.copyTo], 'trainData', {});
        Vue.set(state.snippets[data.copyTo], 'trained', false);
      }
    },
    [Constants.MUTATION.RENAME_SNIPPET](state, data) {
      if (!(data.renameTo in state.snippets)) {
        // move the reference
        Vue.set(state.snippets, data.renameTo, state.snippets[data.active]);
        Vue.set(state.snippets[data.renameTo], 'name', data.renameTo);
        Vue.delete(state.snippets, data.active);
      }
    },
    [Constants.MUTATION.DELETE_SNIPPET](state, name) {
      Vue.delete(state.snippets, name);
    },
    [Constants.MUTATION.ADD_EXAMPLE](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.push(data.point);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    [Constants.MUTATION.DELETE_EXAMPLE](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.splice(data.index, 1);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    [Constants.MUTATION.ADD_TRAINED_DATA](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].trainData = data.trainData;
        state.snippets[data.name].trained = true;
      }
    },
    [Constants.MUTATION.SET_ACTIVE_SNIPPET](state, id) {
      if (id in state.snippets)
        state.activeSnippet = Object.assign({}, state.snippets[id]);
      else state.activeSnippet = {};
    },
    [Constants.MUTATION.UPDATE_ACTIVE_SNIPPET](state) {
      if (state.activeSnippet.name in state.snippets)
        state.activeSnippet = Object.assign(
          {},
          state.snippets[state.activeSnippet.name]
        );
      else state.activeSnippet = {};
    },
    [Constants.MUTATION.CLEAR_SAMPLES](state) {
      state.samples = [];
    },
    [Constants.MUTATION.ADD_SAMPLE](state, sample) {
      state.samples.push(sample);
    },
    [Constants.MUTATION.SET_SERVER_STATUS_IDLE](state) {
      state.serverStatus.action = 'IDLE';
      state.serverStatus.message = '';
    },
    [Constants.MUTATION.SET_SERVER_STATUS_TRAIN](state, name) {
      state.serverStatus.action = 'TRAIN';
      state.serverStatus.message = `Training ${name}`;
    },
    [Constants.MUTATION.SET_SERVER_STATUS_SAMPLE](state, name) {
      state.serverStatus.action = 'SAMPLE';
      state.serverStatus.message = `Sampling ${name}`;
    },
    [Constants.MUTATION.EXPORT_SNIPPETS](state, file) {
      const data = JSON.stringify(state.snippets, undefined, 2);
      try {
        fs.writeFileSync(file, data);
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.MUTATION.CACHE_SNIPPETS](state, key) {
      settings.set(key, state.snippets);
    },
    [Constants.MUTATION.LOAD_SNIPPETS](state, key) {
      state.cacheKey = key;

      if (settings.has(key)) state.snippets = settings.get(key);
      else state.snippets = {};
    },
    [Constants.MUTATION.IMPORT_SNIPPETS](state, file) {
      try {
        if (fs.existsSync(file)) {
          const data = fs.readFileSync(file);
          state.snippets = JSON.parse(data);
        }
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.MUTATION.SET_ACTIVE_SNIPPET_SCORE](state, score) {
      state.activeSnippetScore = score;
    },
    [Constants.MUTATION.SET_PARAM_COLOR_DATA](state, data) {
      if (!data) {
        state.paramData = {
          meanMax: 1,
          meanMin: -1
        };
        return;
      }

      // may want to perform some analysis to determine min/max ranges for the params
      let meanMin = 1e10;
      let meanMax = -1e10;

      for (const paramId in data) {
        for (let mean of data[paramId].mean) {
          if (mean > meanMax) meanMax = mean;
          if (mean < meanMin) meanMin = mean;
        }
      }

      data.meanMin = meanMin;
      data.meanMax = meanMax;
      state.paramData = data;
    },
    [Constants.MUTATION.SET_SNIPPET_SETTING](state, data) {
      state.settings[data.key].value = data.value;
      settings.set('snippetSettings', state.settings);
    },
    [Constants.MUTATION.LOAD_SNIPPET_SETTINGS](state) {
      const loadedSettings = settings.get('snippetSettings');
      for (const key in loadedSettings) {
        if (key in state.settings) {
          state.settings[key].value = loadedSettings[key].value;
        }
      }
    },
    [Constants.MUTATION.CLEAR_CACHE](state) {
      // deletes the cached training data for all snippets
      for (const key in state.snippets) {
        delete state.snippets[key].trainData;
        state.snippets[key].trained = false;
      }
      settings.set(state.cacheKey, state.snippets);
    }
  },
  actions: {
    [Constants.ACTION.NEW_SNIPPET](context, data) {
      try {
        context.commit(Constants.MUTATION.NEW_SNIPPET, data.name);
        // await driver.addSnippet(data.name);
        context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET, data.name);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.ACTION.COPY_SNIPPET](context, data) {
      try {
        context.commit(Constants.MUTATION.COPY_SNIPPET, data);
        context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET, data.copyTo);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.ACTION.RENAME_SNIPPET](context, data) {
      try {
        context.commit(Constants.MUTATION.RENAME_SNIPPET, data);
        context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET, data.renameTo);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.ACTION.DELETE_SNIPPET](context, data) {
      try {
        context.commit(Constants.MUTATION.DELETE_SNIPPET, data.name);
        context.commit(Constants.MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
        // await driver.deleteSnippet(data.name);
      } catch (e) {
        console.log(e);
      }
    },
    async [Constants.ACTION.TRAIN](context, name) {
      try {
        context.commit(Constants.MUTATION.SET_SERVER_STATUS_TRAIN, name);

        // ensure snippet exists
        await driver.addSnippet(name);
        await driver.setProp(
          name,
          'optSteps',
          context.state.settings.optSteps.value
        );

        // sync data
        await driver.setData(
          name,
          normalizeData(
            context.state.snippets[name].data,
            context.getters.params
          )
        );

        // train
        const trainData = await driver.train(name);
        context.commit(Constants.MUTATION.ADD_TRAINED_DATA, {
          name,
          trainData
        });
        context.commit(Constants.MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );

        // load parameter color data
        await context.dispatch(Constants.ACTION.LOAD_PARAM_COLOR_DATA, name);
      } catch (e) {
        console.log(e);
      }

      context.commit(Constants.MUTATION.SET_SERVER_STATUS_IDLE, name);
    },
    async [Constants.ACTION.LOAD_SNIPPET](context, name) {
      // loads the existing train data into the server
      try {
        context.commit(Constants.MUTATION.SET_SERVER_STATUS_TRAIN, name);

        // ensure exists
        await driver.addSnippet(name);

        // load gpr data
        await driver.loadGPR(
          name,
          normalizeData(
            context.state.snippets[name].data,
            context.getters.params
          ),
          context.state.snippets[name].trainData.state
        );

        // done
      } catch (e) {
        console.log(e);
      }

      context.commit(Constants.MUTATION.SET_SERVER_STATUS_IDLE, name);
    },
    [Constants.ACTION.ADD_EXAMPLE](context, data) {
      try {
        context.commit(Constants.MUTATION.ADD_EXAMPLE, data);
        context.commit(Constants.MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
        // await driver.addData(data.name, data.point.x, data.point.y);
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.ACTION.DELETE_EXAMPLE](context, data) {
      try {
        context.commit(Constants.MUTATION.DELETE_EXAMPLE, data);
        context.commit(Constants.MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(
          Constants.MUTATION.CACHE_SNIPPETS,
          context.state.cacheKey
        );
        // await driver.removeData(data.name, data.index);
      } catch (e) {
        console.log(e);
      }
    },
    async [Constants.ACTION.SYNC](context) {
      // todo: yeh fill this in
    },
    async [Constants.ACTION.CONNECT](context) {
      context.commit(Constants.MUTATION.CONNECT);

      // bind status callbacks
      driver.connectCallback = function(connected, serverOnline) {
        context.commit(Constants.MUTATION.STATUS_UPDATE, {
          connected,
          serverOnline
        });
      };

      driver.sampleCallback = function(data, name) {
        unnormalizeSample(data, context.getters.params);
        context.commit(Constants.MUTATION.ADD_SAMPLE, data);
      };

      driver.sampleFinalCallback = function(data, name) {
        context.dispatch(Constants.ACTION.STOP_SAMPLER);
      };
      // reset the server state completely
      await driver.reset();

      // sync the current snippet state?
    },
    async [Constants.ACTION.START_SAMPLER](context, data) {
      try {
        context.commit(Constants.MUTATION.SET_SERVER_STATUS_SAMPLE);
        context.commit(Constants.MUTATION.CLEAR_SAMPLES);

        // get the current normalized vector starting state
        const current = context.getters.paramsAsArray;
        data.data.x0 = normalizeVector(current, context.getters.params);

        await driver.sample(data.name, data.data);
      } catch (e) {
        console.log(e);
      }
    },
    async [Constants.ACTION.STOP_SAMPLER](context) {
      try {
        await driver.stopSampler();
        context.commit(Constants.MUTATION.SET_SERVER_STATUS_IDLE);
      } catch (e) {
        console.log(e);
      }
    },
    [Constants.ACTION.DISCONNECT](context) {
      context.commit(Constants.MUTATION.DISCONNECT);
    },
    [Constants.ACTION.SET_ACTIVE_SNIPPET](context, data) {
      context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET, data);
      context.dispatch(Constants.ACTION.COMMIT_PARAMS);

      if (context.state.activeSnippet && context.state.activeSnippet.trained) {
        context.dispatch(Constants.ACTION.LOAD_PARAM_COLOR_DATA, data);
      }
    },
    [Constants.ACTION.LOAD_SNIPPETS](context, key) {
      // reset state during the load
      context.commit(Constants.MUTATION.LOAD_SNIPPETS, key);
      context.commit(Constants.MUTATION.UPDATE_ACTIVE_SNIPPET, key);
      context.commit(Constants.MUTATION.CLEAR_SAMPLES);

      // call load snippet on all trained snippets, assumes connected
      if (context.state.serverOnline) {
        for (const s of Object.keys(context.state.snippets)) {
          if (context.state.snippets[s].trained)
            context.dispatch(Constants.ACTION.LOAD_SNIPPET, s);
        }
      }
    },
    async [Constants.ACTION.EVAL_CURRENT](context, vec) {
      if (context.state.activeSnippet && context.state.activeSnippet.trained) {
        try {
          const score = await driver.predictOne(
            context.getters.activeSnippetName,
            normalizeVector(vec, context.getters.params)
          );
          context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET_SCORE, score);
        } catch (e) {
          console.log(e);
        }
      } else {
        context.commit(Constants.MUTATION.SET_ACTIVE_SNIPPET_SCORE, {
          mean: 0,
          cov: 0
        });
      }
    },
    async [Constants.ACTION.LOAD_PARAM_COLOR_DATA](context, snippet) {
      const current = context.getters.paramsAsArray;
      const paramData = await driver.predictAll1D(snippet, {
        x: normalizeVector(current, context.getters.params),
        rmin: 0,
        rmax: 1,
        n: 20
      });
      context.commit(Constants.MUTATION.SET_PARAM_COLOR_DATA, paramData);
    }
  }
};
