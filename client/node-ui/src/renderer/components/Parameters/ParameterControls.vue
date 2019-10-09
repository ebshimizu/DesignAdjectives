<template>
  <div
    class="h-full w-full flex flex-col border-l border-gray-200 text-gray-200 overflow-hidden relative"
  >
    <div
      class="w-full text-center text-xs font-mono border-b flex flex-col"
      v-show="showRemoveButton"
    >
      <div class="w-full flex flex-row">
        <div class="w-full p-1">{{ filterModeText }}</div>
        <div class="bg-red-800 p-1 cursor-pointer hover:bg-red-700" @click="removeFilterMode">Stop</div>
      </div>
      <div class="w-full p-1 flex flex-row">
        <input
          class="w-2/3 mr-2"
          type="range"
          v-model="relevanceThreshold"
          min="0"
          max="2"
          step="0.001"
        />
        <input
          class="w-1/3 standard-text-field"
          type="number"
          v-model="relevanceThreshold"
          min="0"
          max="1"
          step="0.001"
        />
      </div>
    </div>
    <div class="param-controls overflow-auto overflow-x-hidden flex flex-col">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
    <div class="param-panel overflow-auto flex-no-shrink border-t border-gray-200">
      <div
        class="flex flex-wrap p-1 relative w-full h-full overflow-hidden items-start content-start"
      >
        <div class="w-full text-center uppercase text-sm font-bold mb-1">Selection Tools</div>
        <div class="selection-tool-button">
          <div @click="selectAll()">All</div>
        </div>
        <div class="selection-tool-button">
          <div @click="selectNone()">None</div>
        </div>
        <div class="wide selection-tool-button">
          <div @click="toggleHideInactive()">{{ hideInactiveText }}</div>
        </div>
        <div class="wide selection-tool-button">
          <div @click="toggleLinkedSelection">{{ linkedSelectionText }}</div>
        </div>
        <div class="w-full text-center uppercase text-sm font-bold mb-1">Groups</div>
        <div class="w-5/6 pr-1">
          <select
            class="text-sm font-mono p-1 w-full bg-gray-800 text-grey-light cursor-pointer"
            v-model="activeGroup"
          >
            <option
              v-for="(val, name) in paramSets"
              v-bind:value="name"
              v-bind:key="name"
            >{{ name }}</option>
          </select>
        </div>
        <div class="w-1/6 selection-tool-button">
          <div @click="loadActiveSet()">Load</div>
        </div>
        <div class="selection-tool-button">
          <div @click="showNewModal()">New</div>
        </div>
        <div class="selection-tool-button">
          <div @click="updateActiveSet()">Update</div>
        </div>
        <div class="selection-tool-button">
          <div @click="deleteActiveSet()">Delete</div>
        </div>
        <div class="w-full text-center uppercase text-sm font-bold mb-1">Primary Snippet</div>
        <div class="w-full p-1">
          <select
            class="text-sm font-mono p-1 w-full bg-gray-800 text-grey-light cursor-pointer"
            v-model="primarySnippet"
          >
            <option v-for="name in snippetOptions" v-bind:value="name" v-bind:key="name">{{ name }}</option>
          </select>
        </div>
        <div class="new-modal snippet-panel-modal" v-show="showNew">
          <div class="title">New Parameter Set</div>
          <div class="w-full flex flex-row items-center border-b border-b-2 border-green">
            <input
              v-model="paramSetName"
              placeholder="Enter Parameter Set Name"
              class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
              type="text"
            />
            <div class="flex-no-shrink btn btn-green mr-2" @click="createParamSet()">Create</div>
            <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals()">Cancel</div>
          </div>
          <div
            class="w-full text-sm my-2 bg-red-200 border border-red-300 text-red-800 py-3 px-4 rounded"
            v-show="paramSetError"
          >A Parameter Set with this name already exists</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ParameterControl from './ParameterControl';
import SnippetsPanel from '../Snippets/SnippetsPanel';
import Tabs from '../Tabs/Tabs';
import Tab from '../Tabs/Tab';

import { MUTATION, ACTION, AUTO_FILTER_MODE } from '../../store/constants';

export default {
  name: 'parameter-controls',
  components: {
    ParameterControl,
    SnippetsPanel,
    Tabs,
    Tab
  },
  data() {
    return {
      showNew: false,
      paramSetName: '',
      paramSetError: false,
      activeGroup: ''
    };
  },
  computed: {
    relevanceThreshold: {
      get() {
        return this.$store.getters.relevanceThreshold;
      },
      set(val) {
        this.$store.commit(MUTATION.SET_RELEVANCE_THRESHOLD, parseFloat(val));
        this.$store.dispatch(ACTION.UPDATE_AUTO_FILTER_PARAMS);
      }
    },
    parameters() {
      return this.$store.state.paramStore.parameters;
    },
    hideInactiveText() {
      if (this.$store.getters.hideNonActiveParams) return 'Show Inactive';
      else return 'Hide Inactive';
    },
    paramSets() {
      return this.$store.getters.paramSets;
    },
    snippetOptions() {
      return Object.keys(this.$store.state.snippets.snippets);
    },
    primarySnippet: {
      get() {
        return this.$store.state.snippets.primarySnippet;
      },
      set(val) {
        this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, val);
      }
    },
    filterModeText() {
      if (this.$store.state.snippets.autoFilterMode === AUTO_FILTER_MODE.IMPACT)
        return `Selecting Impactful Parames for ${this.primarySnippet}`;
      else if (
        this.$store.state.snippets.autoFilterMode === AUTO_FILTER_MODE.BEST
      )
        return `Selecting High Scoring Params for ${this.primarySnippet}`;
      else return 'Showing All Params';
    },
    showRemoveButton() {
      return (
        this.$store.state.snippets.autoFilterMode !== AUTO_FILTER_MODE.NO_FILTER
      );
    },
    linkedSelectionText() {
      return this.$store.getters.selectLinked
        ? 'Select Linked ON'
        : 'Select Linked OFF';
    }
  },
  methods: {
    selectAll() {
      this.$store.commit(MUTATION.SET_ALL_ACTIVE);
    },
    selectNone() {
      this.$store.commit(MUTATION.SET_NONE_ACTIVE);
    },
    toggleHideInactive() {
      this.$store.commit(
        MUTATION.SET_INACTIVE_VISIBILITY,
        !this.$store.getters.hideNonActiveParams
      );
    },
    showNewModal() {
      this.showNew = true;
      this.paramSetError = false;
      this.paramSetName = '';
    },
    hideAllModals() {
      this.showNew = false;
    },
    createParamSet() {
      if (this.paramSetName in this.paramSets) {
        this.paramSetError = true;
      } else {
        this.$store.commit(MUTATION.NEW_PARAM_SET, this.paramSetName);
        this.$store.dispatch(ACTION.LOAD_PARAM_SET, this.paramSetName);
        this.showNew = false;
        this.activeGroup = this.paramSetName;
      }
    },
    deleteActiveSet() {
      this.$store.commit(MUTATION.DELETE_PARAM_SET, this.activeGroup);
      this.activeGroup = '';
    },
    loadActiveSet() {
      if (this.activeGroup !== '') {
        this.$store.dispatch(ACTION.LOAD_PARAM_SET, this.activeGroup);
      }
    },
    updateActiveSet() {
      if (this.activeGroup !== '') {
        this.$store.commit(MUTATION.UPDATE_PARAM_SET, {
          name: this.activeGroup,
          params: this.$store.getters.activeParamIDs
        });
      }
    },
    removeFilterMode() {
      this.$store.dispatch(
        ACTION.SET_AUTO_FILTER_MODE,
        AUTO_FILTER_MODE.NO_FILTER
      );
    },
    toggleLinkedSelection() {
      this.$store.commit(
        MUTATION.SET_LINKED_SELECTION,
        !this.$store.getters.selectLinked
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.param-panel {
  height: 30vh;
}

.param-controls {
  height: 70vh;
}

input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  margin: 3.55px 6px 3.55px 0;
}
input[type='range']:focus {
  outline: none;
}
input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 20.9px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  border-radius: 1.3px;
  border: 0.2px solid #0b0101;
  background: #2d3748;
}
input[type='range']::-webkit-slider-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 28px;
  width: 8px;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -3.75px;
}
</style>

