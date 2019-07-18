<template>
  <div
    class="snippet-panel h-full flex flex-col font-sans relative text-gray-200 border-l border-gray-200"
  >
    <div class="h-full flex flex-col mb-4">
      <label
        class="block uppercase tracking-wide text-grey-lighter text-xs font-bold m-2"
        for="current-snippet"
      >Active Axis</label>
      <div class="w-full flex flex-row mb-2 mx-2 relative">
        <select
          class="text-sm w-2/3 flex-grow font-mono p-1 w-full bg-gray-800 text-grey-light cursor-pointer"
          id="current-snippet"
          v-model="activeSnippet"
        >
          <option disabled value>Select a Snippet</option>
          <option
            v-for="option in snippetOptions"
            v-bind:value="option.name"
            v-bind:key="option.name"
          >{{ option.name }}</option>
        </select>
        <div
          class="w-1/6 ml-1 flex-shrink rounded axis-button bg-green-800 hover:bg-green-700 text-xs text-center cursor-pointer uppercase"
          @click="showNewModal()"
        >New</div>
      </div>
      <div
        class="w-full bg-gray-800 border-b border-t border-gray-200 py-2 font-bold text-gray-200 tracking-wide uppercase text-center text-sm"
      >Defined Axes</div>
      <div class="w-full h-full flex-shrink overflow-auto px-2">
        <div v-for="snippet in snippetOptions" :key="snippet.name">
          <div class="flex flex-wrap">
            <div class="w-1/3 font-mono text-sm">{{ snippet.name }}</div>
            <div class="w-1/6 blue axis-button">
              <div>Edit</div>
            </div>
            <div class="w-1/6 blue axis-button">
              <div @click="showRenameModal(snippet.name)">Rename</div>
            </div>
            <div class="w-1/6 blue axis-button">
              <div @click="showCopyModal(snippet.name)">Copy</div>
            </div>
            <div class="w-1/6 red axis-button">
              <div @click="deleteSnippet(snippet.name)">Delete</div>
            </div>
          </div>
        </div>
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
        class="w-full text-sm my-2 bg-red-lightest border border-red-light text-red-dark py-3 px-4 rounded"
        v-show="newSnippetError"
      >A Snippet with this name already exists</div>
    </div>
    <div class="copy-modal snippet-panel-modal" v-show="showCopy">
      <div class="title">Copy Snippet</div>
      <div class="w-full flex flex-row items-center border-b border-b-2 border-green">
        <input
          v-model="newSnippetName"
          placeholder="Enter Copied Snippet Name"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
          type="text"
        />
        <div class="flex-no-shrink btn btn-green mr-2" @click="copySnippet()">Copy</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals()">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-300 border border-red-400 text-red-800 py-3 px-4 rounded"
        v-show="newSnippetError"
      >An Axis with this name already exists</div>
    </div>
    <div class="copy-modal snippet-panel-modal" v-show="showRename">
      <div class="title">Rename Snippet</div>
      <div class="w-full flex flex-row items-center border-b border-b-2 border-green">
        <input
          v-model="newSnippetName"
          placeholder="Rename Snippet"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
          type="text"
        />
        <div class="flex-no-shrink btn btn-green mr-2" @click="renameSnippet()">Rename</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals()">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-lightest border border-red-light text-red-dark py-3 px-4 rounded"
        v-show="newSnippetError"
      >A Snippet with this name already exists</div>
    </div>
  </div>
</template>

<script>
import { ACTION } from '../../store/constants';

export default {
  name: 'snippets-panel',
  data: function() {
    return {
      showNew: false,
      showCopy: false,
      showRename: false,
      newSnippetError: false,
      modalSnippetTarget: '',
      newSnippetName: ''
    };
  },
  computed: {
    snippetOptions() {
      return this.$store.state.snippets.snippets;
    },
    activeSnippet: {
      get() {
        return this.$store.state.snippets.activeSnippet
          ? this.$store.state.snippets.activeSnippet.name
          : '';
      },
      set(newVal) {
        this.$store.dispatch(ACTION.SET_ACTIVE_SNIPPET, newVal);
      }
    },
    isTraining() {
      return this.$store.getters.training;
    },
    trained() {
      return this.activeSnippet !== ''
        ? this.$store.state.snippets.activeSnippet.trained
        : false;
    }
  },
  methods: {
    showNewModal() {
      this.showNew = true;
      this.showCopy = false;
      this.showRename = false;
    },
    hideAllModals() {
      this.showNew = false;
      this.showCopy = false;
      this.showRename = false;
    },
    showCopyModal(prefillName = null) {
      if (!prefillName) {
        // cannot copy without specified snippet, unsure where to show message for this
        return;
      }

      this.newSnippetName = prefillName;
      this.modalSnippetTarget = prefillName;

      this.showCopy = true;
      this.showNew = false;
      this.showRename = false;
    },
    showRenameModal(prefillName) {
      if (!prefillName) {
        // cannot rename without active snippet, unsure where to show message for this
        return;
      }

      this.newSnippetName = prefillName;
      this.modalSnippetTarget = prefillName;

      this.showRename = true;
      this.showNew = false;
      this.showCopy = false;
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
    },
    copySnippet() {
      if (this.newSnippetName in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.COPY_SNIPPET, {
        active: this.modalSnippetTarget,
        copyTo: this.newSnippetName
      });

      this.showCopy = false;
      this.newSnippetName = '';
      this.modalSnippetTarget = '';
      this.newSnippetError = false;
    },
    renameSnippet() {
      if (this.newSnippetName in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.RENAME_SNIPPET, {
        active: this.modalSnippetTarget,
        renameTo: this.newSnippetName
      });
      this.showRename = false;
      this.newSnippetName = '';
      this.newSnippetError = false;
    },
    deleteSnippet(name) {
      this.$store.dispatch(ACTION.DELETE_SNIPPET, {
        name
      });
      this.activeSnippet = '';
    }
  }
};
</script>

<style lang="scss">
.snippet-panel-modal {
  background-color: rgba(0, 0, 0, 0.9);
}
</style>
