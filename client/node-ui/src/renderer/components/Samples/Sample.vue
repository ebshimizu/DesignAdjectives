<template>
  <div v-bind:class="[widthClass, heightClass]" class="p-2">
    <div
      class="sample overflow-hidden flex flex-col border border-gray-200 hover:border-yellow-500 rounded"
    >
      <div
        class="w-full h-auto relative"
        v-on:mouseenter="onHover()"
        v-on:mouseleave="onHoverStop()"
        v-on:keyup.z="addPositive()"
        v-on:keyup.x="addNegative()"
        tabindex="0"
        ref="sample"
      >
        <div
          v-show="showActions"
          class="absolute bottom-0 left-0 w-full flex flex-row font-mono text-center border-t border-gray-200"
        >
          <div
            @click="select()"
            class="cursor-pointer bg-blue-900 hover:bg-blue-600 px-2 py-1 flex-grow text-gray-200 border-r border-gray-200"
          >Lock</div>
          <div
            @click="addPositive()"
            class="cursor-pointer font-bold flex-grow bg-green-900 hover:bg-green-700 px-2 py-1 border-r text-gray-200"
          >+</div>
          <div
            @click="addNegative()"
            class="cursor-pointer font-bold flex-grow bg-red-900 hover:bg-red-700 px-2 py-1 text-gray-200"
          >-</div>
        </div>
        <canvas ref="canvas" class="sampleCanvas" />
      </div>
      <div
        class="flex flex-row text-gray-200 font-mono text-sm px-2 py-1 border-t border-gray-200 justify-between bg-blue-darkest"
      >
        <div class="flex-auto">ID: {{ id }}</div>
        <div class="flex-no-grow">{{ score.toFixed(3) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ACTION } from '../../store/constants';
// keyboard shortcuts
// z = add positive
// x = add negative

export default {
  name: 'sample',
  data() {
    return {
      showActions: false
    };
  },
  props: ['sample', 'width', 'height'],
  computed: {
    score() {
      return this.sample.mean;
    },
    covariance() {
      return this.sample.cov;
    },
    id() {
      return this.sample.idx;
    },
    x() {
      return this.sample.x;
    },
    widthClass() {
      if (this.width) return this.width;

      return 'w-48';
    },
    heightClass() {
      if (this.height) return this.height;

      return '';
    }
  },
  methods: {
    select() {
      // copy x to the current state
      this.$store.dispatch(ACTION.LOCK_TEMPORARY_STATE, this.x);
    },
    onHover() {
      this.showActions = true;
      this.$store.dispatch(ACTION.SHOW_TEMPORARY_STATE, this.x);
      this.$refs.sample.focus();
    },
    onHoverStop() {
      this.showActions = false;
      this.$store.dispatch(ACTION.HIDE_TEMPORARY_STATE);
    },
    addPositive() {
      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: this.$store.getters.activeSnippetName,
        point: { x: this.x, y: 1 }
      });
    },
    addNegative() {
      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: this.$store.getters.activeSnippetName,
        point: { x: this.x, y: -1 }
      });
    }
  },
  mounted: function() {
    this.$store.getters.renderer(this.$refs.canvas, {
      size: 'thumb',
      state: this.x,
      instanceID: `sample-${this.id}`,
      once: true
    });
  }
};
</script>

<style lang="scss">
.sampleCanvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
