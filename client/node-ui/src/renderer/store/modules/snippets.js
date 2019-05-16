import { DsDriver } from '../driver/dsNodeDriver';
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
    }
  },
  mutations: {
    SET_PORT(state, port) {
      state.port = port;
    },
    CONNECT(state) {
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
    DISCONNECT(state) {
      if (driver) {
        driver.disconnect();
        state.connected = false;
        state.serverOnline = false;
        state.serverStatus.action = 'IDLE';
      }
    },
    STATUS_UPDATE(state, status) {
      state.connected = status.connected;
      state.serverOnline = status.serverOnline;
    },
    NEW_SNIPPET(state, name) {
      if (!(name in state.snippets)) {
        Vue.set(state.snippets, name, {});
        Vue.set(state.snippets[name], 'name', name);
        Vue.set(state.snippets[name], 'data', []);
        Vue.set(state.snippets[name], 'trainData', {});
        Vue.set(state.snippets[name], 'trained', false);
      }
    },
    DELETE_SNIPPET(state, name) {
      Vue.delete(state.snippets, name);
    },
    ADD_EXAMPLE(state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.push(data.point);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    DELETE_EXAMPLE(state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.splice(data.index, 1);

        state.snippets[data.name].trainData = {};
        state.snippets[data.name].trained = false;
      }
    },
    ADD_TRAINED_DATA(state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].trainData = data.trainData;
        state.snippets[data.name].trained = true;
      }
    },
    SET_ACTIVE_SNIPPET(state, id) {
      if (id in state.snippets)
        state.activeSnippet = Object.assign({}, state.snippets[id]);
      else state.activeSnippet = {};
    },
    UPDATE_ACTIVE_SNIPPET(state) {
      if (state.activeSnippet.name in state.snippets)
        state.activeSnippet = Object.assign(
          {},
          state.snippets[state.activeSnippet.name]
        );
      else state.activeSnippet = {};
    },
    CLEAR_SAMPLES(state) {
      state.samples = [];
    },
    ADD_SAMPLE(state, sample) {
      state.samples.push(sample);
    },
    SET_SERVER_STATUS_IDLE(state) {
      state.serverStatus.action = 'IDLE';
      state.serverStatus.message = '';
    },
    SET_SERVER_STATUS_TRAIN(state, name) {
      state.serverStatus.action = 'TRAIN';
      state.serverStatus.message = `Training ${name}`;
    },
    SET_SERVER_STATUS_SAMPLE(state, name) {
      state.serverStatus.action = 'SAMPLE';
      state.serverStatus.message = `Sampling ${name}`;
    },
    EXPORT_SNIPPETS(state, file) {
      const data = JSON.stringify(state.snippets, undefined, 2);
      try {
        fs.writeFileSync(file, data);
      } catch (e) {
        console.log(e);
      }
    },
    CACHE_SNIPPETS(state, key) {
      settings.set(key, state.snippets);
    },
    LOAD_SNIPPETS(state, key) {
      state.cacheKey = key;

      if (settings.has(key)) state.snippets = settings.get(key);
      else state.snippets = {};
    },
    IMPORT_SNIPPETS(state, file) {
      try {
        if (fs.existsSync(file)) {
          const data = fs.readFileSync(file);
          state.snippets = JSON.parse(data);
        }
      } catch (e) {
        console.log(e);
      }
    },
    SET_ACTIVE_SNIPPET_SCORE(state, score) {
      state.activeSnippetScore = score;
    }
  },
  actions: {
    NEW_SNIPPET(context, data) {
      try {
        context.commit('NEW_SNIPPET', data.name);
        // await driver.addSnippet(data.name);
        context.commit('SET_ACTIVE_SNIPPET', data.name);
        context.commit('CACHE_SNIPPETS', context.state.cacheKey);
      } catch (e) {
        console.log(e);
      }
    },
    DELETE_SNIPPET(context, data) {
      try {
        context.commit('DELETE_SNIPPET', data.name);
        context.commit('UPDATE_ACTIVE_SNIPPET');
        context.commit('CACHE_SNIPPETS', context.state.cacheKey);
        // await driver.deleteSnippet(data.name);
      } catch (e) {
        console.log(e);
      }
    },
    async TRAIN(context, name) {
      try {
        context.commit('SET_SERVER_STATUS_TRAIN', name);

        // ensure snippet exists
        await driver.addSnippet(name);
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
        context.commit('ADD_TRAINED_DATA', { name, trainData });
        context.commit('UPDATE_ACTIVE_SNIPPET');
        context.commit('CACHE_SNIPPETS', context.state.cacheKey);
      } catch (e) {
        console.log(e);
      }

      context.commit('SET_SERVER_STATUS_IDLE', name);
    },
    async LOAD_SNIPPET(context, name) {
      // loads the existing train data into the server
      try {
        context.commit('SET_SERVER_STATUS_TRAIN', name);

        // ensure exists
        await driver.addSnippet(name);

        // load gpr data
        await driver.loadGPR(
          name,
          normalizeData(
            context.state.snippets[name].data,
            context.getters.params
          ),
          context.state.snippets[name].trainData
        );

        // done
      } catch (e) {
        console.log(e);
      }

      context.commit('SET_SERVER_STATUS_IDLE', name);
    },
    ADD_EXAMPLE(context, data) {
      try {
        context.commit('ADD_EXAMPLE', data);
        context.commit('UPDATE_ACTIVE_SNIPPET');
        context.commit('CACHE_SNIPPETS', context.state.cacheKey);
        // await driver.addData(data.name, data.point.x, data.point.y);
      } catch (e) {
        console.log(e);
      }
    },
    DELETE_EXAMPLE(context, data) {
      try {
        context.commit('DELETE_EXAMPLE', data);
        context.commit('UPDATE_ACTIVE_SNIPPET');
        context.commit('CACHE_SNIPPETS', context.state.cacheKey);
        // await driver.removeData(data.name, data.index);
      } catch (e) {
        console.log(e);
      }
    },
    async SYNC(context) {
      // todo: yeh fill this in
    },
    async CONNECT(context) {
      context.commit('CONNECT');

      // bind status callbacks
      driver.connectCallback = function(connected, serverOnline) {
        context.commit('STATUS_UPDATE', { connected, serverOnline });
      };

      driver.sampleCallback = function(data, name) {
        unnormalizeSample(data, context.getters.params);
        context.commit('ADD_SAMPLE', data);
      };

      driver.sampleFinalCallback = function(data, name) {
        context.dispatch('STOP_SAMPLER');
      };

      // reset the server state completely
      await driver.reset();

      // sync the current snippet state?
    },
    async START_SAMPLER(context, data) {
      try {
        context.commit('SET_SERVER_STATUS_SAMPLE');
        context.commit('CLEAR_SAMPLES');
        await driver.sample(data.name, data.data);
      } catch (e) {
        console.log(e);
      }
    },
    async STOP_SAMPLER(context) {
      try {
        await driver.stopSampler();
        context.commit('SET_SERVER_STATUS_IDLE');
      } catch (e) {
        console.log(e);
      }
    },
    DISCONNECT(context) {
      context.commit('DISCONNECT');
    },
    SET_ACTIVE_SNIPPET(context, data) {
      context.commit('SET_ACTIVE_SNIPPET', data);
      context.dispatch('COMMIT_PARAMS');
    },
    LOAD_SNIPPETS(context, key) {
      // reset state during the load
      context.commit('LOAD_SNIPPETS', key);
      context.commit('UPDATE_ACTIVE_SNIPPET', key);
      context.commit('CLEAR_SAMPLES');

      // call load snippet on all trained snippets, assumes connected
      if (context.state.serverOnline) {
        for (const s of Object.keys(context.state.snippets)) {
          if (context.state.snippets[s].trained)
            context.dispatch('LOAD_SNIPPET', s);
        }
      }
    },
    async EVAL_CURRENT(context, vec) {
      if (context.state.activeSnippet && context.state.activeSnippet.trained) {
        try {
          const score = await driver.predictOne(
            context.getters.activeSnippetName,
            normalizeVector(vec, context.getters.params)
          );
          context.commit('SET_ACTIVE_SNIPPET_SCORE', score);
        } catch (e) {
          console.log(e);
        }
      } else {
        context.commit('SET_ACTIVE_SNIPPET_SCORE', { mean: 0, cov: 0 });
      }
    }
  }
};
