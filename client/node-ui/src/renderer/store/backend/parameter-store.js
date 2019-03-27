// the parameter driver provides a unified interface for interacting with an arbitrary
// parameter-based back end in a way that's vuex friendly
// This function will take a backend-compatible object and return a vue compatible store
// - ideally the store will be able to be hot swapped, but the application mode may need to adjust
//   accordingly

export function createStore(backend, type) {
  return {
    state: {
      type,
      parameters: []
    },
    getters: {
      param: state => id => {
        if (id < state.parameters.length) return state.parameters[id];
        return 0;
      },
      paramsAsArray: state => {
        return state.parameters.map(p => p.value);
      },
      renderer: _ => (canvasTarget, settings) => {
        return backend.renderer(canvasTarget, settings);
      }
    },
    mutations: {
      LOAD_NEW_FILE(state, config) {
        backend.loadNew(config);

        // at this point we need to re-load all of the parameter data
        state.parameters = backend.getParams();
      },
      SET_PARAM(state, config) {
        backend.setParam(config.id, config.val, state.parameters[config.id]);

        // this seems painfully inefficient, but it might be performant enough to
        // not be a problem?
        // otherwise there needs to be a Vue.set to replace the parameter object?
        state.parameters = backend.getParams();
      }
    },
    actions: {
      LOAD_NEW_FILE(context, config) {
        context.commit('LOAD_NEW_FILE', config);
      },
      SET_PARAM(context, config) {
        context.commit('SET_PARAM', config);
      }
    }
  };
}
