<template>
  <div id="test-area">
    <button @click="loadTestFile()">Load Test File</button>
    <div class="canvas-container">
      <main-render-canvas></main-render-canvas>
    </div>
  </div>
</template>

<script>
import MainRenderCanvas from './MainRenderCanvas';

export default {
  name: 'store-test',
  components: {
    MainRenderCanvas
  },
  methods: {
    loadTestFile() {}
  }
};
</script>

<style lang="scss" scoped>
#param-list {
  color: #ffffff;
}

.canvas-container {
  position: absolute;
  left: 400px;
  top: 0;
  width: 500px;
  height: 500px;
}
</style>
