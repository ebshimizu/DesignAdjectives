<template>
  <div id="test-area">
    <button @click="loadTestFile()">Load Test File</button>
    <ul id="param-list">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </ul>
    <div class="canvas-container">
      <main-render-canvas></main-render-canvas>
    </div>
  </div>
</template>

<script>
import MainRenderCanvas from './MainRenderCanvas';
import ParameterControl from './ParameterControls/ParameterControl';

export default {
  name: 'store-test',
  components: {
    MainRenderCanvas,
    ParameterControl
  },
  methods: {
    loadTestFile() {
      this.$store.dispatch('LOAD_NEW_FILE', {
        filename: 'shapes3.dark',
        dir:
          'C:/Users/Falindrith/Dropbox/Documents/research/sliders_project/test_images/shapes/'
      });
    }
  },
  computed: {
    parameters() {
      return this.$store.state.compositor.parameters;
    }
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
