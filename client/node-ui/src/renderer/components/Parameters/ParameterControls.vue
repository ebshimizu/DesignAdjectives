<template>
  <div
    class="h-full w-full flex flex-col border-l border-gray-200 text-gray-200 overflow-hidden relative"
  >
    <div class="param-controls overflow-auto flex flex-col-reverse">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
    <div class="param-panel overflow-auto flex-no-shrink border-t border-gray-200">
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
.param-panel {
  height: 25vh;
}

.param-controls {
  height: 75vh;
}
</style>

