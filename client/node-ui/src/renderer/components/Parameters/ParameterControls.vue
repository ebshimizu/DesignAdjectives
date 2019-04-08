<template>
  <div
    class="h-full w-full flex flex-col border-l border-grey-lightest text-grey-lightest overflow-hidden"
  >
    <div
      class="w-full h-10 flex-no-shrink font-sans text-center flex items-center justify-center text-lg border-b border-r border-grey-lightest"
    >Parameter List</div>
    <div class="overflow-auto flex flex-grow flex-col-reverse flex-shrink">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
    <div class="overflow-auto flex-no-shrink">
      <snippets-panel></snippets-panel>
    </div>
  </div>
</template>

<script>
import ParameterControl from './ParameterControl';
import SnippetsPanel from '../Snippets/SnippetsPanel';

export default {
  name: 'parameter-controls',
  components: {
    ParameterControl,
    SnippetsPanel
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

