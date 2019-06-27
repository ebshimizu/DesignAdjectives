// the parameter driver provides a unified interface for interacting with an arbitrary
// parameter-based back end in a way that's vuex friendly
// This function will take a backend-compatible object and return a vue compatible store
// - ideally the store will be able to be hot swapped, but the application mode may need to adjust
//   accordingly
import path from 'path';
import Vue from 'Vue';

import SbsBackend from '../backend/substance';
import CmpBackend from '../backend/compositor';

import { ACTION, MUTATION } from '../constants';

export function createStore(backend, type) {
  return {
    state: {
      type,
      parameters: [],
      cacheKey: '',
      backend,
      lastCommittedVector: [],
      snapshot: [],
      extentsParam: '',
      extentsId: -1,
      extentsVisible: false,
      extentsVectors: []
    },
    getters: {
      param: state => id => {
        if (id < state.parameters.length) return state.parameters[id];
        return 0;
      },
      params: state => {
        return state.parameters;
      },
      paramsAsArray: state => {
        return state.parameters.map(p => p.value);
      },
      renderer: state => {
        return state.backend.renderer;
      },
      settings: state => {
        return state.backend.getSettings();
      },
      backendType: state => {
        return state.backend.type();
      },
      extentsParam: state => {
        return state.extentsParam;
      },
      extentsVisible: state => {
        return state.extentsVisible;
      },
      extentsVectors: state => {
        return state.extentsVectors;
      },
      extentsId: state => {
        return state.extentsId;
      }
    },
    mutations: {
      [MUTATION.LOAD_NEW_FILE](state, config) {
        state.backend.loadNew(config);
        state.cacheKey = path.join(config.dir, config.filename);

        // at this point we need to re-load all of the parameter data
        state.parameters = state.backend.getParams();
        state.lastCommittedVector = state.parameters.map(p => p.value);
      },
      [MUTATION.DETECT_BACKEND](state, filename) {
        // valid extensions: .dark (compositor), .sbsar (substance)

        const ext = path.extname(filename);
        if (ext === '.dark') {
          if (state.type === 'substance') {
            state.backend.stopUpdateLoop();
          }

          state.backend = CmpBackend;
          state.type = 'compositor';
        } else if (ext === '.sbsar') {
          state.backend = SbsBackend;
          state.type = 'substance';
        }
      },
      [MUTATION.SET_PARAM](state, config) {
        Vue.set(state.parameters[config.id], 'value', config.val);
      },
      [MUTATION.SET_PARAMS](state, vec) {
        state.backend.setAllParams(vec);
        state.parameters = state.backend.getParams();
        state.lastCommittedVector = vec;
      },
      [MUTATION.COMMIT_PARAMS](state) {
        // replaces the entire state with the array contained in config.val
        state.backend.setAllParams(state.parameters.map(p => p.value));
        state.lastCommittedVector = state.parameters.map(p => p.value);
      },
      [MUTATION.SNAPSHOT](state) {
        if (state.snapshot.length === 0)
          state.snapshot = state.parameters.map(p => p.value);
      },
      [MUTATION.RESET_SNAPSHOT](state) {
        state.snapshot = [];
      },
      [MUTATION.SET_BACKEND_SETTING](state, data) {
        state.backend.setSetting(data.key, data.value);
      },
      [MUTATION.SHOW_EXTENTS](state) {
        state.extentsVisible = true;
      },
      [MUTATION.HIDE_EXTENTS](state) {
        state.extentsVisible = false;
      },
      [MUTATION.CLEAR_EXTENTS](state) {
        state.extentsVectors = [];
        state.extentsParam = '';
        state.extentsId = -1;
      },
      [MUTATION.GENERATE_EXTENTS](state, params) {
        // copy current param state
        const current = state.parameters.map(p => p.value);
        const paramID = params.id;
        const param = state.parameters[paramID];
        state.extentsParam = param.name;
        state.extentsId = paramID;

        for (let i = 0; i <= params.count; i++) {
          const paramCopy = current.slice(0);
          const a = (1 / params.count) * i;

          // unnormalized value
          paramCopy[paramID] = param.min + (param.max - param.min) * a;
          state.extentsVectors.push(paramCopy);
        }
      }
    },
    actions: {
      [ACTION.SET_PARAM](context, config) {
        context.commit(MUTATION.SET_PARAM, config);
      },
      [ACTION.COMMIT_PARAMS](context) {
        context.commit(MUTATION.COMMIT_PARAMS);
        context.dispatch(ACTION.EVAL_CURRENT, context.getters.paramsAsArray);
        if (context.getters.activeSnippetName !== null) {
          context.dispatch(
            ACTION.LOAD_PARAM_COLOR_DATA,
            context.getters.activeSnippetName
          );
        }
      },
      [ACTION.SHOW_TEMPORARY_STATE](context, vec) {
        context.commit(MUTATION.SNAPSHOT);
        context.commit(MUTATION.SET_PARAMS, vec);
        context.dispatch(
          ACTION.LOAD_PARAM_COLOR_DATA,
          context.getters.activeSnippetName
        );
      },
      [ACTION.HIDE_TEMPORARY_STATE](context) {
        // there's a case where the snapshot is invalid when this is called (state is locked)
        if (context.state.snapshot.length > 0)
          context.commit(MUTATION.SET_PARAMS, context.state.snapshot);

        context.commit(MUTATION.RESET_SNAPSHOT);
        context.dispatch(
          ACTION.LOAD_PARAM_COLOR_DATA,
          context.getters.activeSnippetName
        );
      },
      [ACTION.LOCK_TEMPORARY_STATE](context, vec) {
        context.commit(MUTATION.RESET_SNAPSHOT);
        context.commit(MUTATION.SET_PARAMS, vec);
        context.dispatch(ACTION.EVAL_CURRENT, vec);
        context.dispatch(
          ACTION.LOAD_PARAM_COLOR_DATA,
          context.getters.activeSnippetName
        );
      },
      [ACTION.GENERATE_EXTENTS](context, params) {
        // clear computed extents vectors
        context.commit(MUTATION.CLEAR_EXTENTS);
        context.commit(MUTATION.GENERATE_EXTENTS, params);
        context.commit(MUTATION.SHOW_EXTENTS);
      }
    }
  };
}
