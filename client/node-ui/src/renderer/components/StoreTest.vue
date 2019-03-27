<template>
  <div id="test-area">
    <button @click="loadTestFile()">Load Test File</button>
    <ul id="param-list">
      <li v-for="param in parameters" :key="param.id">{{ param.name }}: {{ param.value }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'store-test',
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
</style>
