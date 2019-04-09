<template>
  <div
    class="h-full w-full flex flex-col border-l border-grey-lightest text-grey-lightest overflow-hidden"
  >
    <div class="overflow-auto flex flex-grow flex-col-reverse flex-shrink">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
    <div class="overflow-auto flex-no-shrink border-t border-grey-lightest">
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

