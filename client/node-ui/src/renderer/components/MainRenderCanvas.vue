<template>
  <div class="main-canvas overflow-hidden">
    <canvas id="mainRenderCanvas" class="renderCanvas"/>
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
      return this.$store.state.paramStore.lastCommittedVector;
    }
  },
  watch: {
    params() {
      // todo: render settings from store
      this.$store.getters.renderer(
        document.getElementById('mainRenderCanvas'),
        {
          size: 'medium',
          instanceID: 'mainCanvas',
          once: false
        }
      );
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
