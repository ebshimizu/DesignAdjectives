<template>
  <div class="h-full w-full flex flex-row flex-no-wrap">
    <div class="w-1/4 h-full flex flex-col border-r border-gray-200 overflow-hidden">
      <div class="w-full font-bold uppercase tracking-wide text-sm p-1 text-gray-200">Axis Mixer</div>
      <div class="w-full p-1 pb-2 flex flex-row border-b border-gray-200">
        <select
          class="font-bold w-full border-2 border-blue-800 cursor-pointer"
          v-model="currentSelectedSnippet"
        >
          <option disabled value>Select an Axis</option>
          <option
            v-for="option in snippetOptions"
            v-bind:value="option.name"
            v-bind:key="option.name"
          >{{ option.name }}</option>
        </select>
        <div class="w-1/5 flex justify-center items-center pl-1">
          <div
            class="uppercase tracking-wide text-base rounded bg-green-800 hover:bg-green-700 w-full h-full text-center cursor-pointer text-gray-200"
            @click="addActive(currentSelectedSnippet)"
          >Add</div>
        </div>
      </div>
      <div class="w-full font-bold uppercase tracking-wide text-sm p-1 text-gray-200">Acive Axes</div>
      <div class="w-full h-full overflow-auto p-1 flex-shrink">
        <div class="flex text-gray-200 mb-1" v-for="axis in activeAxes" :key="axis.name">
          <div class="w-4/5 text-sm">{{ axis.name }}</div>
          <div class="w-1/5 flex items-center justify-center pl-1 cursor-pointer">
            <div
              @click="removeActive(axis.name)"
              class="w-full h-full bg-red-800 hover:bg-red-700 rounded font-bold text-center"
            >X</div>
          </div>
        </div>
      </div>
      <div class="w-full flex items-center justify-center p-1 mixButton">
        <div
          class="w-full h-full rounded bg-green-800 hover:bg-green-700 uppercase tracking wide text-sm font-bold text-gray-200 text-center cursor-pointer"
          @click="mix()"
        >Mix</div>
      </div>
    </div>
    <div class="w-3/4 h-full flex flex-row flex-wrap overflow-auto items-start">
      <sample v-for="sample in currentResults" :key="sample.count" v-bind:sample="sample"></sample>
    </div>
  </div>
</template>

<script>
import { MUTATION, ACTION } from '../../store/constants';
import Sample from '../Samples/Sample';

export default {
  name: 'axis-mixer',
  components: {
    Sample
  },
  data() {
    return {
      currentSelectedSnippet: ''
    };
  },
  computed: {
    snippetOptions() {
      const opts = {};
      const avail = this.$store.state.snippets.snippets;
      for (const id in avail) {
        if (!(id in this.activeAxes)) {
          opts[id] = avail[id];
        }
      }

      return opts;
    },
    activeAxes() {
      return this.$store.state.snippets.activeMixAxes;
    },
    currentResults() {
      return this.$store.state.snippets.axisMixResults;
    }
  },
  methods: {
    clearActive() {
      this.$store.commit(MUTATION.CLEAR_ACTIVE_MIX_AXES);
    },
    addActive(name) {
      this.$store.commit(MUTATION.ADD_ACTIVE_MIX_AXIS, name);
    },
    removeActive(name) {
      this.$store.commit(MUTATION.REMOVE_ACTIVE_MIX_AXIS, name);
    },
    mix() {
      this.$store.dispatch(ACTION.MIX_AXES, {
        snippetIDs: Object.keys(this.activeAxes),
        params: {
          method: 'mixWeightedObjFunc',
          x0: this.$store.getters.paramsAsArray
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.mixButton {
  height: 3em;
}
</style>
