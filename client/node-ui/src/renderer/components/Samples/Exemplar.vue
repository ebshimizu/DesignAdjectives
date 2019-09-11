<template>
  <div class="w-1/3 p-2">
    <div
      class="exemplar overflow-hidden flex flex-col w-full border border-gray-200 hover:border-yellow-500 rounded"
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
          class="absolute bottom-0 left-0 w-full flex flex-row flex-wrap bg-gray-800 border-t border-gray-200 text-sm font-mono text-center"
        >
          <div
            @click="lockExample()"
            class="cursor-pointer border-b bg-blue-900 hover:bg-blue-700 py-1 px-2 border-r text-gray-200 flex-grow"
          >Lock</div>
          <div
            @click="setA()"
            class="cursor-pointer border-b bg-blue-900 hover:bg-blue-700 py-1 px-2 text-gray-200 border-r"
          >+A</div>
          <div
            @click="setB()"
            class="cursor-pointer bg-blue-900 hover:bg-blue-700 py-1 px-2 text-gray-200 border-r"
          >+B</div>
          <div
            @click="removeExample()"
            class="cursor-pointer bg-red-900 hover:bg-red-700 py-1 px-2 text-gray-200 flex-grow"
          >X</div>
        </div>
        <canvas ref="canvas" class="exemplarCanvas" />
      </div>
      <div
        class="flex flex-row text-gray-200 font-mono text-sm px-2 py-1 border-t border-gray-200 justify-beteween content-center items-center"
        :class="[scoreClass]"
      >
        <div class="flex-shrink text-xs">ID: {{ id }}</div>
        <div class="w-1/2 pl-2 flex-grow text-xs">
          <input
            v-model="localScore"
            type="number"
            min="0"
            max="1"
            step="0.01"
            class="scoreInput w-full text-right rounded shadow"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ACTION, MUTATION } from '../../store/constants';
const _ = require('lodash');

export default {
  name: 'exemplar',
  data() {
    return {
      retrievalError: false,
      showActions: false,
      localScore: this.$store.state.snippets.snippets[this.snippetName].data[
        this.id
      ].y
    };
  },
  created: function() {
    this.debounceSetScore = _.debounce(this.setScore, 800);
  },
  props: ['snippetName', 'id'],
  watch: {
    localScore: function(newVal, oldVal) {
      this.debounceSetScore();
    }
  },
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
    scoreClass() {
      return parseFloat(this.localScore) > 0.5 ? 'bg-green-900' : 'bg-red-900';
    }
  },
  methods: {
    setScore() {
      this.$store.dispatch(ACTION.SET_EXEMPLAR_SCORE, {
        name: this.snippetName,
        id: this.id,
        score: parseFloat(this.localScore)
      });
    },
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
    },
    setA() {
      this.$store.commit(MUTATION.SET_MIX_A, this.data.x);
    },
    setB() {
      this.$store.commit(MUTATION.SET_MIX_B, this.data.x);
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

.scoreInput {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
