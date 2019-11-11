import { DsDriver } from '../driver/dsNodeDriver';
import {
  MUTATION,
  ACTION,
  PARAM_COLOR_MODE,
  SERVER_STATUS,
  THRESHOLD_MODE,
  THRESHOLD_ACCEPT_MODE,
  AUTO_FILTER_MODE,
  PARAM_COLOR_RANGE
} from '../constants';
import Vue from 'Vue';
import fs from 'fs-extra';
import settings from 'electron-settings';

// main app should not be allowed to access the driver object directly,
// would be able to invoke things outside of mutations/actions
let driver = null;

// external counter, can't be accessed during runtime
let randIDStart = 0;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Shuffles array in place.
 * https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

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
    return { x: normalizeVector(d.x, key), y: d.y, affected: d.affected || [] };
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

function randomVector(x0, freeParamMin, selected) {
  // duplicate
  const x = x0.slice(0);
  const paramCount = Math.max(
    Math.floor(Math.random() * x0.length),
    freeParamMin
  );

  // select free params from
  const keys = selected.length === 0 ? [...x.keys()] : selected;
  shuffle(keys);

  for (let i = 0; i < paramCount; i++) {
    if (i >= keys.length) break;

    x[keys[i]] = Math.random();
  }

  return x;
}

// load function helper
async function loadSnippet(driver, context, name) {
  try {
    // ensure exists
    await driver.addSnippet(name);

    let filter = null;
    // load filter, if it exists
    if (context.state.snippets[name].filter.length > 0)
      filter = context.state.snippets[name].filter;

    // load gpr data
    await driver.loadGPR(
      name,
      normalizeData(context.state.snippets[name].data, context.getters.params),
      context.state.snippets[name].trainData.state,
      filter
    );
  } catch (e) {
    console.log(e);
  }
}

// snippet trainer helper
async function trainSnippet(driver, context, name) {
  try {
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
      normalizeData(context.state.snippets[name].data, context.getters.params)
    );

    // train
    const filter =
      context.state.snippets[name].filter &&
      context.state.snippets[name].filter.length > 0
        ? context.state.snippets[name].filter
        : null;

    const trainData = await driver.train(name, filter);
    context.commit(MUTATION.ADD_TRAINED_DATA, {
      name,
      trainData
    });
    // context.commit(MUTATION.UPDATE_ACTIVE_SNIPPET);
    context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
  } catch (e) {
    console.log(e);
  }
}

function computeThreshold(t, mode, max, current) {
  if (mode === THRESHOLD_MODE.ABSOLUTE) {
    return t;
  } else if (mode === THRESHOLD_MODE.MAX_REL) {
    return t * max;
  } else if (mode === THRESHOLD_MODE.CURRENT_REL) {
    return t * current + current;
  } else if (mode === THRESHOLD_MODE.CURRENT_ABS) {
    return t + current;
  }
}

/**
 * Returns a list of parameter ids that are below a lengthscale relevance threshold
 * @param {Object} snippet Snippet object, must be trained and contain the raw lengthscale
 * @param {Number} threshold Threshold above which the parameter is considered to be relevant
 * @returns {Number[]} Array of parameter IDs that are considered relevant
 */
function filterByImpact(snippet, threshold) {
  // ok first check that we have the right data
  if (snippet && snippet.trained) {
    const rawLs =
      snippet.trainData.state['covar_module.base_kernel.raw_lengthscale'][0];

    // Either we have a manual filter, or the snippet was trained with the default (returned by the
    // snippet server)
    const ids =
      snippet.filter && snippet.filter.length > 0
        ? snippet.filter
        : snippet.trainData.defaultFilter;

    // convert to lengthscale (softmax)
    const ls = rawLs.map(x => Math.log(1 + Math.exp(x)));

    // return indices greater than threshold
    return ids.filter((id, i) => ls[i] < threshold);
  } else {
    return [];
  }
}

// this state maintains a list of snippet objects and sync's to the server as needed.
// data format is same as server
// snippet.data format: [{ x: vec, y: val }]
// vectors are saved locally in unnormalized formats, sent to server normalized to [0,1]
export default {
  state: {
    settings: {
      host: {
        value: 'localhost',
        type: 'string',
        name: 'Server Host/IP'
      },
      port: {
        value: 5234,
        type: 'number',
        name: 'Server Port',
        min: 0,
        max: 1e6,
        step: 1
      },
      paramColor: {
        value: PARAM_COLOR_MODE.REDGREEN,
        type: 'enum',
        name: 'Parameter Preference Function Colors',
        values: [
          PARAM_COLOR_MODE.REDGREEN,
          PARAM_COLOR_MODE.BLUEYELLOW,
          PARAM_COLOR_MODE.BLUEGREEN,
          PARAM_COLOR_MODE.REDBLUE,
          PARAM_COLOR_MODE.GREYSCALE
        ]
      },
      paramColorRange: {
        value: PARAM_COLOR_RANGE.ABSOLUTE,
        type: 'enum',
        name: 'Preference Function Color Range',
        values: [PARAM_COLOR_RANGE.ABSOLUTE, PARAM_COLOR_RANGE.RELATIVE]
      },
      optSteps: {
        value: 200,
        type: 'number',
        name: 'Optimization Steps',
        min: 0,
        max: 2000,
        step: 1
      },
      mainFontSize: {
        type: 'string',
        value: '10vh',
        name: 'Main Area Font Size (CSS Prop)'
      },
      sampleFontSize: {
        type: 'string',
        value: '5vh',
        name: 'Sample/Exemplar Font Size (CSS Prop)'
      },
      fontPreviewPhrase: {
        type: 'string',
        value: 'HAMBURGEFONTSIV 123',
        name: 'Font Preview String'
      }
    },
    snippets: {},
    activatedSnippets: [],
    activeMixAxes: {},
    activeSnippetScore: { mean: 0, cov: 0 },
    log: [],
    connected: false,
    serverOnline: false,
    cacheKey: '',
    serverStatus: {
      action: SERVER_STATUS.IDLE,
      message: ''
    },
    primarySnippet: '',
    paramData: {},
    samples: [],
    mixA: [],
    mixB: [],
    mixResults: {},
    axisMixResults: {},
    samplerSettings: {
      n: 10,
      threshold: 0.7,
      freeParams: 3,
      paramFloor: 3,
      retries: 20,
      thresholdMode: THRESHOLD_MODE.ABSOLUTE,
      thresholdEvalMode: THRESHOLD_ACCEPT_MODE.GREATER,
      thresholdTarget: 0,
      scoreDelta: 0
    },
    autoFilterMode: AUTO_FILTER_MODE.NO_FILTER,
    paramSpreadBase: [],
    relevanceThreshold: 0.62,
    logPath: ''
  },
  getters: {
    ready: state => {
      return state.connected && state.serverOnline;
    },
    currentParamState: state => {
      return driver.getCurrentState();
    },
    training: state => {
      return state.serverStatus.action === SERVER_STATUS.TRAIN;
    },
    sampling: state => {
      return state.serverStatus.action === SERVER_STATUS.SAMPLE;
    },
    idle: state => {
      return state.serverStatus.action === SERVER_STATUS.IDLE;
    },
    status: state => {
      return state.serverStatus.action;
    },
    paramData: state => {
      return state.paramData;
    },
    hueMin: state => {
      if (state.settings.paramColor.value === PARAM_COLOR_MODE.REDGREEN) {
        return 0;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.BLUEGREEN
      ) {
        return 240;
      } else if (state.settings.paramColor.value === PARAM_COLOR_MODE.REDBLUE) {
        return 360;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.GREYSCALE
      ) {
        return 0;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.BLUEYELLOW
      ) {
        return { r: 0, g: 0, b: 255 };
      }

      return 0;
    },
    hueMax: state => {
      if (state.settings.paramColor.value === PARAM_COLOR_MODE.REDGREEN) {
        return 120;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.BLUEGREEN
      ) {
        return 120;
      } else if (state.settings.paramColor.value === PARAM_COLOR_MODE.REDBLUE) {
        return 240;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.GREYSCALE
      ) {
        return 0;
      } else if (
        state.settings.paramColor.value === PARAM_COLOR_MODE.BLUEYELLOW
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
      if (
        state.primarySnippet in state.snippets &&
        state.snippets[state.primarySnippet].trained
      )
        return state.snippets[state.primarySnippet].trainData.losses;
      else return [];
    },
    primarySnippet: state => {
      return state.primarySnippet;
    },
    primarySnippetObject: state => {
      if (state.primarySnippet in state.snippets)
        return state.snippets[state.primarySnippet];

      return {};
    },
    activatedSnippets: state => {
      return state.activatedSnippets;
    },
    canSample: state => snippetId => {
      return (
        state.connected &&
        state.serverOnline &&
        snippetId in state.snippets &&
        state.snippets[snippetId].trained
      );
    },
    paramSpreadBase: state => {
      return state.paramSpreadBase;
    },
    selectedSamples: state => {
      return state.samples.filter(sample => sample.selected);
    },
    selectedSampleIDs: state => {
      return state.samples
        .filter(sample => sample.selected)
        .map(sample => sample.idx);
    },
    relevanceThreshold: state => {
      return state.relevanceThreshold;
    }
  },
  mutations: {
    [MUTATION.SET_PORT](state, port) {
      state.settings.port.value = port;
    },
    [MUTATION.CONNECT](state) {
      if (driver) {
        driver.connectCallback = null;
        driver.disconnect();
        state.connected = false;
        state.serverOnline = false;
      }

      driver = new DsDriver(
        state.settings.host.value,
        state.settings.port.value
      );

      // register callbacks here? unsure where async things happen
      // async stuff might happen in an action? like call a sampling function
      // which then registers a callback with the driver that commits new samples to the state
    },
    [MUTATION.DISCONNECT](state) {
      if (driver) {
        driver.disconnect();
        state.connected = false;
        state.serverOnline = false;
        state.serverStatus.action = SERVER_STATUS.IDLE;
      }
    },
    [MUTATION.STATUS_UPDATE](state, status) {
      state.connected = status.connected;
      state.serverOnline = status.serverOnline;
    },
    [MUTATION.NEW_SNIPPET](state, name) {
      if (!(name in state.snippets)) {
        const newSnippets = Object.assign({}, state.snippets);
        newSnippets[name] = {
          name: name,
          data: [],
          trainData: {},
          trained: false,
          filter: []
        };
        state.snippets = newSnippets;
      }
    },
    [MUTATION.COPY_SNIPPET](state, data) {
      if (!(data.copyTo in state.snippets) && data.active in state.snippets) {
        Vue.set(state.snippets, data.copyTo, {});
        Vue.set(state.snippets[data.copyTo], 'name', data.copyTo);
        Vue.set(state.snippets[data.copyTo], 'data', [
          ...state.snippets[data.active].data
        ]);

        // copied snippets will need to re-train (it's assumed you will modify the copy)
        Vue.set(state.snippets[data.copyTo], 'trainData', {});
        Vue.set(state.snippets[data.copyTo], 'trained', false);
        Vue.set(
          state.snippets[data.copyTo],
          'filter',
          state.snippets[data.active].filter
        );
      }
    },
    [MUTATION.RENAME_SNIPPET](state, data) {
      if (!(data.renameTo in state.snippets)) {
        // move the reference
        Vue.set(state.snippets, data.renameTo, state.snippets[data.active]);
        Vue.set(state.snippets[data.renameTo], 'name', data.renameTo);
        Vue.delete(state.snippets, data.active);
      }
    },
    [MUTATION.DELETE_SNIPPET](state, name) {
      Vue.delete(state.snippets, name);
    },
    [MUTATION.ADD_EXAMPLE](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.push(data.point);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    [MUTATION.DELETE_EXAMPLE](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.splice(data.index, 1);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    [MUTATION.ADD_TRAINED_DATA](state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].trainData = data.trainData;
        state.snippets[data.name].trained = true;
      }
    },
    [MUTATION.CLEAR_SAMPLES](state) {
      state.samples = [];
    },
    [MUTATION.ADD_SAMPLE](state, sample) {
      sample.selected = false;
      state.samples.push(sample);
      state.samples = state.samples.sort(function(a, b) {
        if (a.mean < b.mean) return 1;
        if (a.mean > b.mean) return -1;
        return 0;
      });
    },
    [MUTATION.SET_SERVER_STATUS_IDLE](state) {
      state.serverStatus.action = SERVER_STATUS.IDLE;
      state.serverStatus.message = '';
    },
    [MUTATION.SET_SERVER_STATUS_TRAIN](state, name) {
      state.serverStatus.action = SERVER_STATUS.TRAIN;
      state.serverStatus.message = `Training ${name}`;
    },
    [MUTATION.SET_SERVER_STATUS_SAMPLE](state, name) {
      state.serverStatus.action = SERVER_STATUS.SAMPLE;
      state.serverStatus.message = `Sampling ${name}`;
    },
    [MUTATION.EXPORT_SNIPPETS](state, file) {
      const data = JSON.stringify(state.snippets, undefined, 2);
      try {
        fs.writeFileSync(file, data);
      } catch (e) {
        console.log(e);
      }
    },
    [MUTATION.CACHE_SNIPPETS](state, key) {
      settings.set(key, state.snippets);
    },
    [MUTATION.LOAD_SNIPPETS](state, key) {
      state.cacheKey = key;

      if (settings.has(key)) {
        const snippets = settings.get(key);

        // some older snapshots might be missing some keys
        for (const id in snippets) {
          if (!('filter' in snippets[id])) snippets[id].filter = [];
        }

        state.snippets = snippets;
      } else {
        state.snippets = {};
      }
    },
    [MUTATION.IMPORT_SNIPPETS](state, file) {
      try {
        if (fs.existsSync(file)) {
          const data = fs.readFileSync(file);
          state.snippets = JSON.parse(data);
        }
      } catch (e) {
        console.log(e);
      }
    },
    [MUTATION.SET_ACTIVE_SNIPPET_SCORE](state, score) {
      state.activeSnippetScore = score;
    },
    [MUTATION.SET_PARAM_COLOR_DATA](state, data) {
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
    [MUTATION.SET_SNIPPET_SETTING](state, data) {
      state.settings[data.key].value = data.value;

      settings.set('snippetSettings', state.settings);
    },
    [MUTATION.LOAD_SNIPPET_SETTINGS](state) {
      const loadedSettings = settings.get('snippetSettings');
      for (const key in loadedSettings) {
        if (key in state.settings) {
          state.settings[key].value = loadedSettings[key].value;
        }
      }
    },
    [MUTATION.CLEAR_CACHE](state) {
      // deletes the cached training data for all snippets
      for (const key in state.snippets) {
        delete state.snippets[key].trainData;
        state.snippets[key].trained = false;
      }
      settings.set(state.cacheKey, state.snippets);
    },
    [MUTATION.SET_MIX_A](state, vec) {
      state.mixA = vec;
    },
    [MUTATION.SET_MIX_B](state, vec) {
      state.mixB = vec;
    },
    [MUTATION.LOAD_NEW_FILE](state) {
      // state resets for new file
      state.mixA = [];
      state.mixB = [];
      state.mixResults = {};
      state.activeMixAxes = {};
      state.axisMixResults = {};
      state.activatedSnippets = [];
      state.paramData = {
        meanMax: 1,
        meanMin: -1
      };
    },
    [MUTATION.SET_MIX_RESULTS](state, results) {
      state.mixResults = results;
    },
    [MUTATION.ADD_ACTIVE_MIX_AXIS](state, name) {
      if (!(name in state.activeMixAxes)) {
        Vue.set(state.activeMixAxes, name, { name, weight: 1 });
      }
    },
    [MUTATION.REMOVE_ACTIVE_MIX_AXIS](state, name) {
      if (name in state.activeMixAxes) {
        Vue.delete(state.activeMixAxes, name);
      }
    },
    [MUTATION.CLEAR_ACTIVE_MIX_AXES](state) {
      state.activeMixAxes = {};
    },
    [MUTATION.SET_AXIS_MIX_RESULTS](state, results) {
      state.axisMixResults = results;
    },
    [MUTATION.SET_PRIMARY_SNIPPET](state, name) {
      state.primarySnippet = name;
    },
    [MUTATION.ACTIVATE_SNIPPET](state, name) {
      if (state.activatedSnippets.indexOf(name) === -1)
        state.activatedSnippets.push(name);
    },
    [MUTATION.DEACTIVATE_SNIPPET](state, name) {
      const idx = state.activatedSnippets.indexOf(name);
      if (idx > -1) state.activatedSnippets.splice(idx, 1);
    },
    [MUTATION.SET_SAMPLER_OPTION](state, data) {
      // only pre-existing settings are reactive by design
      state.samplerSettings[data.key] = data.val;
    },
    [MUTATION.SET_ALL_SAMPLER_OPTIONS](state, data) {
      // only iterate through existing keys
      for (const id in state.samplerSettings) {
        if (id in data) {
          state.samplerSettings[id] = data[id];
        }
      }
    },
    [MUTATION.SET_PARAMS_AS_FILTER](state, data) {
      if (data.name in state.snippets) {
        Vue.set(state.snippets[data.name], 'filter', data.params);
      }
    },
    [MUTATION.SET_AUTO_FILTER_MODE](state, mode) {
      state.autoFilterMode = mode;
    },
    [MUTATION.SET_EXEMPLAR_SCORE](state, data) {
      state.snippets[data.name].data[data.id].y = data.score;
      state.snippets[data.name].trained = false;
    },
    [MUTATION.SET_SPREAD_BASE](state, x0) {
      state.paramSpreadBase = x0;
    },
    [MUTATION.SET_SAMPLE_SELECTED](state, data) {
      Vue.set(
        state.samples[
          state.samples.findIndex(sample => sample.idx === data.id)
        ],
        'selected',
        data.selected
      );
    },
    [MUTATION.SET_RELEVANCE_THRESHOLD](state, val) {
      state.relevanceThreshold = val;
    },
    [MUTATION.SQUASH_SCORES](state, snippetName) {
      if (snippetName in state.snippets) {
        // re-scale snippets to be between range [0.9, 0.1]
        const snippet = state.snippets[snippetName];
        for (let i = 0; i < snippet.data.length; i++) {
          snippet.data[i].y = snippet.data[i].y * 0.8 + 0.1;
        }

        snippet.trained = false;
      }
    },
    [MUTATION.STRETCH_SCORES](state, snippetName) {
      if (snippetName in state.snippets) {
        // re-scale snippets to be between range [0, 1] assuming
        // we just did a stretch operation
        const snippet = state.snippets[snippetName];
        for (let i = 0; i < snippet.data.length; i++) {
          snippet.data[i].y = clamp((snippet.data[i].y - 0.1) / 0.8, 1, 0);
        }

        snippet.trained = false;
      }
    },
    [MUTATION.START_TRIAL](state) {
      // this is basically a no-op to log a start event
      console.log('Trial Started');
    },
    [MUTATION.END_TRIAL](state) {
      // also a no-op to log things
      console.log('Trial Ended');
    },
    [MUTATION.SET_LOG_PATH](state, path) {
      state.logPath = path;
    }
  },
  actions: {
    [ACTION.NEW_SNIPPET](context, data) {
      try {
        context.commit(MUTATION.NEW_SNIPPET, data.name);
        // await driver.addSnippet(data.name);
        // context.commit(MUTATION.SET_ACTIVE_SNIPPET, data.name);
        // context.commit(MUTATION.ACTIVATE_SNIPPET, data.name);
        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
      } catch (e) {
        console.log(e);
      }
    },
    [ACTION.COPY_SNIPPET](context, data) {
      try {
        context.commit(MUTATION.COPY_SNIPPET, data);
        // context.commit(MUTATION.SET_ACTIVE_SNIPPET, data.copyTo);
        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
      } catch (e) {
        console.log(e);
      }
    },
    [ACTION.RENAME_SNIPPET](context, data) {
      try {
        context.commit(MUTATION.RENAME_SNIPPET, data);

        // if activated, update the id in the list
        if (context.state.activatedSnippets.indexOf(data.active) > -1) {
          context.commit(MUTATION.DEACTIVATE_SNIPPET, data.active);
          context.commit(MUTATION.ACTIVATE_SNIPPET, data.renameTo);
        }
        // context.commit(MUTATION.SET_ACTIVE_SNIPPET, data.renameTo);
        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
      } catch (e) {
        console.log(e);
      }
    },
    [ACTION.DELETE_SNIPPET](context, data) {
      try {
        context.commit(MUTATION.DELETE_SNIPPET, data.name);
        // context.commit(MUTATION.UPDATE_ACTIVE_SNIPPET);
        // always deactivate deletions
        context.commit(MUTATION.DEACTIVATE_SNIPPET, data.name);

        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
        // await driver.deleteSnippet(data.name);
      } catch (e) {
        console.log(e);
      }
    },
    async [ACTION.TRAIN](context, name) {
      context.commit(MUTATION.SET_SERVER_STATUS_TRAIN, name);

      await trainSnippet(driver, context, name);

      // load parameter color data if this is the active snippet
      if (name === context.state.primarySnippet) {
        await context.dispatch(ACTION.LOAD_PARAM_COLOR_DATA, name);
      }

      context.commit(MUTATION.SET_SERVER_STATUS_IDLE, name);
    },
    async [ACTION.LOAD_SNIPPET](context, name) {
      // loads the existing train data into the server
      context.commit(MUTATION.SET_SERVER_STATUS_TRAIN, name);
      await loadSnippet(driver, context, name);

      context.commit(MUTATION.SET_SERVER_STATUS_IDLE, name);
    },
    [ACTION.ADD_EXAMPLE](context, data) {
      try {
        context.commit(MUTATION.ADD_EXAMPLE, data);
        // context.commit(MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
        context.dispatch(ACTION.TRAIN, data.name);
        // await driver.addData(data.name, data.point.x, data.point.y);
      } catch (e) {
        console.log(e);
      }
    },
    [ACTION.DELETE_EXAMPLE](context, data) {
      try {
        context.commit(MUTATION.DELETE_EXAMPLE, data);
        // context.commit(MUTATION.UPDATE_ACTIVE_SNIPPET);
        context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
        context.dispatch(ACTION.TRAIN, data.name);
        // await driver.removeData(data.name, data.index);
      } catch (e) {
        console.log(e);
      }
    },
    async [ACTION.SYNC](context) {
      // todo: yeh fill this in
    },
    async [ACTION.CONNECT](context) {
      context.commit(MUTATION.CONNECT);

      // bind status callbacks
      driver.connectCallback = function(connected, serverOnline) {
        context.commit(MUTATION.STATUS_UPDATE, {
          connected,
          serverOnline
        });
      };

      driver.sampleCallback = function(data, name) {
        unnormalizeSample(data, context.getters.params);
        context.commit(MUTATION.ADD_SAMPLE, data);
      };

      driver.sampleFinalCallback = function(data, name) {
        context.dispatch(ACTION.STOP_SAMPLER);
      };
      // reset the server state completely
      await driver.reset();

      // sync the current snippet state?
    },
    async [ACTION.START_SAMPLER](context, data) {
      try {
        // the settings are local now
        data.data = Object.assign({}, context.state.samplerSettings);
        data.data.threshold = computeThreshold(
          context.state.samplerSettings.threshold,
          context.state.samplerSettings.thresholdMode,
          context.getters.maxCurrentSnippetScore,
          context.getters.currentSnippetScore
        );
        delete data.data.thresholdMode;

        context.commit(MUTATION.SET_SERVER_STATUS_SAMPLE);
        context.commit(MUTATION.CLEAR_SAMPLES);

        // get the current normalized vector starting state
        const current = context.getters.paramsAsArray;
        data.data.x0 = normalizeVector(current, context.getters.params);

        await driver.sample(data.name, data.data);
      } catch (e) {
        console.log(e);
      }
    },
    async [ACTION.REFINE_SNIPPET](context, name) {
      // if i implemented this right, the snippet data is sync'd to the server
      // and re-trained every time the exemplar list changes,
      // so a sync step shouldn't be strictly necessary here
      context.commit(MUTATION.SET_SERVER_STATUS_SAMPLE);
      context.commit(MUTATION.CLEAR_SAMPLES);

      // current normalized vector start state
      const current = context.getters.paramsAsArray;
      const x0 = normalizeVector(current, context.getters.params);

      // only send relevant params
      const params = {
        n: context.state.samplerSettings.n
      };

      await driver.refine(name, x0, params);

      context.commit(MUTATION.SET_SERVER_STATUS_IDLE);
    },
    async [ACTION.STOP_SAMPLER](context) {
      try {
        await driver.stopSampler();
        context.commit(MUTATION.SET_SERVER_STATUS_IDLE);
      } catch (e) {
        console.log(e);
      }
    },
    [ACTION.DISCONNECT](context) {
      context.commit(MUTATION.DISCONNECT);
    },
    [ACTION.LOAD_SNIPPETS](context, key) {
      // reset state during the load
      context.commit(MUTATION.LOAD_SNIPPETS, key);
      // context.commit(MUTATION.UPDATE_ACTIVE_SNIPPET, key);
      context.commit(MUTATION.CLEAR_SAMPLES);

      // send parameter info
      driver.setParamInfo(context.getters.params);

      // call load snippet on all trained snippets, assumes connected
      // and for those untrained, create empty snippet objects
      if (context.state.serverOnline) {
        for (const s of Object.keys(context.state.snippets)) {
          if (context.state.snippets[s].trained) {
            context.dispatch(ACTION.LOAD_SNIPPET, s);
          } else {
            driver.addSnippet(s);
          }
        }
      }
    },
    async [ACTION.EVAL_CURRENT](context, vec) {
      if (
        context.state.primarySnippet in context.state.snippets &&
        context.state.snippets[context.state.primarySnippet].trained
      ) {
        try {
          const score = await driver.predictOne(
            context.state.primarySnippet,
            normalizeVector(vec, context.getters.params)
          );
          context.commit(MUTATION.SET_ACTIVE_SNIPPET_SCORE, score);

          // check filtered param mode
          if (context.state.autoFilterMode !== AUTO_FILTER_MODE.NO_FILTER)
            context.dispatch(ACTION.UPDATE_AUTO_FILTER_PARAMS);
        } catch (e) {
          console.log(e);
        }
      } else {
        context.commit(MUTATION.SET_ACTIVE_SNIPPET_SCORE, {
          mean: 0,
          cov: 0
        });
      }
    },
    async [ACTION.EVAL_THEN_EXECUTE](context, data) {
      if (context.state.snippets[data.name].trained) {
        try {
          const score = await driver.predictOne(
            data.name,
            normalizeVector(
              context.getters.paramsAsArray,
              context.getters.params
            )
          );
          context.commit(MUTATION.SET_ACTIVE_SNIPPET_SCORE, score);
        } catch (e) {
          console.log(e);
        }

        // execute callback
        data.callback();
      }
    },
    async [ACTION.LOAD_PARAM_COLOR_DATA](context, snippet) {
      if (context.getters.status === SERVER_STATUS.IDLE) {
        const current = context.getters.paramsAsArray;
        const paramData = await driver.predictAll1D(snippet, {
          x: normalizeVector(current, context.getters.params),
          rmin: 0,
          rmax: 1,
          n: 20
        });
        context.commit(MUTATION.SET_PARAM_COLOR_DATA, paramData);
      }
      // todo: may want a message in app saying that system is busy and can't run the command
    },
    [ACTION.GENERATE_RANDOM](context, params) {
      if (context.getters.status === SERVER_STATUS.IDLE) {
        // clears sample array
        context.commit(MUTATION.CLEAR_SAMPLES);

        // adds count random samples to the sample array
        for (let i = 0; i < params.count; i++) {
          context.commit(MUTATION.ADD_SAMPLE, {
            x: unnormalizeVector(
              randomVector(
                normalizeVector(
                  context.getters.paramsAsArray,
                  context.getters.params
                ),
                params.freeParams,
                context.getters.activeParamIDs
              ),
              context.getters.params
            ),
            mean: 0,
            cov: 0,
            idx: i + randIDStart
          });
        }

        randIDStart = randIDStart + params.count;
      }
    },
    async [ACTION.MIX](context, params) {
      if (context.getters.status === SERVER_STATUS.IDLE) {
        const results = await driver.mix(
          params.a,
          params.b,
          params.count,
          params.args
        );
        context.commit(MUTATION.SET_MIX_RESULTS, results);
      }
    },
    async [ACTION.MIX_AXES](context, data) {
      // check that snippets are trained
      console.log('Preparing for mix operation...');
      context.commit(MUTATION.SET_AXIS_MIX_RESULTS, {});
      const ids = [];

      for (const name of data.snippetIDs) {
        if (name in context.state.snippets) {
          if (!context.state.snippets[name].trained) {
            await trainSnippet(driver, context, name);
          } else {
            await loadSnippet(driver, context, name);
          }

          ids.push(name);
        } else {
          console.log(`WARN: no snippet with id ${name} found, skipping`);
        }
      }

      // normalize x0
      data.params.x0 = normalizeVector(data.params.x0, context.getters.params);

      console.log('Sending mix command...');
      const results = await driver.mixSnippets(ids, data.params);

      // unnormalize results
      for (const r of results) {
        r.x = unnormalizeVector(r.x, context.getters.params);
      }

      // update mix results
      context.commit(MUTATION.SET_AXIS_MIX_RESULTS, results);
    },
    [ACTION.SET_PRIMARY_SNIPPET](context, name) {
      context.commit(MUTATION.SET_PRIMARY_SNIPPET, name);
      context.dispatch(ACTION.EVAL_CURRENT, context.getters.paramsAsArray);
      context.dispatch(ACTION.LOAD_PARAM_COLOR_DATA, name);
    },
    async [ACTION.JITTER_SAMPLE](context, args) {
      context.commit(MUTATION.CLEAR_SAMPLES);

      const samples = await driver.jitter(
        normalizeVector(args.x0, context.getters.params),
        args.delta,
        args.snippet,
        args.opt
      );

      for (let i = 0; i < samples.length; i++) {
        context.commit(MUTATION.ADD_SAMPLE, {
          x: unnormalizeVector(samples[i].x, context.getters.params),
          mean: samples[i].score,
          cov: 0,
          idx: samples[i].idx + randIDStart
        });
      }
    },
    async [ACTION.SELECT_DEFAULT_FILTER](context, name) {
      // ensure exists
      await driver.addSnippet(name);

      // sync data
      await driver.setData(
        name,
        normalizeData(context.state.snippets[name].data, context.getters.params)
      );

      // get default filter
      const filter = await driver.getDefaultFilter(name);
      context.commit(MUTATION.SET_NONE_ACTIVE);
      context.commit(MUTATION.CHANGE_PARAMS_ACTIVE, {
        ids: filter,
        active: true
      });
    },
    async [ACTION.SET_SELECTED_AS_FILTER](context, name) {
      // set the filter
      context.commit(MUTATION.SET_PARAMS_AS_FILTER, {
        name,
        params: context.getters.activeParamIDs
      });

      // retrain
      context.dispatch(ACTION.TRAIN, name);
    },
    async [ACTION.UPDATE_AUTO_FILTER_PARAMS](context) {
      // updates the selected parameters based on the current auto-filter mode
      // these are all based on the current primary snippet (doesn't make much sense to
      // allow multiple filters at the same time at the moment).)
      if (context.state.autoFilterMode === AUTO_FILTER_MODE.IMPACT) {
        // impact can be measured via the lengthscale parameters of the selected
        // snippet.
        const params = filterByImpact(
          context.getters.primarySnippetObject,
          context.getters.relevanceThreshold
        );

        context.commit(MUTATION.SET_NONE_ACTIVE);
        context.commit(MUTATION.CHANGE_PARAMS_ACTIVE, {
          ids: params,
          active: true
        });
      } else if (context.state.autoFilterMode === AUTO_FILTER_MODE.BEST) {
        const params = await driver.identifyBestParams(
          context.getters.primarySnippet,
          normalizeVector(
            context.getters.paramsAsArray,
            context.getters.params
          ),
          { bestThreshold: 0.75 }
        );

        context.commit(MUTATION.SET_NONE_ACTIVE);
        context.commit(MUTATION.CHANGE_PARAMS_ACTIVE, {
          ids: params,
          active: true
        });
      }
    },
    [ACTION.SET_AUTO_FILTER_MODE](context, mode) {
      context.commit(MUTATION.SET_AUTO_FILTER_MODE, mode);
      context.dispatch(ACTION.UPDATE_AUTO_FILTER_PARAMS);
    },
    [ACTION.SET_EXEMPLAR_SCORE](context, data) {
      context.commit(MUTATION.SET_EXEMPLAR_SCORE, data);
      context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
      context.dispatch(ACTION.TRAIN, data.name);
    },
    [ACTION.SET_ALL_EXEMPLAR_SCORES](context, data) {
      for (const id of data.ids) {
        context.commit(MUTATION.SET_EXEMPLAR_SCORE, {
          name: data.name,
          id,
          score: data.score
        });
      }

      context.commit(MUTATION.CACHE_SNIPPETS, context.state.cacheKey);
      context.dispatch(ACTION.TRAIN, data.name);
    },
    [ACTION.SQUASH_SCORES](context, snippetName) {
      context.commit(MUTATION.SQUASH_SCORES, snippetName);
      context.dispatch(ACTION.TRAIN, snippetName);
    },
    [ACTION.STRETCH_SCORES](context, snippetName) {
      context.commit(MUTATION.SQUASH_SCORES, snippetName);
      context.dispatch(ACTION.TRAIN, snippetName);
    }
  }
};
