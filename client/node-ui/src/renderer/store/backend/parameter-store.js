// the parameter driver provides a unified interface for interacting with an arbitrary
// parameter-based back end in a way that's vuex friendly
// This function will take a backend-compatible object and return a vue compatible store
// - ideally the store will be able to be hot swapped, but the application mode may need to adjust
//   accordingly
import path from 'path';
import Vue from 'Vue';
import fs from 'fs-extra';

import SbsBackend from '../backend/substance';
// import CmpBackend from '../backend/compositor';
// import RltBackend from '../backend/relighter';
import PjsBackend from '../backend/particles';
import PtpBackend from '../backend/prototypo';

import { ACTION, MUTATION, RENDER_MODE } from '../constants';
import settings from 'electron-settings';

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
      extentsVectors: [],
      paramSets: {},
      hideNonActiveParams: false,
      selectLinked: true,
      renderMode: RENDER_MODE.CANVAS
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
      activeParams: state => {
        const active = [];
        for (const param of state.parameters) {
          if (param.active) active.push(param);
        }
        return active;
      },
      activeParamIDs: state => {
        const active = [];
        for (const i in state.parameters) {
          if (state.parameters[i].active) active.push(parseInt(i));
        }
        return active;
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
      },
      hideNonActiveParams: state => {
        return state.hideNonActiveParams;
      },
      paramSets: state => {
        return state.paramSets;
      },
      renderMode: state => {
        return state.renderMode;
      },
      renderCanvas: state => {
        return state.renderMode === RENDER_MODE.CANVAS;
      },
      renderText: state => {
        return state.renderMode === RENDER_MODE.TEXT;
      },
      selectLinked: state => {
        return state.selectLinked;
      }
    },
    mutations: {
      [MUTATION.LOAD_NEW_FILE](state, config) {
        state.backend.loadNew(config);
        state.cacheKey = path.join(config.dir, config.filename);

        // at this point we need to re-load all of the parameter data
        // params should include an active param
        const stateParams = state.backend.getParams();
        for (const id in stateParams) {
          stateParams[id].active = false;
        }

        state.parameters = stateParams;

        // load saved parameter groups
        const loadedSets = settings.get(`saved-groups-${state.cacheKey}`);
        state.paramSets = loadedSets || {};

        state.lastCommittedVector = state.parameters.map(p => p.value);
      },
      [MUTATION.DETECT_BACKEND](state, filename) {
        // valid extensions: .dark (compositor, excluded for now due to native build dep), .sbsar (substance)

        const ext = path.extname(filename);
        // if (ext === '.dark') {
        //   if (state.type === 'substance') {
        //     state.backend.stopUpdateLoop();
        //   }

        //   state.backend = CmpBackend;
        //   state.type = 'compositor';
        // }
        if (ext === '.sbsar') {
          state.backend = SbsBackend;
          state.type = 'substance';
          state.renderMode = RENDER_MODE.CANVAS;
        }
        // if (ext === '.png') {
        //   if (state.type === 'substance') {
        //     state.backend.stopUpdateLoop();
        //   }

        //   state.backend = RltBackend;
        //   state.type = 'relighter';
        //   state.renderMode = RENDER_MODE.CANVAS;
        // }
        if (ext === '.pjs') {
          if (state.type === 'substance') {
            state.backend.stopUpdateLoop();
          }

          state.backend = PjsBackend;
          state.type = 'particles';
          state.renderMode = RENDER_MODE.CANVAS;
        }
        if (ext === '.ptypo') {
          if (state.type === 'substance') {
            state.backend.stopUpdateLoop();
          }

          state.backend = PtpBackend;
          state.type = 'prototypo';
          state.renderMode = RENDER_MODE.TEXT;
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
      },
      [MUTATION.CHANGE_PARAM_ACTIVE](state, data) {
        // expects data to contain an id/index and an active flag
        Vue.set(state.parameters[data.id], 'active', data.active);

        if (state.selectLinked && state.parameters[data.id].links) {
          for (const id of state.parameters[data.id].links) {
            Vue.set(state.parameters[id], 'active', data.active);
          }
        }
      },
      [MUTATION.CHANGE_PARAMS_ACTIVE](state, data) {
        // data.ids should be an array of parameter ids
        for (const id of data.ids) {
          Vue.set(state.parameters[id], 'active', data.active);

          if (state.selectLinked && state.parameters[id].links) {
            for (const id2 of state.parameters[id].links) {
              Vue.set(state.parameters[id2], 'active', data.active);
            }
          }
        }
      },
      [MUTATION.SET_ALL_ACTIVE](state) {
        for (const param in state.parameters) {
          state.parameters[param].active = true;
        }
      },
      [MUTATION.SET_NONE_ACTIVE](state) {
        for (const param in state.parameters) {
          state.parameters[param].active = false;
        }
      },
      [MUTATION.SET_INACTIVE_VISIBILITY](state, shouldHideInactive) {
        state.hideNonActiveParams = shouldHideInactive;
      },
      [MUTATION.NEW_PARAM_SET](state, groupName) {
        state.paramSets[groupName] = [];
        settings.set(`saved-groups-${state.cacheKey}`, state.paramSets);
      },
      [MUTATION.UPDATE_PARAM_SET](state, setData) {
        state.paramSets[setData.name] = setData.params;
        settings.set(`saved-groups-${state.cacheKey}`, state.paramSets);
      },
      [MUTATION.DELETE_PARAM_SET](state, setName) {
        delete state.paramSets[setName];
        settings.set(`saved-groups-${state.cacheKey}`, state.paramSets);
      },
      [MUTATION.LOAD_PARAM_SET](state, setName) {
        if (setName in state.paramSets) {
          for (const id of state.paramSets[setName]) {
            state.parameters[id].active = true;
          }
        }
      },
      [MUTATION.SET_LINKED_SELECTION](state, active) {
        state.selectLinked = active;
      }
    },
    actions: {
      [ACTION.SET_PARAM](context, config) {
        context.commit(MUTATION.SET_PARAM, config);
      },
      [ACTION.COMMIT_PARAMS](context) {
        context.commit(MUTATION.COMMIT_PARAMS);
        context.dispatch(ACTION.EVAL_CURRENT, context.getters.paramsAsArray);
        if (context.getters.primarySnippet !== '') {
          context.dispatch(
            ACTION.LOAD_PARAM_COLOR_DATA,
            context.getters.primarySnippet
          );
        }
      },
      [ACTION.SHOW_TEMPORARY_STATE](context, vec) {
        context.commit(MUTATION.SNAPSHOT);
        context.commit(MUTATION.SET_PARAMS, vec);

        if (context.getters.primarySnippet !== '') {
          context.dispatch(
            ACTION.LOAD_PARAM_COLOR_DATA,
            context.getters.primarySnippet
          );
        }
      },
      [ACTION.HIDE_TEMPORARY_STATE](context) {
        // there's a case where the snapshot is invalid when this is called (state is locked)
        if (context.state.snapshot.length > 0)
          context.commit(MUTATION.SET_PARAMS, context.state.snapshot);

        context.commit(MUTATION.RESET_SNAPSHOT);
        if (context.getters.primarySnippet !== '') {
          context.dispatch(
            ACTION.LOAD_PARAM_COLOR_DATA,
            context.getters.primarySnippet
          );
        }
      },
      [ACTION.LOCK_TEMPORARY_STATE](context, vec) {
        context.commit(MUTATION.RESET_SNAPSHOT);
        context.commit(MUTATION.SET_PARAMS, vec);
        context.dispatch(ACTION.EVAL_CURRENT, vec);

        if (context.getters.primarySnippet !== '') {
          context.dispatch(
            ACTION.LOAD_PARAM_COLOR_DATA,
            context.getters.primarySnippet
          );
        }
      },
      [ACTION.GENERATE_EXTENTS](context, params) {
        // clear computed extents vectors
        context.commit(MUTATION.CLEAR_EXTENTS);
        context.commit(MUTATION.GENERATE_EXTENTS, params);
        context.commit(MUTATION.SHOW_EXTENTS);
      },
      [ACTION.LOAD_PARAM_SET](context, setName) {
        context.commit(MUTATION.SET_NONE_ACTIVE);
        context.commit(MUTATION.LOAD_PARAM_SET, setName);
      },
      [ACTION.EXPORT_PARAM_STATE](context, filename) {
        try {
          fs.writeFileSync(
            filename,
            JSON.stringify(context.getters.paramsAsArray)
          );
        } catch (e) {
          console.log(e);
        }
      },
      [ACTION.IMPORT_PARAM_STATE](context, filename) {
        try {
          const params = JSON.parse(fs.readFileSync(filename));
          context.commit(MUTATION.SET_PARAMS, params);
        } catch (e) {
          console.log(e);
        }
      }
    }
  };
}
