<template>
  <div class="main-canvas overflow-hidden">
    <canvas ref="canvas" class="renderCanvas"/>
  </div>
</template>

<script>
export default {
  name: 'main-render-canvas',
  data() {
    return {
      width: 0,
      height: 0
    };
  },
  computed: {
    params() {
      return this.$store.state.paramStore.parameters;
    }
  },
  watch: {
    params() {
      // todo: render settings from store
      this.$store.getters.renderer(this.$refs.canvas, {
        size: 'medium'
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
    height: 100%;
    object-fit: contain;
  }
}
</style>
