<template>
  <div class="flex w-full h-full">
    <div class="w-1/5 flex-grow-0 border-r border-gray-200 flex flex-col">
      <div
        class="bg-gray-700 w-full font-mono text-sm text-gray-200 text-center border-b border-gray-200 py-1"
      >Element A</div>
      <div class="flex border-b border-gray-200 font-mono text-sm text-gray-200">
        <div
          class="text-center w-1/2 bg-blue-800 hover:bg-blue-700 p-1 cursor-pointer"
          @click="useCurrent('A')"
        >Use Current</div>
        <div
          class="text-center w-1/2 bg-red-800 hover:bg-red-700 p-1 cursor-pointer"
          @click="clear('A')"
        >Clear</div>
      </div>
      <div v-show="showA" class="w-full h-full">
        <canvas ref="mixACanvas" class="mixCanvas" />
      </div>
    </div>
    <div class="w-full flex-grow-1 flex flex-col">
      <div class="w-full flex-grow-0 border-b border-gray-200 flex">
        <div class="flex p-1">
          <label class="text-xs font-bold tracking-wide uppercase text-gray-200 my-auto mr-2">Count</label>
          <input class="standard-text-field w-16" type="number" v-model="count" min="0" step="1" />
        </div>
        <div
          class="p-2 bg-green-800 hover:bg-green-700 cursor-pointer font-mono text-center text-gray-200 w-48"
          @click="mix()"
        >Mix</div>
      </div>
      <div class="w-full h-full overflow-auto flex flex-wrap justify-center">
        <sample v-for="sample in samples" :key="sample.idx" v-bind:sample="sample" />
      </div>
    </div>
    <div class="w-1/5 flex-grow-0 border-l border-gray-200 flex flex-col">
      <div
        class="bg-gray-700 w-full font-mono text-sm text-gray-200 text-center border-b border-gray-200 py-1"
      >Element B</div>
      <div class="flex border-b border-gray-200 font-mono text-sm text-gray-200">
        <div
          class="text-center w-1/2 bg-blue-800 hover:bg-blue-700 p-1 cursor-pointer"
          @click="useCurrent('B')"
        >Use Current</div>
        <div
          class="text-center w-1/2 bg-red-800 hover:bg-red-700 p-1 cursor-pointer"
          @click="clear('B')"
        >Clear</div>
      </div>
      <div v-show="showB" class="w-full h-full">
        <canvas ref="mixBCanvas" class="mixCanvas" />
      </div>
    </div>
  </div>
</template>

<script>
import { MUTATION, ACTION } from '../../store/constants';
import Sample from '../Samples/Sample';

export default {
  name: 'mix-panel',
  components: {
    Sample
  },
  data() {
    return {
      count: 20
    };
  },
  computed: {
    mixA() {
      return this.$store.state.snippets.mixA;
    },
    mixB() {
      return this.$store.state.snippets.mixB;
    },
    showA() {
      return this.mixA.length > 0;
    },
    showB() {
      return this.mixB.length > 0;
    },
    samples() {
      const samples = [];
      const rawData = this.$store.state.snippets.mixResults;
      if (rawData && 'results' in rawData) {
        for (const result of rawData.results) {
          samples.push({
            x: result.x,
            mean: 0,
            cov: 0,
            idx: `${samples.length}-${new Date().getTime()}`
          });
        }
      }

      return samples;
    }
  },
  methods: {
    clear: function(type) {
      if (type === 'A') this.$store.commit(MUTATION.SET_MIX_A, []);
      else if (type === 'B') this.$store.commit(MUTATION.SET_MIX_B, []);
    },
    useCurrent: function(type) {
      if (type === 'A')
        this.$store.commit(
          MUTATION.SET_MIX_A,
          this.$store.getters.paramsAsArray
        );
      else if (type === 'B')
        this.$store.commit(
          MUTATION.SET_MIX_B,
          this.$store.getters.paramsAsArray
        );
    },
    mix() {
      this.$store.dispatch(ACTION.MIX, {
        a: this.mixA,
        b: this.mixB,
        count: parseInt(this.count)
      });
    }
  },
  watch: {
    mixA: function(newVal) {
      if (this.$store.getters.renderer) {
        this.$store.getters.renderer(this.$refs.mixACanvas, {
          size: 'thumb',
          state: newVal,
          instanceID: `mixA`,
          once: true
        });
      }
    },
    mixB: function(newVal) {
      if (this.$store.getters.renderer) {
        this.$store.getters.renderer(this.$refs.mixBCanvas, {
          size: 'thumb',
          state: newVal,
          instanceID: `mixA`,
          once: true
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.mixCanvas {
  width: 100%;
  height: auto;
}
</style>
