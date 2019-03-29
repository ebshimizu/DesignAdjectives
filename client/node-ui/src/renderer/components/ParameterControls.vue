<template>
  <div class="param-list">
    <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    <button
      class="bg-blue hover:bg-blue-light text-white font-bold py-2 px-4 border-b-4 border-blue-dark hover:border-blue rounded"
    >Button</button>
  </div>
</template>

<script>
import ParameterControl from './ParameterControls/ParameterControl';

export default {
  name: 'parameter-controls',
  components: {
    ParameterControl
  },
  computed: {
    parameters() {
      return this.$store.state.paramStore.parameters;
    }
  }
};
</script>

<style lang="scss" scoped>
</style>

