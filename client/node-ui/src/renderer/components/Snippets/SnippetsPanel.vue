<template>
  <div
    class="snippet-panel h-full flex flex-col font-sans relative text-gray-200 border-l border-gray-200"
  >
    <div class="h-full flex flex-col mb-4">
      <div class="w-full flex flex-row p-2 relative">
        <div
          class="w-full flex-shrink rounded p-1 bg-green-800 hover:bg-green-700 text-xs text-center cursor-pointer uppercase"
          @click="showNewModal()"
        >New</div>
      </div>
      <div
        class="w-full bg-gray-800 border-b border-t border-gray-200 py-2 font-bold text-gray-200 tracking-wide uppercase text-center text-sm"
      >Defined Axes</div>
      <div class="w-full h-full flex-shrink overflow-auto px-2">
        <snippet-slider v-for="snippet in snippetOptions" :key="snippet.name" :name="snippet.name" />
      </div>
    </div>
    <div class="new-modal snippet-panel-modal" v-show="showNew">
      <div class="title">Create New Snippet</div>
      <div class="w-full flex flex-row items-center border-b border-b-2 border-green">
        <input
          v-model="newSnippetName"
          placeholder="Enter Snippet Name"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
          type="text"
        />
        <div class="flex-no-shrink btn btn-green mr-2" @click="createNewSnippet()">Create</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals()">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-200 border border-red-300 text-red-800 py-3 px-4 rounded"
        v-show="newSnippetError"
      >A Snippet with this name already exists</div>
    </div>
  </div>
</template>

<script>
import { ACTION } from '../../store/constants';
import SnippetSlider from './SnippetSlider';

export default {
  name: 'snippets-panel',
  components: {
    SnippetSlider
  },
  data: function() {
    return {
      showNew: false,
      newSnippetError: false,
      modalSnippetTarget: '',
      newSnippetName: ''
    };
  },
  computed: {
    snippetOptions() {
      return this.$store.state.snippets.snippets;
    },
    isTraining() {
      return this.$store.getters.training;
    }
  },
  methods: {
    showNewModal() {
      this.showNew = true;
    },
    hideAllModals() {
      this.showNew = false;
    },
    createNewSnippet() {
      // check that snippet doesn't already exist
      if (this.newSnippetName in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.NEW_SNIPPET, { name: this.newSnippetName });

      this.showNew = false;
      this.newSnippetName = '';
      this.newSnippetError = false;
    }
  }
};
</script>

<style lang="scss">
.snippet-panel-modal {
  background-color: rgba(0, 0, 0, 0.9);
}
</style>
