<template>
  <div class="main-canvas">
    <canvas ref="canvas" class="renderCanvas"/>
  </div>
</template>

<script>
export default {
  name: 'main-render-canvas',
  computed: {
    params() {
      return this.$store.state.paramStore.parameters;
    }
  },
  watch: {
    params() {
      this.$store.getters.renderer(this.$refs.canvas, {
        size: 'full'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.main-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  canvas {
    width: 100%;
    height: auto;
  }
}
</style>
