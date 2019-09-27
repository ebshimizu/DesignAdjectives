<template>
  <div class="flex flex-col">
    <div class="flex w-full">
      <div class="w-1/2 font-mono text-sm">{{ name }}</div>
      <div class="w-1/6 blue axis-button">
        <div @click="showRenameModal">Rename</div>
      </div>
      <div class="w-1/6 blue axis-button">
        <div @click="showCopyModal">Copy</div>
      </div>
      <div class="w-1/6 red axis-button">
        <div @click="deleteSnippet">Delete</div>
      </div>
    </div>
    <div class="slider-modal p-2 my-1" v-if="copyModalVisible">
      <div class="title font-bold tracking-wide">Copy {{ name }}</div>
      <div class="w-full flex flex-row items-center border-green">
        <input
          v-model="modalTextInput"
          placeholder="Enter Axis Name"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:border-b"
          type="text"
        />
        <div class="flex-no-shrink btn btn-green mr-2" @click="copySnippet">Copy</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-300 border border-red-400 text-red-800 py-3 px-4 rounded"
        v-if="newSnippetError"
      >An Axis with this name already exists</div>
    </div>
    <div class="slider-modal p-2 my-1" v-if="renameModalVisible">
      <div class="title font-bold tracking-wide">Rename {{ name }}</div>
      <div class="w-full flex flex-row items-center border-green">
        <input
          v-model="modalTextInput"
          placeholder="Enter New Axis Name"
          class="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:border-b"
          type="text"
        />
        <div class="flex-no-shrink btn btn-green mr-2" @click="renameSnippet">Rename</div>
        <div class="flex-no-shrink btn hover:bg-red-900" @click="hideAllModals">Cancel</div>
      </div>
      <div
        class="w-full text-sm my-2 bg-red-300 border border-red-400 text-red-800 py-3 px-4 rounded"
        v-if="newSnippetError"
      >An Axis with this name already exists</div>
    </div>
  </div>
</template>

<script>
import { ACTION } from '../../store/constants';

export default {
  name: 'snippet-slider',
  props: ['name'],
  data() {
    return {
      modalTextInput: '',
      copyModalVisible: false,
      renameModalVisible: false,
      newSnippetError: false
    };
  },
  computed: {
    snippetOptions() {
      return this.$store.state.snippets.snippets;
    }
  },
  methods: {
    hideAllModals() {
      this.copyModalVisible = false;
      this.renameModalVisible = false;
      this.newSnippetError = false;
      this.modalTextInput = '';
    },
    showCopyModal() {
      this.hideAllModals();
      this.copyModalVisible = true;
    },
    showRenameModal() {
      this.hideAllModals();
      this.renameModalVisible = true;
    },
    deleteSnippet() {
      this.$store.dispatch(ACTION.DELETE_SNIPPET, {
        name: this.name
      });
    },
    copySnippet() {
      if (this.modalTextInput in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.COPY_SNIPPET, {
        active: this.name,
        copyTo: this.modalTextInput
      });

      this.hideAllModals();
    },
    renameSnippet() {
      if (this.modalTextInput in this.snippetOptions) {
        this.newSnippetError = true;
        return;
      }

      this.$store.dispatch(ACTION.RENAME_SNIPPET, {
        active: this.name,
        renameTo: this.modalTextInput
      });

      this.hideAllModals();
    }
  }
};
</script>

<style lang="scss" scoped>
.slider-modal {
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
}
</style>