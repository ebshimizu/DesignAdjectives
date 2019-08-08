<template>
  <div class="flex flex-col h-full w-full overflow-hidden border-l border-gray-200">
    <div class="w-full flex flex-row border-b border-gray-200">
      <div class="w-3/4 p-2">
        <select
          class="w-full border-2 border-gray-800 cursor-pointer bg-gray-700 text-gray-200"
          v-model="selectedSnippet"
        >
          <option disabled value>[No Option Selected]</option>
          <option
            v-for="option in snippetOptions"
            v-bind:value="option"
            v-bind:key="option"
            class="text-gray-200"
          >{{ option }}</option>
        </select>
      </div>
      <div class="w-1/4 h-full">
        <div
          class="h-full flex justify-center items-center p-2 text-gray-200 cursor-pointer bg-green-800 hover:bg-green-700"
          @click="activate(selectedSnippet)"
        >
          <div class="text-sm uppercase tracking-wide font-bold">Activate</div>
        </div>
      </div>
    </div>
    <div class="h-full overflow-auto">
      <snippet-widget
        v-for="item in activeWidgetObjects"
        :key="item.name"
        :name="item.name"
        :exemplars="item.data"
        v-on:deactivate="deactivate(item.name)"
        class="panel-widget"
      />
    </div>
  </div>
</template>

<script>
import SnippetWidget from './SnippetWidget';
// import { ACTION } from '../../store/constants';

export default {
  name: 'snippet-widget-panel',
  components: {
    SnippetWidget
  },
  data() {
    return {
      activeWidgets: [],
      selectedSnippet: ''
    };
  },
  computed: {
    activeWidgetObjects() {
      const activeObj = [];
      for (const id of this.activeWidgets) {
        activeObj.push(this.$store.state.snippets.snippets[id]);
      }

      return activeObj;
    },
    snippetOptions() {
      return Object.keys(this.$store.state.snippets.snippets);
    }
  },
  methods: {
    activate(name) {
      if (this.activeWidgets.indexOf(name) === -1)
        this.activeWidgets.push(name);
    },
    deactivate(name) {
      const idx = this.activeWidgets.indexOf(name);
      if (idx > -1) {
        this.activeWidgets.splice(idx, 1);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.debug-info {
  height: 10vw;
}

.half-height {
  height: 50%;
}

.panel-widget {
  height: 500px;
}
</style>
