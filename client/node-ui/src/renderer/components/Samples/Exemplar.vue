<template>
  <div
    class="exemplar overflow-hidden flex flex-col w-1/5 border border-gray-200 hover:border-yellow-500 rounded m-2"
  >
    <div
      class="w-full h-auto relative"
      v-on:mouseenter="onHover()"
      v-on:mouseleave="onHoverStop()"
      tabindex="0"
      ref="exemplar"
    >
      <div
        v-show="showActions"
        class="absolute bottom-0 left-0 w-full flex flex-row bg-gray-800 border-t border-gray-200 text-sm font-mono text-center"
      >
        <div
          @click="removeExample()"
          class="cursor-pointer bg-red-900 py-1 px-2 border-r border-gray-200 text-gray-200 flex-grow"
        >X</div>
        <div
          @click="lockExample()"
          class="cursor-pointer bg-green-700 py-1 px-2 text-gray-200 flex-grow"
        >Lock</div>
      </div>
      <canvas ref="canvas" class="exemplarCanvas"/>
    </div>
    <div
      class="flex flex-row text-gray-200 font-mono text-sm px-2 py-1 border-t border-gray-200 justify-between"
      :class="[scoreClass]"
    >
      <div class="flex-auto">ID: {{ id }}</div>
      <div class="flex-no-grow">{{ score }}</div>
    </div>
  </div>
</template>

<script>
import { ACTION } from '../../store/constants';

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
      return this.score >= 0 ? 'bg-green-900' : 'bg-red-900';
    }
  },
  methods: {
    removeExample() {
      this.$store.dispatch(ACTION.DELETE_EXAMPLE, {
        name: this.snippetName,
        index: this.id
      });
    },
    onHover() {
      this.showActions = true;
      this.$store.dispatch(ACTION.SHOW_TEMPORARY_STATE, this.data.x);
      this.$refs.exemplar.focus();
    },
    onHoverStop() {
      this.showActions = false;
      this.$store.dispatch(ACTION.HIDE_TEMPORARY_STATE);
    },
    lockExample() {
      this.$store.dispatch(ACTION.LOCK_TEMPORARY_STATE, this.data.x);
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
