<template>
  <div class="flex flex-col h-full w-full overflow-hidden border-l border-gray-200">
    <div class="w-full flex flex-row border-b border-gray-200">
      <div
        class="w-1/3 p-2 text-xs uppercase text-gray-200 flex items-center content-center font-bold tracking-wide"
      >Add Active</div>
      <div class="w-full p-2">
        <select
          class="w-full border-2 border-gray-800 cursor-pointer bg-gray-700 text-gray-200"
          v-model="selectedSnippet"
          v-on:change="activate(selectedSnippet)"
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
import { MUTATION } from '../../store/constants';
// import { ACTION } from '../../store/constants';

export default {
  name: 'snippet-widget-panel',
  components: {
    SnippetWidget
  },
  data() {
    return {
      selectedSnippet: ''
    };
  },
  computed: {
    activeWidgets() {
      return this.$store.getters.activatedSnippets;
    },
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
      this.$store.commit(MUTATION.ACTIVATE_SNIPPET, name);
    },
    deactivate(name) {
      this.$store.commit(MUTATION.DEACTIVATE_SNIPPET, name);
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
</style>
