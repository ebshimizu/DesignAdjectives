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
        <menu-group name="Sample">
          <menu-item>Towards</menu-item>
          <menu-item>Away</menu-item>
          <menu-item>Nearby</menu-item>
          <menu-item>Axis</menu-item>
        </menu-group>
        <menu-group name="Params">
          <menu-item>Filter by Impact</menu-item>
          <menu-item>Select Used</menu-item>
        </menu-group>
        <menu-group name="Debug">
          <menu-item @click.native="train()">Retrain</menu-item>
        </menu-group>
      </ul>
      <div class="flex-grow green square-button border-l border-r" @click="addExample(1)">
        <div>
          <font-awesome-icon icon="plus-square"></font-awesome-icon>
        </div>
      </div>
      <div class="flex-grow red square-button border-r" @click="addExample(0)">
        <div>
          <font-awesome-icon icon="minus-square"></font-awesome-icon>
        </div>
      </div>
      <div class="flex-grow blue square-button border-r" @click="setPrimary()">
        <div>
          <font-awesome-icon icon="crosshairs"></font-awesome-icon>
        </div>
      </div>
      <div class="flex-grow blue square-button" @click="exemplarsVisible = !exemplarsVisible">
        <div>
          <font-awesome-icon :icon="collapseIcon"></font-awesome-icon>
        </div>
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
import { ACTION } from '../../store/constants';

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
    }
  }
};
</script>

<style lang="scss">
.exemplar-area {
  height: 400px;
}
</style>
