<template>
  <div class="main-canvas overflow-hidden">
    <div v-show="renderCanvas" class="w-full h-full">
      <canvas id="mainRenderCanvas" class="renderCanvas" />
    </div>
    <div
      class="text-container text-gray-200 flex content-center items-center justify-center"
      ref="textContainer"
      :style="fontStyles"
      v-show="!renderCanvas"
    >{{ renderText }}</div>
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
      return 'mainCanvas';
    },
    renderText() {
      // placeholder for now
      return this.$store.getters.snippetSettings.fontPreviewPhrase.value;
    },
    renderCanvas() {
      return this.$store.getters.renderCanvas;
    },
    fontStyles() {
      const settings = this.$store.getters.snippetSettings;

      return {
        fontFamily: this.identifier,
        fontSize: settings.mainFontSize.value
      };
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
          instanceID: this.identifier,
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
