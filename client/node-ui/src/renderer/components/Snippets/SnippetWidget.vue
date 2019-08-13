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
          <menu-item menuStyle="compact">Axis</menu-item>
        </menu-group>
        <menu-group name="Params" menuStyle="compact">
          <menu-item menuStyle="compact">Select Used</menu-item>
          <menu-item menuStyle="compact">Lock Used</menu-item>
          <menu-item menuStyle="compact">Filter by Impact</menu-item>
          <menu-item menuStyle="compact">Filter by Best</menu-item>
        </menu-group>
        <menu-group name="Debug" menuStyle="compact">
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
      class="w-full overflow-auto flex flex-row flex-wrap exemplar-area"
      v-show="exemplarsVisible"
    >
      <exemplar v-for="id in sortedExemplars" :key="id + name" :snippet-name="name" :id="id" />
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
  THRESHOLD_ACCEPT_MODE
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
      exemplarsVisible: true
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
      const self = this;
      return dup.sort(function(a, b) {
        if (self.exemplars[a].y < self.exemplars[b].y) return 1;
        if (self.exemplars[a].y > self.exemplars[b].y) return -1;
        return 0;
      });
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
    }
  },
  methods: {
    addExample(y) {
      // snapshot current state
      const x = this.$store.getters.paramsAsArray;

      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: this.name,
        point: { x, y }
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
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdMode',
              val: THRESHOLD_MODE.CURRENT_ABS
            });
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'threshold',
              val: 0.05
            }); // +0.05 of current at least
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdEvalMode',
              val: THRESHOLD_ACCEPT_MODE.GREATER
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
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdMode',
              val: THRESHOLD_MODE.CURRENT_ABS
            });
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'threshold',
              val: 0
            }); // +0 of current
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdEvalMode',
              val: THRESHOLD_ACCEPT_MODE.LESSER
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
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdMode',
              val: THRESHOLD_MODE.ABSOLUTE
            });
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'threshold',
              val: 0.1
            }); // +0 of current
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdEvalMode',
              val: THRESHOLD_ACCEPT_MODE.DISTANCE
            });
            store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'thresholdTarget',
              val: store.getters.currentSnippetScore
            });
            store.dispatch(ACTION.START_SAMPLER, { name });
          }
        });
      }
    }
  }
};
</script>

<style lang="scss">
.exemplar-area {
  height: 400px;
}
</style>
