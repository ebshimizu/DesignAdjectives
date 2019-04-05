import { DsDriver } from '../driver/dsNodeDriver';
import Vue from 'Vue';

// main app should not be allowed to access the driver object directly,
// would be able to invoke things outside of mutations/actions
let driver = null;

// this state maintains a list of snippet objects and sync's to the server as needed.
// data format is same as server
export default {
  state: {
    port: 5234,
    snippets: {},
    activeSnippet: '',
    log: [],
    connected: false,
    serverOnline: false
  },
  getters: {
    ready: state => {
      return state.connected && state.serverOnline;
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
    STATUS_UPDATE(state, status) {
      state.connected = status.connected;
      state.serverOnline = status.serverOnline;
    },
    NEW_SNIPPET(state, name) {
      if (!(name in state.snippets)) {
        Vue.set(state.snippets, name, {
          name,
          data: [],
          trainData: {}
        });
      }
    },
    DELETE_SNIPPET(state, name) {
      Vue.delete(state.snippets, name);
    },
    ADD_EXAMPLE(state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.push(data.point);
      }
    },
    DELETE_EXAMPLE(state, data) {
      if (data.name in state.snippets) {
        state.snippets[data.name].data.splice(data.index, 1);
      }
    },
    ADD_TRAINED_DATA(state, data) {
      if (name in state.snippets) {
        Vue.set(state.snippets[data.name], 'trainData', data.trainData);
      }
    }
  },
  actions: {
    async NEW_SNIPPET(context, data) {
      try {
        context.commit('NEW_SNIPPET', data.name);
        await driver.addSnippet(data.name);
      } catch (e) {
        console.log(e);
      }
    },
    async DELETE_SNIPPET(context, data) {
      try {
        context.commit('DELETE_SNIPPET', data.name);
        await driver.deleteSnippet(data.name);
      } catch (e) {
        console.log(e);
      }
    },
    async TRAIN(context, name) {
      try {
        // sync?
        // await driver.setData(name, context.state[name].data);
        // train
        const trainData = await driver.train(name);
        context.commit('ADD_TRAINED_DATA', { name, trainData });
      } catch (e) {
        console.log(e);
      }
    },
    async ADD_EXAMPLE(context, data) {
      try {
        context.commit('ADD_EXAMPLE', data);
        await driver.addData(data.name, data.point.x, data.point.y);
      } catch (e) {
        console.log(e);
      }
    },
    async SYNC(context) {
      // todo: yeh fill this in
    },
    CONNECT(context) {
      context.commit('CONNECT');

      // bind status callbacks
      driver.connectCallback = function(connected, serverOnline) {
        context.commit('STATUS_UPDATE', { connected, serverOnline });
      };
    }
  }
};
