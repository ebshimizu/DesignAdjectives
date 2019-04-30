<template>
  <div
    class="exemplar overflow-hidden flex flex-col w-1/5 border border-grey-light hover:border-yellow rounded m-2"
  >
    <div
      class="w-full h-auto relative"
      v-on:mouseenter="showActions = true"
      v-on:mouseleave="showActions = false"
    >
      <div v-show="showActions" class="absolute pin-b pin-l w-full flex flex-row p-4">
        <div
          @click="removeExample()"
          class="cursor-pointer rounded bg-red-dark p-2 font-sans text-grey-lightest"
        >Remove</div>
      </div>
      <canvas ref="canvas" class="exemplarCanvas"/>
    </div>
    <div
      class="flex flex-row text-grey-lightest font-mono text-sm px-2 py-1 border-t border-grey-light justify-between"
      :class="[scoreClass]"
    >
      <div class="flex-auto">ID: {{ id }}</div>
      <div class="flex-no-grow">{{ score }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'exemplar',
  data() {
    return {
      retrievalError: false,
      showActions: false
    };
  },
  props: ['snippetName', 'id'],
  computed: {
    data() {
      if (
        this.snippetName in this.$store.state.snippets.snippets &&
        this.id <
          this.$store.state.snippets.snippets[this.snippetName].data.length
      ) {
        this.retrievalError = false;
        const snippet = this.$store.state.snippets.snippets[this.snippetName];
        return snippet.data[this.id];
      } else {
        this.retrievalError = true;
        return { x: [], y: NaN };
      }
    },
    score() {
      return this.data.y;
    },
    scoreClass() {
      return this.score >= 0 ? 'bg-green-darker' : 'bg-red-darker';
    }
  },
  methods: {
    removeExample() {
      this.$store.dispatch('DELETE_EXAMPLE', {
        name: this.snippetName,
        index: this.id
      });
    }
  },
  mounted: function() {
    if (!this.retrievalError) {
      this.$store.getters.renderer(this.$refs.canvas, {
        size: 'thumb',
        state: this.data.x,
        instanceID: `exemplar-${this.id}`,
        once: true
      });
    }
  }
};
</script>

<style lang="scss">
.exemplarCanvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
