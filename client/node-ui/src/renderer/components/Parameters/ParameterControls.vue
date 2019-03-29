<template>
  <div
    class="h-full w-full flex flex-col border-l border-grey-lightest text-grey-lightest overflow-hidden"
  >
    <div
      class="w-full h-10 flex-no-shrink font-sans text-center flex items-center justify-center text-lg border-b border-grey-lightest"
    >Parameter List</div>
    <div class="overflow-auto">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
  </div>
</template>

<script>
import ParameterControl from './ParameterControl';

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

