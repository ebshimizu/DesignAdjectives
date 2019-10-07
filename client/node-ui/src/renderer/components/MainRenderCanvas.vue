<template>
  <div class="main-canvas overflow-hidden">
    <div v-show="renderCanvas" class="w-full h-full">
      <canvas id="mainRenderCanvas" class="renderCanvas" />
    </div>
    <div class="text-container" ref="textContainer" v-show="!renderCanvas">{{ renderText }}</div>
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
    },
    identifier() {
      // read-only
      return 'mainRenderCanvas';
    },
    renderText() {
      // placeholder for now
      return 'Lorem Ipsum';
    },
    renderCanvas() {
      return this.$store.getters.renderCanvas;
    }
  },
  watch: {
    params() {
      // todo: render settings from store
      this.$store.getters.renderer(
        document.getElementById('mainRenderCanvas'),
        this.$refs.textContainer,
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
