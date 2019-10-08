<template>
  <div class="flex flex-col w-full border-gray-200 border-b snippet-widget">
    <div class="w-full text-gray-200 border-b border-gray-200 flex flex-row" :class="titleBgColor">
      <div class="w-full p-1">
        <div class="font-bold tracking-wide">{{ name }}</div>
        <div class="text-xs uppercase font-bold tracking-wide">{{ status }}</div>
      </div>
      <div
        class="w-6 bg-red-800 hover:bg-red-700 cursor-pointer flex justify-center items-center"
        @click="$emit('deactivate')"
      >
        <font-awesome-icon icon="times"></font-awesome-icon>
      </div>
    </div>
    <div class="w-full flex flex-row flex-no-wrap border-b border-gray-200">
      <ul class="list-reset flex font-sans">
        <menu-group name="Sample" menuStyle="compact">
          <menu-item menuStyle="compact" @click.native="sampleTowards()">Towards</menu-item>
          <menu-item menuStyle="compact" @click.native="sampleAway()">Away</menu-item>
          <menu-item menuStyle="compact" @click.native="sampleNearby()">Nearby</menu-item>
          <menu-item menuStyle="compact" @click.native="sampleAxis()">Axis</menu-item>
          <menu-item menuStyle="compact" @click.native="refine()">Refine</menu-item>
        </menu-group>
        <menu-group name="Params" menuStyle="compact">
          <menu-item menuStyle="compact" @click.native="selectAffected()">Select Affected</menu-item>
          <menu-item menuStyle="compact" @click.native="selectDefaultFilter()">Auto-Detect Used</menu-item>
          <menu-item menuStyle="compact" @click.native="setSelectedAsFilter()">Use Selected</menu-item>
          <menu-item menuStyle="compact" @click.native="filterByImpact()">Filter by Impact</menu-item>
        </menu-group>
        <menu-group name="Axis" menuStyle="compact">
          <menu-item menuStyle="compact" @click.native="addWithScoreVisible = true">Add Samples...</menu-item>
          <menu-item menuStyle="compact" @click.native="editGroupScoreVisible = true">Edit Scores...</menu-item>
          <menu-item menuStyle="compact" @click.native="train()">Retrain</menu-item>
        </menu-group>
      </ul>
      <div class="flex-grow green square-button border-l border-r tooltip" @click="addExample(1)">
        <div>
          <font-awesome-icon icon="plus-square"></font-awesome-icon>
        </div>
        <span class="tt-text">Add Positive</span>
      </div>
      <div class="flex-grow red square-button border-r tooltip" @click="addExample(0)">
        <div>
          <font-awesome-icon icon="minus-square"></font-awesome-icon>
        </div>
        <span class="tt-text">Add Negative</span>
      </div>
      <div class="flex-grow blue square-button border-r left tooltip" @click="setPrimary()">
        <div>
          <font-awesome-icon icon="crosshairs"></font-awesome-icon>
        </div>
        <span class="tt-text">Set As Primary Snippet</span>
      </div>
      <div
        class="flex-grow blue square-button left tooltip"
        @click="exemplarsVisible = !exemplarsVisible"
      >
        <div>
          <font-awesome-icon :icon="collapseIcon"></font-awesome-icon>
        </div>
        <span class="tt-text">Toggle Definition</span>
      </div>
    </div>
    <div
      class="flex flex-col w-full h-full justify-top overflow-hidden overlay p-2 border-b border-gray-200"
      v-if="addWithScoreVisible"
    >
      <div
        class="text-md font-bold uppercase tracking-wide text-center text-gray-200"
      >Add Selected Samples with Score</div>
      <div class="w-full flex my-2">
        <input class="w-2/3 mr-2" type="range" v-model="groupScore" min="0" max="1" step="0.01" />
        <input
          class="w-1/3 standard-text-field"
          type="number"
          v-model="groupScore"
          min="0"
          max="1"
          step="0.01"
        />
      </div>
      <div class="flex w-full">
        <div class="text-gray-200 text-sm w-full">
          <div
            class="flex content-center justify-center items-center w-full h-full"
          >{{ selectedCount }} selected</div>
        </div>
        <div class="w-1/5 pr-2">
          <div class="btn btn-red" @click="addWithScoreVisible = false">Cancel</div>
        </div>
        <div class="w-1/5">
          <div class="btn btn-green" @click="addSelectedSamplesWithScore">Add</div>
        </div>
      </div>
    </div>
    <div
      class="flex flex-col w-full h-full justify-top overflow-hidden overlay p-2 border-b border-gray-200"
      v-if="editGroupScoreVisible"
    >
      <div
        class="text-md font-bold uppercase tracking-wide text-center text-gray-200"
      >Edit Selected Examples with Score</div>
      <div class="w-full flex my-2">
        <input class="w-2/3 mr-2" type="range" v-model="groupScore" min="0" max="1" step="0.01" />
        <input
          class="w-1/3 standard-text-field"
          type="number"
          v-model="groupScore"
          min="0"
          max="1"
          step="0.01"
        />
      </div>
      <div class="flex w-full">
        <div class="text-gray-200 text-sm w-full">
          <div
            class="flex content-center justify-center items-center w-full h-full"
          >{{ selectedExemplars.length }} selected</div>
        </div>
        <div class="w-1/5 pr-2">
          <div class="btn btn-red" @click="editGroupScoreVisible = false">Cancel</div>
        </div>
        <div class="w-1/5">
          <div class="btn btn-green" @click="setSelectedExemplarScore">Set</div>
        </div>
      </div>
    </div>
    <div
      class="w-full overflow-auto flex flex-row flex-wrap exemplar-area"
      v-show="exemplarsVisible"
    >
      <exemplar
        v-for="id in sortedExemplars"
        :key="id + name"
        :snippet-name="name"
        :id="id"
        v-on:toggle-selected="toggleSelected"
        :selected="selectedExemplars.indexOf(id) >= 0"
      />
    </div>
  </div>
</template>

<script>
import Exemplar from '../Samples/Exemplar';
import MenuGroup from '../Menus/MenuGroup';
import MenuItem from '../Menus/MenuItem';
import {
  ACTION,
  MUTATION,
  THRESHOLD_MODE,
  THRESHOLD_ACCEPT_MODE,
  AUTO_FILTER_MODE
} from '../../store/constants';

export default {
  name: 'snippet-widget',
  components: {
    Exemplar,
    MenuGroup,
    MenuItem
  },
  props: {
    name: String,
    exemplars: Array
  },
  data() {
    return {
      exemplarsVisible: true,
      addWithScoreVisible: false,
      editGroupScoreVisible: false,
      groupScore: 1,
      selectedExemplars: []
    };
  },
  computed: {
    trained() {
      return this.$store.state.snippets.snippets[this.name].trained;
    },
    status() {
      return this.trained ? 'Trained' : 'Not Trained';
    },
    sortedExemplars() {
      // track original id
      const dup = [];
      for (let i = 0; i < this.exemplars.length; i++) {
        dup[i] = i;
      }

      // currently sorts by score
      // const self = this;
      return dup;
      // temporary disable sort
      // return dup.sort(function(a, b) {
      //   if (self.exemplars[a].y < self.exemplars[b].y) return 1;
      //   if (self.exemplars[a].y > self.exemplars[b].y) return -1;
      //   return 0;
      // });
    },
    isTraining() {
      return this.$store.getters.training;
    },
    collapseIcon() {
      return this.exemplarsVisible ? 'chevron-up' : 'chevron-down';
    },
    titleBgColor() {
      return this.$store.getters.primarySnippet === this.name
        ? 'bg-yellow-800'
        : 'bg-gray-700';
    },
    selectedCount() {
      return this.$store.getters.selectedSamples.length;
    }
  },
  methods: {
    addExample(y) {
      // snapshot current state
      const x = this.$store.getters.paramsAsArray;

      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: this.name,
        point: { x, y, affected: [] }
      });
    },
    train() {
      if (!this.isTraining && this.trained) {
        this.$store.dispatch(ACTION.LOAD_SNIPPET, this.name);
      } else if (!this.isTraining) {
        this.$store.dispatch(ACTION.TRAIN, this.name);
      }
    },
    setPrimary() {
      this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, this.name);
    },
    sampleTowards() {
      if (this.$store.getters.canSample(this.name)) {
        const store = this.$store;
        const name = this.name;

        this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, name);
        this.$store.dispatch(ACTION.EVAL_THEN_EXECUTE, {
          name,
          callback: () => {
            // initialize settings
            store.commit(MUTATION.SET_ALL_SAMPLER_OPTIONS, {
              thresholdMode: THRESHOLD_MODE.CURRENT_ABS,
              threshold: 0.05,
              thresholdEvalMode: THRESHOLD_ACCEPT_MODE.GREATER,
              scoreDelta: 0
            });
            store.dispatch(ACTION.START_SAMPLER, { name });
          }
        });
      }
    },
    sampleAway() {
      if (this.$store.getters.canSample(this.name)) {
        const store = this.$store;
        const name = this.name;

        this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, name);
        this.$store.dispatch(ACTION.EVAL_THEN_EXECUTE, {
          name,
          callback: () => {
            // initialize settings
            store.commit(MUTATION.SET_ALL_SAMPLER_OPTIONS, {
              thresholdMode: THRESHOLD_MODE.CURRENT_ABS,
              threshold: 0,
              thresholdEvalMode: THRESHOLD_ACCEPT_MODE.LESSER,
              scoreDelta: 0
            });
            store.dispatch(ACTION.START_SAMPLER, { name });
          }
        });
      }
    },
    sampleNearby() {
      if (this.$store.getters.canSample(this.name)) {
        const store = this.$store;
        const name = this.name;

        this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, name);
        this.$store.dispatch(ACTION.EVAL_THEN_EXECUTE, {
          name,
          callback: () => {
            // initialize settings
            store.commit(MUTATION.SET_ALL_SAMPLER_OPTIONS, {
              thresholdMode: THRESHOLD_MODE.ABSOLUTE,
              threshold: 0.1,
              thresholdEvalMode: THRESHOLD_ACCEPT_MODE.DISTANCE,
              thresholdTarget: store.getters.currentSnippetScore,
              scoreDelta: 0
            });
            store.dispatch(ACTION.START_SAMPLER, { name });
          }
        });
      }
    },
    sampleAxis() {
      if (this.$store.getters.canSample(this.name)) {
        const store = this.$store;
        const name = this.name;

        this.$store.dispatch(ACTION.SET_PRIMARY_SNIPPET, name);
        this.$store.dispatch(ACTION.EVAL_THEN_EXECUTE, {
          name,
          callback: () => {
            // initialize settings
            store.commit(MUTATION.SET_ALL_SAMPLER_OPTIONS, {
              thresholdMode: THRESHOLD_MODE.ABSOLUTE,
              threshold: 0,
              thresholdEvalMode: THRESHOLD_ACCEPT_MODE.GREATER,
              scoreDelta: 0.025,
              n: Math.max(this.$store.state.snippets.samplerSettings.n, 20)
            });
            store.dispatch(ACTION.START_SAMPLER, { name });
          }
        });
      }
    },
    refine() {
      if (this.$store.getters.idle) {
        this.$store.commit(MUTATION.SET_ALL_SAMPLER_OPTIONS, {
          n: Math.max(this.$store.state.snippets.samplerSettings.n, 20)
        });
        this.$store.dispatch(ACTION.REFINE_SNIPPET, this.name);
      }
    },
    selectDefaultFilter() {
      this.$store.dispatch(ACTION.SELECT_DEFAULT_FILTER, this.name);
    },
    setSelectedAsFilter() {
      this.$store.dispatch(ACTION.SET_SELECTED_AS_FILTER, this.name);
    },
    selectAffected() {
      const filter = this.$store.state.snippets.snippets[this.name].filter;
      if (filter.length > 0) {
        this.$store.commit(MUTATION.SET_NONE_ACTIVE);
        this.$store.commit(MUTATION.CHANGE_PARAMS_ACTIVE, {
          ids: filter,
          active: true
        });
      } else {
        this.selectDefaultFilter();
      }
    },
    filterByImpact() {
      this.$store.commit(MUTATION.SET_PRIMARY_SNIPPET, this.name);
      this.$store.dispatch(
        ACTION.SET_AUTO_FILTER_MODE,
        AUTO_FILTER_MODE.IMPACT
      );
    },
    filterByBest() {
      this.$store.commit(MUTATION.SET_PRIMARY_SNIPPET, this.name);
      this.$store.dispatch(ACTION.SET_AUTO_FILTER_MODE, AUTO_FILTER_MODE.BEST);
    },
    addSelectedSamplesWithScore() {
      const selected = this.$store.getters.selectedSamples;
      for (const sample of selected) {
        this.$store.dispatch(ACTION.ADD_EXAMPLE, {
          name: this.name,
          point: {
            x: sample.x,
            y: parseFloat(this.groupScore),
            affected: sample.affected
          }
        });
      }
      this.addWithScoreVisible = false;
    },
    toggleSelected(id) {
      if (this.selectedExemplars.indexOf(id) >= 0) {
        // remove
        this.selectedExemplars.splice(this.selectedExemplars.indexOf(id), 1);
      } else {
        // add
        this.selectedExemplars.push(id);
      }
    },
    deselectAll() {
      this.selectedExemplars = [];
    },
    setSelectedExemplarScore() {
      this.$store.dispatch(ACTION.SET_ALL_EXEMPLAR_SCORES, {
        name: this.name,
        ids: this.selectedExemplars,
        score: this.groupScore
      });

      this.editGroupScoreVisible = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.exemplar-area {
  height: 400px;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.8);
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
