// the parameter driver provides a unified interface for interacting with an arbitrary
// parameter-based back end in a way that's vuex friendly
// This function will take a backend-compatible object and return a vue compatible store
// - ideally the store will be able to be hot swapped, but the application mode may need to adjust
//   accordingly
import path from 'path';
import Vue from 'Vue';

import SbsBackend from '../backend/substance';
import CmpBackend from '../backend/compositor';

export function createStore(backend, type) {
  return {
    state: {
      type,
      parameters: [],
      cacheKey: '',
      backend,
      lastCommittedVector: [],
      snapshot: []
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
      }
    },
    mutations: {
      LOAD_NEW_FILE(state, config) {
        state.backend.loadNew(config);
        state.cacheKey = path.join(config.dir, config.filename);

        // at this point we need to re-load all of the parameter data
        state.parameters = state.backend.getParams();
        state.lastCommittedVector = state.parameters.map(p => p.value);
      },
      DETECT_BACKEND(state, filename) {
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
      SET_PARAM(state, config) {
        Vue.set(state.parameters[config.id], 'value', config.val);
        // state.backend.setParam(
        //   config.id,
        //   config.val,
        //   state.parameters[config.id]
        // );

        // // this seems painfully inefficient, but it might be performant enough to
        // // not be a problem?
        // // otherwise there needs to be a Vue.set to replace the parameter object?
        // state.parameters = backend.getParams();
      },
      SET_PARAMS(state, vec) {
        state.backend.setAllParams(vec);
        state.parameters = state.backend.getParams();
        state.lastCommittedVector = vec;
      },
      COMMIT_PARAMS(state) {
        // replaces the entire state with the array contained in config.val
        state.backend.setAllParams(state.parameters.map(p => p.value));
        state.lastCommittedVector = state.parameters.map(p => p.value);
      },
      SNAPSHOT(state) {
        if (state.snapshot.length === 0)
          state.snapshot = state.parameters.map(p => p.value);
      },
      RESET_SNAPSHOT(state) {
        state.snapshot = [];
      },
      SET_BACKEND_SETTING(state, data) {
        state.backend.setSetting(data.key, data.value);
      }
    },
    actions: {
      SET_PARAM(context, config) {
        context.commit('SET_PARAM', config);
      },
      COMMIT_PARAMS(context) {
        context.commit('COMMIT_PARAMS');
        context.dispatch('EVAL_CURRENT', context.getters.paramsAsArray);
        if (context.getters.activeSnippetName !== null) {
          context.dispatch(
            'LOAD_PARAM_COLOR_DATA',
            context.getters.activeSnippetName
          );
        }
      },
      SHOW_TEMPORARY_STATE(context, vec) {
        context.commit('SNAPSHOT');
        context.commit('SET_PARAMS', vec);
      },
      HIDE_TEMPORARY_STATE(context) {
        // there's a case where the snapshot is invalid when this is called (state is locked)
        if (context.state.snapshot.length > 0)
          context.commit('SET_PARAMS', context.state.snapshot);

        context.commit('RESET_SNAPSHOT');
      },
      LOCK_TEMPORARY_STATE(context, vec) {
        context.commit('RESET_SNAPSHOT');
        context.commit('SET_PARAMS', vec);
        context.dispatch('EVAL_CURRENT', vec);
      }
    }
  };
}
