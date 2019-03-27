<template>
  <div id="test-area">
    <button @click="loadTestFile()">Load Test File</button>
    <button @click="paramSetTest()">Set Param 0 to 0.78</button>
    <ul id="param-list">
      <li v-for="param in parameters" :key="param.id">{{ param.name }}: {{ param.value }}</li>
    </ul>
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
    loadTestFile() {
      this.$store.dispatch('LOAD_NEW_FILE', {
        filename: 'shapes3.dark',
        dir:
          'C:/Users/Falindrith/Dropbox/Documents/research/sliders_project/test_images/shapes/'
      });
    },
    paramSetTest() {
      this.$store.dispatch('SET_PARAM', { id: 0, val: 0.78 });
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
</style>
