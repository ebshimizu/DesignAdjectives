<template>
  <div class="exemplar overflow-hidden">
    <div>
      <canvas ref="canvas" class="exemplarCanvas"/>
    </div>
    <div>{{ score }}</div>
  </div>
</template>

<script>
export default {
  name: 'exemplar',
  data() {
    return {
      retrievalError: false
    };
  },
  props: ['snippetName', 'id'],
  computed: {
    data() {
      if (
        this.snippetName in this.$store.state.snippets.snippets &&
        this.id <
          this.$store.state.snippets.snippets[this.snippetName].data.length
      ) {
        this.retrievalError = false;
        const snippet = this.$store.state.snippets.snippets[this.snippetName];
        return snippet.data[this.id];
      } else {
        this.retrievalError = true;
        return { x: [], y: NaN };
      }
    },
    score() {
      return this.data.y;
    }
  },
  mounted: function() {
    if (!this.retrievalError) {
      this.$store.getters.renderer(this.$refs.canvas, {
        size: 'thumb',
        state: this.data.x
      });
    }
  }
};
</script>