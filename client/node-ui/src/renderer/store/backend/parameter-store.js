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
      }
    },
    mutations: {
      LOAD_NEW_FILE(state, config) {
        backend.loadNew(config);

        // at this point we need to re-load all of the parameter data
        state.parameters = backend.getParams();
      }
    },
    actions: {
      LOAD_NEW_FILE(context, config) {
        context.commit('LOAD_NEW_FILE', config);
      }
    }
  };
}
