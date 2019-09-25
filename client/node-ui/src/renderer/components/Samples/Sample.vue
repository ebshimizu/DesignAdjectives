<template>
  <div v-bind:class="[widthClass, heightClass]" class="p-2" v-click-outside="hideMenus">
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
            @click="showOptMenu"
            class="cursor-pointer bg-blue-900 hover:bg-blue-600 px-2 py-1 flex-grow text-gray-200 border-r border-gray-200"
          >
            <font-awesome-icon icon="bars"></font-awesome-icon>
          </div>
          <div
            @click="select()"
            class="cursor-pointer bg-blue-900 hover:bg-blue-600 px-2 py-1 flex-grow text-gray-200 border-r border-gray-200"
          >
            <font-awesome-icon icon="clone"></font-awesome-icon>
          </div>
          <div
            @contextmenu.prevent="showPosSnippetMenu"
            @click="addPositive(primarySnippet)"
            class="cursor-pointer font-bold flex-grow bg-green-900 hover:bg-green-700 px-2 py-1 border-r text-gray-200"
          >
            <font-awesome-icon icon="plus-square"></font-awesome-icon>
          </div>
          <div
            @contextmenu.prevent="showNegSnippetMenu"
            @click="addNegative(primarySnippet)"
            class="cursor-pointer font-bold flex-grow bg-red-900 hover:bg-red-700 px-2 py-1 text-gray-200"
          >
            <font-awesome-icon icon="minus-square"></font-awesome-icon>
          </div>
        </div>
        <canvas ref="canvas" class="sampleCanvas" />
        <div
          class="absolute left-0 top-0 p-1 text-center font-mono text-xs z-10 text-gray-200 id-label rounded border-gray-200 border-r border-b"
        >{{ id }}</div>
      </div>
      <div
        class="flex flex-col text-gray-200 font-mono text-xs border-t border-gray-200 justify-between bg-blue-darkest"
      >
        <div class="w-full border-b px-1" :style="scoreBGGradient">Score: {{ score.toFixed(3) }}</div>
        <div class="w-full px-1" :style="confBGGradient">Conf: {{ confidence.toFixed(3) }}</div>
      </div>
    </div>
    <div class="popupMenu flex flex-col overflow-hidden" ref="otherOptionsMenu">
      <div class="title">Operations</div>
      <div class="h-full overflow-auto">
        <div @click="mixWithCurrent">Mix With Current</div>
        <div @click="setMixA">Set Mix Element A</div>
        <div @click="setMixB">Set Mix Element B</div>
      </div>
    </div>
    <div class="popupMenu flex flex-col overflow-hidden" ref="posSnippetMenu">
      <div class="title">Add Positive To</div>
      <div class="h-full overflow-auto">
        <div
          v-for="snippet in snippetOptions"
          :key="snippet"
          @click="addPositive(snippet)"
        >{{ snippet }}</div>
      </div>
    </div>
    <div class="popupMenu flex flex-col overflow-hidden" ref="negSnippetMenu">
      <div class="title">Add Negative To</div>
      <div class="h-full overflow-auto">
        <div
          v-for="snippet in snippetOptions"
          :key="snippet"
          @click="addNegative(snippet)"
        >{{ snippet }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ACTION, MUTATION } from '../../store/constants';
import vClickOutside from 'v-click-outside';
import { placeMenu } from '../common';
// keyboard shortcuts
// z = add positive
// x = add negative

export default {
  name: 'sample',
  directives: {
    clickOutside: vClickOutside.directive
  },
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
    confidence() {
      return Math.max(0, 1 - this.sample.cov);
    },
    scoreBGGradient() {
      const minHue = this.$store.getters.hueMin;
      const maxHue = this.$store.getters.hueMax;
      let grad = 'linear-gradient(to right';
      const isGreyscale = minHue - maxHue === 0;
      const isRGB = typeof minHue !== 'number';

      // scale based on max/min and also on color range
      const normVal = Math.min(1, Math.max(0, this.score));

      if (isGreyscale) {
        grad = `${grad}, hsl(0, 0%, ${normVal * 50}%)`;
      } else if (isRGB) {
        grad = `${grad}, rgb(${(normVal * maxHue.r + (1 - normVal) * minHue.r) *
          0.5}, ${(normVal * maxHue.g + (1 - normVal) * minHue.g) *
          0.5}, ${(normVal * maxHue.b + (1 - normVal) * minHue.b) * 0.5})`;
      } else {
        const hueVal = normVal * (maxHue - minHue) + minHue;
        grad = `${grad}, hsl(${hueVal}, 100%, 25%)`;
      }

      grad = `${grad} ${normVal * 100}%, rgba(0,0,0,1) ${normVal * 100}%)`;
      return { background: grad };
    },
    confBGGradient() {
      return {
        background: `linear-gradient(to right, #553c9a ${this.confidence *
          100}%, rgba(0,0,0,1) ${this.confidence * 100}%)`
      };
    },
    id() {
      return this.sample.idx;
    },
    x() {
      return this.sample.x;
    },
    affected() {
      return this.sample.affected || [];
    },
    widthClass() {
      if (this.width) return this.width;

      return 'w-48';
    },
    heightClass() {
      if (this.height) return this.height;

      return '';
    },
    snippetOptions() {
      return Object.keys(this.$store.state.snippets.snippets);
    },
    primarySnippet() {
      return this.$store.getters.primarySnippet;
    }
  },
  methods: {
    select() {
      // copy x to the current state
      this.$store.dispatch(ACTION.LOCK_TEMPORARY_STATE, this.x);
      this.hideMenus();
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
    addPositive(snippet) {
      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: snippet,
        point: { x: this.x, y: 1, affected: this.affected }
      });
      this.hideMenus();
    },
    addNegative(snippet) {
      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: snippet,
        point: { x: this.x, y: 0, affected: this.affected }
      });
      this.hideMenus();
    },
    mixWithCurrent() {
      this.$store.commit(MUTATION.SET_MIX_A, this.$store.getters.paramsAsArray);
      this.$store.commit(MUTATION.SET_MIX_B, this.x);
      this.hideMenus();
    },
    setMixA() {
      this.$store.commit(MUTATION.SET_MIX_A, this.x);
      this.hideMenus();
    },
    setMixB() {
      this.$store.commit(MUTATION.SET_MIX_B, this.x);
      this.hideMenus();
    },
    showPosSnippetMenu(event) {
      this.hideMenus();
      placeMenu(event, this.$refs.posSnippetMenu, 5, -30);
      this.$refs.posSnippetMenu.style.visibility = 'visible';
    },
    showNegSnippetMenu(event) {
      this.hideMenus();
      placeMenu(event, this.$refs.negSnippetMenu, 5, -30);
      this.$refs.negSnippetMenu.style.visibility = 'visible';
    },
    showOptMenu(event) {
      this.hideMenus();
      placeMenu(event, this.$refs.otherOptionsMenu, 5, -30);
      this.$refs.otherOptionsMenu.style.visibility = 'visible';
    },
    hideMenus(event) {
      if (this.$refs.posSnippetMenu.style.visibility === 'visible')
        this.$refs.posSnippetMenu.style.visibility = 'hidden';
      if (this.$refs.negSnippetMenu.style.visibility === 'visible')
        this.$refs.negSnippetMenu.style.visibility = 'hidden';
      if (this.$refs.otherOptionsMenu.style.visibility === 'visible')
        this.$refs.otherOptionsMenu.style.visibility = 'hidden';
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

.id-label {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
