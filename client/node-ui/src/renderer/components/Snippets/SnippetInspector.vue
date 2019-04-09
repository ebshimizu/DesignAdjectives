<template>
  <div class="flex flex-row w-full h-full">
    <exemplar
      v-for="(ex, idx) in localExemplarList"
      :key="activeSnippet + idx"
      v-bind:snippet-name="activeSnippet"
      v-bind:id="idx"
    ></exemplar>
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
    exemplarList() {
      if (this.activeSnippet in this.$store.state.snippets.snippets) {
        return this.$store.state.snippets.snippets[this.activeSnippet].data;
      } else {
        return [];
      }
    }
  },
  watch: {
    exemplarList: function(val) {
      this.localExemplarList = val;
    }
  }
};
</script>
