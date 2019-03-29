<template>
  <div class="param-list">
    <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
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

