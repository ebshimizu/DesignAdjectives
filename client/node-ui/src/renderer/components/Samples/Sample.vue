<template>
  <div
    class="sample overflow-hidden flex flex-col w-48 border border-grey-light hover:border-yellow rounded m-2"
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
      <div v-show="showActions" class="absolute pin-b pin-l w-full flex flex-row p-4">
        <div
          @click="select()"
          class="cursor-pointer rounded bg-blue-dark p-2 font-sans text-grey-lightest"
        >Lock</div>
        <div
          @click="addPositive()"
          class="cursor-pointer text-center font-bold w-8 rounded bg-green-dark ml-1 p-2 font-sans text-grey-lightest"
        >+</div>
        <div
          @click="addNegative()"
          class="cursor-pointer text-center font-bold w-8 rounded bg-red-dark ml-1 p-2 font-sans text-grey-lightest"
        >-</div>
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
      this.$store.dispatch('LOCK_TEMPORARY_STATE', this.x);
    },
    onHover() {
      this.showActions = true;
      this.$store.dispatch('SHOW_TEMPORARY_STATE', this.x);
      this.$refs.sample.focus();
    },
    onHoverStop() {
      this.showActions = false;
      this.$store.dispatch('HIDE_TEMPORARY_STATE');
    },
    addPositive() {
      this.$store.dispatch('ADD_EXAMPLE', {
        name: this.$store.getters.activeSnippetName,
        point: { x: this.x, y: 1 }
      });
    },
    addNegative() {
      this.$store.dispatch('ADD_EXAMPLE', {
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
