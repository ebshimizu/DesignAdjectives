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
            @click="showPosSnippetMenu"
            class="cursor-pointer font-bold flex-grow bg-green-900 hover:bg-green-700 px-2 py-1 border-r text-gray-200"
          >
            <font-awesome-icon icon="plus-square"></font-awesome-icon>
          </div>
          <div
            @click="showNegSnippetMenu"
            class="cursor-pointer font-bold flex-grow bg-red-900 hover:bg-red-700 px-2 py-1 text-gray-200"
          >
            <font-awesome-icon icon="minus-square"></font-awesome-icon>
          </div>
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
    <div class="popupMenu flex flex-col overflow-hidden" ref="otherOptionsMenu">
      <div class="title">Operations</div>
      <div class="h-full overflow-auto">
        <div @click="select">Set As Current</div>
        <div @click="mixWithCurrent">Mix With Current</div>
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
// keyboard shortcuts
// z = add positive
// x = add negative

function placeMenu(
  event,
  elem,
  xOffset = 0,
  yOffset = 0,
  xWindowPad = 20,
  yWindowPad = 70
) {
  // determine x/y placement
  let xTarget = event.x + xOffset;
  let yTarget = event.y + yOffset;

  // check that can fit in window
  if (xTarget + elem.offsetWidth + xWindowPad > window.innerWidth) {
    xTarget = window.innerWidth - elem.offsetWidth - xWindowPad;
  }
  if (yTarget + elem.offsetHeight + yWindowPad > window.innerHeight) {
    yTarget = window.innerHeight - elem.offsetHeight - yWindowPad;
  }

  elem.style.left = `${xTarget}px`;
  elem.style.top = `${yTarget}px`;
}

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
    },
    snippetOptions() {
      return Object.keys(this.$store.state.snippets.snippets);
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
        point: { x: this.x, y: 1 }
      });
      this.hideMenus();
    },
    addNegative(snippet) {
      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: snippet,
        point: { x: this.x, y: 0 }
      });
      this.hideMenus();
    },
    mixWithCurrent() {
      this.$store.commit(MUTATION.SET_MIX_A, this.$store.getters.paramsAsArray);
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
</style>
