<template>
  <div class="flex-none h-64 font-sans relative">
    <div class="h-auto flex flex-wrap flex-row mb-4">
      <label
        class="block uppercase tracking-wide text-grey-lighter text-xs font-bold m-2"
        for="current-snippet"
      >Current Snippet</label>
      <div class="w-full m-2 relative">
        <select
          class="text-sm font-mono p-1 w-full bg-gray-800 text-grey-light cursor-pointer"
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
      </div>
      <div
        class="w-full block uppercase tracking-wide text-grey-lighter text-xs font-bold m-2"
      >Actions</div>
      <div class="w-full ml-2 flex text-sm flex-wrap flex-row">
        <div class="w-1/4 pr-2">
          <div class="btn btn-green" @click="showNewModal()">New</div>
        </div>
        <div class="w-1/4 pr-2">
          <div class="btn btn-blue" @click="showCopyModal()">Copy</div>
        </div>
        <div class="w-1/4 pr-2">
          <div class="btn btn-blue" @click="showRenameModal()">Rename</div>
        </div>
        <div class="w-1/4 pr-2">
          <div class="btn btn-red w-full" @click="deleteSnippet()">Delete</div>
        </div>
        <div class="w-1/4 pr-2">
          <div class="btn btn-blue w-full" @click="addExample(1)">Add +</div>
        </div>
        <div class="w-1/4 pr-2">
          <div class="btn btn-blue w-full" @click="addExample(-1)">Add -</div>
        </div>
        <div class="w-1/4 pr-2">
          <div
            class="btn btn-blue"
            :class="{ disabled: isTraining }"
            @click="train()"
          >{{ isTraining ? 'Training...' : 'Train' }}</div>
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
        >
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
        >
        <div class="flex-no-shrink btn btn-green mr-2" @click="copySnippet()">Copy</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals()">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-lightest border border-red-light text-red-dark py-3 px-4 rounded"
        v-show="newSnippetError"
      >A Snippet with this name already exists</div>
    </div>
    <div class="copy-modal snippet-panel-modal" v-show="showRename">
      <div class="title">Rename Snippet</div>
      <div class="w-full flex flex-row items-center border-b border-b-2 border-green">
        <input
          v-model="newSnippetName"
          placeholder="Rename Snippet"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
          type="text"
        >
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
    showCopyModal() {
      if (this.activeSnippet === '') {
        // cannot copy without active snippet, unsure where to show message for this
        return;
      }

      this.showCopy = true;
      this.showNew = false;
      this.showRename = false;
    },
    showRenameModal() {
      if (this.activeSnippet === '') {
        // cannot rename without active snippet, unsure where to show message for this
        return;
      }

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
        active: this.activeSnippet,
        copyTo: this.newSnippetName
      });
      this.showCopy = false;
      this.newSnippetName = '';
      this.newSnippetError = false;
    },
    renameSnippet() {
      if (this.newSnippetName in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.RENAME_SNIPPET, {
        active: this.activeSnippet,
        renameTo: this.newSnippetName
      });
      this.showRename = false;
      this.newSnippetName = '';
      this.newSnippetError = false;
    },
    deleteSnippet() {
      if (this.activeSnippet !== '') {
        this.$store.dispatch(ACTION.DELETE_SNIPPET, {
          name: this.activeSnippet
        });
        this.activeSnippet = '';
      }
    },
    addExample(y) {
      // check active
      if (this.activeSnippet !== '') {
        // snapshot current state
        const x = this.$store.getters.paramsAsArray;

        this.$store.dispatch(ACTION.ADD_EXAMPLE, {
          name: this.activeSnippet,
          point: { x, y }
        });
      }
    },
    train() {
      if (this.activeSnippet !== '' && !this.isTraining && this.trained) {
        this.$store.dispatch(ACTION.LOAD_SNIPPET, this.activeSnippet);
      } else if (this.activeSnippet !== '' && !this.isTraining) {
        this.$store.dispatch(ACTION.TRAIN, this.activeSnippet);
      }
    }
  }
};
</script>

<style lang="scss">
.snippet-panel-modal {
  background-color: rgba(0, 0, 0, 0.9);
}
</style>
