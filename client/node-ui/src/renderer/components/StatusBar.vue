<template>
  <div class="flex h-full bg-black">
    <div class="flex flex-row h-full">
      <div class="rounded-full w-4 m-1" :class="[connectClass]"></div>
      <div class="rounded-full w-4 m-1" :class="[serverClass]"></div>
      <div
        class="flex justify-center items-center h-full font-mono text-gray-200 text-xs ml-1"
      >{{ serverStatus }}</div>
    </div>
    <div
      class="flex justify-end flex-grow items-center h-full font-mono text-gray-200 text-xs mx-1"
    >{{ snippetEvalText }}</div>
  </div>
</template>

<script>
export default {
  name: 'status-bar',
  computed: {
    connectClass() {
      return this.$store.state.snippets.connected
        ? 'connected'
        : 'disconnected';
    },
    serverClass() {
      return this.$store.state.snippets.serverOnline
        ? 'connected'
        : 'disconnected';
    },
    serverStatus() {
      if (this.$store.getters.ready) {
        return 'Snippet Server Online';
      } else if (
        this.$store.state.snippets.connected &&
        !this.$store.state.snippets.serverOnline
      ) {
        return 'Snippet Server Not Found';
      } else {
        return 'Server Disconnected';
      }
    },
    score() {
      return this.$store.state.snippets.activeSnippetScore;
    },
    snippetEvalText() {
      if (
        this.$store.getters.activeSnippetName &&
        this.$store.state.snippets.activeSnippet.trained
      ) {
        return `${
          this.$store.getters.activeSnippetName
        }: ${this.score.mean.toFixed(2)} (var: ${this.score.cov.toFixed(2)})`;
      } else {
        return '[Snippet Score Unavailable]';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.connected {
  background-color: #38c172;
}

.disconnected {
  background-color: #e3342f;
}
</style>
