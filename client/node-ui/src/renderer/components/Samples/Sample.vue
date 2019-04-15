<template>
  <div
    class="sample overflow-hidden flex flex-col w-48 border border-grey-light hover:border-yellow rounded m-2"
  >
    <div
      class="w-full h-auto relative"
      v-on:mouseenter="showActions = true"
      v-on:mouseleave="showActions = false"
    >
      <div v-show="showActions" class="absolute pin-b pin-l w-full flex flex-row p-4">
        <div class="cursor-pointer rounded bg-blue-dark p-2 font-sans text-grey-lightest">Select</div>
      </div>
      <canvas ref="canvas" class="sampleCanvas"/>
    </div>
    <div
      class="flex flex-row text-grey-lightest font-mono text-sm px-2 py-1 border-t border-grey-light justify-between bg-blue-darkest"
    >
      <div class="flex-auto">ID: {{ id }}</div>
      <div class="flex-no-grow">{{ score.toFixed(3) }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'sample',
  data() {
    return {
      showActions: false
    };
  },
  props: ['sample'],
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
    }
  },
  methods: {
    select() {
      // copy x to the current state
    }
  },
  mounted: function() {
    this.$store.getters.renderer(this.$refs.canvas, {
      size: 'thumb',
      state: this.x
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
