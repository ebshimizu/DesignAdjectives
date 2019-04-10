<template>
  <div class="flex flex-row h-full w-full overflow-hidden">
    <div class="w-64 border-r border-grey-lightest font-sans overflow-auto text-grey-lightest">
      <div class="border-b border-blue-darkest bg-blue-lighter text-blue-dark px-2 py-1 text-sm">
        <div class="font-bold">{{ activeSnippet !== '' ? activeSnippet : '[No Active Snippet]' }}</div>
        <div class="my-1">{{ status }}</div>
      </div>
    </div>
    <div class="flex flex-row w-full h-full flex-wrap overflow-auto items-start">
      <exemplar
        v-for="(ex, idx) in localExemplarList"
        :key="activeSnippet + idx"
        v-bind:snippet-name="activeSnippet"
        v-bind:id="idx"
      ></exemplar>
    </div>
  </div>
</template>

<script>
import Exemplar from '../Samples/Exemplar';

export default {
  name: 'snippet-inspector',
  components: {
    Exemplar
  },
  data() {
    return {
      localExemplarList: []
    };
  },
  computed: {
    activeSnippet() {
      return this.$store.state.snippets.activeSnippet;
    },
    activeSnippetObject() {
      if (this.activeSnippet in this.$store.state.snippets.snippets) {
        return this.$store.state.snippets.snippets[this.activeSnippet];
      }

      return null;
    },
    exemplarList() {
      if (this.activeSnippetObject) {
        return this.activeSnippetObject.data;
      } else {
        return [];
      }
    },
    status() {
      if (this.activeSnippetObject) {
        return Object.keys(this.activeSnippetObject.trainData).length > 0
          ? 'Trained'
          : 'Not Trained';
      }
    },
    trainData() {
      const filtered = {};
      if (this.activeSnippetObject) {
        for (key of Object.keys(this.activeSnippetObject.trainData)) {
          if (key !== 'code' && key !== 'message') {
            filtered[key] = this.activeSnippetObject.trainData[key];
          }
        }
      }

      return filtered;
    }
  },
  watch: {
    exemplarList: function(val) {
      this.localExemplarList = val;
    }
  }
};
</script>
