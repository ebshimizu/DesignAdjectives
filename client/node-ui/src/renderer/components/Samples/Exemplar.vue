<template>
  <div class="w-1/3 p-2" v-click-outside="hideMenus">
    <div
      class="exemplar overflow-hidden flex flex-col w-full border border-gray-200 hover:border-yellow-500 rounded"
    >
      <div
        class="w-full relative h-auto"
        v-on:mouseenter="onHover()"
        v-on:mouseleave="onHoverStop()"
        tabindex="0"
        ref="exemplar"
      >
        <div
          v-show="showActions"
          class="absolute bottom-0 left-0 w-full flex flex-row font-mono text-center border-t border-gray-200"
        >
          <div
            @click="showOptMenu"
            class="cursor-pointer bg-blue-900 hover:bg-blue-600 px-2 py-1 flex-grow text-gray-200 border-r border-gray-200"
          >
            <font-awesome-icon icon="bars"></font-awesome-icon>
          </div>
          <div
            @click="lockExample()"
            class="cursor-pointer bg-blue-900 hover:bg-blue-600 px-2 py-1 flex-grow text-gray-200 border-r border-gray-200"
          >
            <font-awesome-icon icon="clone"></font-awesome-icon>
          </div>
          <div
            @contextmenu.prevent="showNegSnippetMenu"
            @click="removeExample()"
            class="cursor-pointer font-bold flex-grow bg-red-900 hover:bg-red-700 px-2 py-1 text-gray-200"
          >
            <font-awesome-icon icon="times"></font-awesome-icon>
          </div>
        </div>
        <canvas ref="canvas" class="exemplarCanvas" />
        <div
          class="absolute left-0 top-0 p-1 text-center font-mono text-xs z-10 text-gray-200 id-label rounded border-gray-200 border-r border-b"
        >{{ id }}</div>
      </div>
      <div
        class="flex flex-row text-gray-200 font-mono text-sm px-2 py-1 border-t border-gray-200 justify-beteween content-center items-center"
        :style="scoreBG"
      >
        <div class="flex-shrink text-xs">Score</div>
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
    <div class="popupMenu flex flex-col overflow-hidden" ref="otherOptionsMenu">
      <div class="title">Operations</div>
      <div class="h-full overflow-auto">
        <div @click="mixWithCurrent">Mix With Current</div>
        <div @click="setA">Set Mix Element A</div>
        <div @click="setB">Set Mix Element B</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ACTION, MUTATION } from '../../store/constants';
import vClickOutside from 'v-click-outside';
import { placeMenu } from '../common';
const _ = require('lodash');

export default {
  name: 'exemplar',
  directives: {
    clickOutside: vClickOutside.directive
  },
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
    },
    scoreBG() {
      const minHue = this.$store.getters.hueMin;
      const maxHue = this.$store.getters.hueMax;
      const isGreyscale = minHue - maxHue === 0;
      const isRGB = typeof minHue !== 'number';
      let color = '#000000';

      // scale based on max/min and also on color range
      const normVal = Math.min(1, Math.max(0, this.data.y));

      if (isGreyscale) {
        color = `hsl(0, 0%, ${normVal * 50}%)`;
      } else if (isRGB) {
        color = `rgb(${(normVal * maxHue.r + (1 - normVal) * minHue.r) *
          0.5}, ${(normVal * maxHue.g + (1 - normVal) * minHue.g) *
          0.5}, ${(normVal * maxHue.b + (1 - normVal) * minHue.b) * 0.5})`;
      } else {
        const hueVal = normVal * (maxHue - minHue) + minHue;
        color = `hsl(${hueVal}, 100%, 25%)`;
      }

      return { background: color };
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
      this.hideMenus();
    },
    setB() {
      this.$store.commit(MUTATION.SET_MIX_B, this.data.x);
      this.hideMenus();
    },
    mixWithCurrent() {
      this.$store.commit(MUTATION.SET_MIX_A, this.$store.getters.paramsAsArray);
      this.$store.commit(MUTATION.SET_MIX_B, this.data.x);
      this.hideMenus();
    },
    hideMenus(event) {
      if (this.$refs.otherOptionsMenu.style.visibility === 'visible')
        this.$refs.otherOptionsMenu.style.visibility = 'hidden';
    },
    showOptMenu(event) {
      this.hideMenus();
      placeMenu(event, this.$refs.otherOptionsMenu, 5, -30);
      this.$refs.otherOptionsMenu.style.visibility = 'visible';
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

.id-label {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
