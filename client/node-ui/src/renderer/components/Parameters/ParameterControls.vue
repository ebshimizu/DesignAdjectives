<template>
  <div
    class="h-full w-full flex flex-col border-l border-gray-200 text-gray-200 overflow-hidden relative"
  >
    <div class="param-controls overflow-auto flex flex-col-reverse">
      <parameter-control v-for="param in parameters" :key="param.id" v-bind:param="param"></parameter-control>
    </div>
    <div class="param-panel overflow-auto flex-no-shrink">
      <tabs>
        <tab title="Selection">
          <div class="flex flex-wrap p-1">
            <div class="w-full text-center uppercase text-sm font-bold mb-1">Selection Tools</div>
            <div class="selection-tool-button">
              <div @click="selectAll()">All</div>
            </div>
            <div class="selection-tool-button">
              <div @click="selectNone()">None</div>
            </div>
            <div class="wide selection-tool-button">
              <div @click="toggleHideInactive()">{{ hideInactiveText }}</div>
            </div>
            <div class="w-full text-center uppercase text-sm font-bold mb-1">Groups</div>
            <div class="w-5/6 pr-1">
              <select
                class="text-sm font-mono p-1 w-full bg-gray-800 text-grey-light cursor-pointer"
              >
                <option disabled value>Select a Group</option>
                <!-- todo: group list -->
              </select>
            </div>
            <div class="w-1/6 selection-tool-button">
              <div>Load</div>
            </div>
            <div class="selection-tool-button">
              <div>New</div>
            </div>
            <div class="selection-tool-button">
              <div>Update</div>
            </div>
            <div class="selection-tool-button">
              <div>Delete</div>
            </div>
          </div>
        </tab>
        <tab title="Snippets">
          <snippets-panel></snippets-panel>
        </tab>
      </tabs>
    </div>
  </div>
</template>

<script>
import ParameterControl from './ParameterControl';
import SnippetsPanel from '../Snippets/SnippetsPanel';
import Tabs from '../Tabs/Tabs';
import Tab from '../Tabs/Tab';

import { MUTATION } from '../../store/constants';

export default {
  name: 'parameter-controls',
  components: {
    ParameterControl,
    SnippetsPanel,
    Tabs,
    Tab
  },
  computed: {
    parameters() {
      return this.$store.state.paramStore.parameters;
    },
    hideInactiveText() {
      if (this.$store.getters.hideNonActiveParams) return 'Show Inactive';
      else return 'Hide Inactive';
    }
  },
  methods: {
    selectAll() {
      this.$store.commit(MUTATION.SET_ALL_ACTIVE);
    },
    selectNone() {
      this.$store.commit(MUTATION.SET_NONE_ACTIVE);
    },
    toggleHideInactive() {
      this.$store.commit(
        MUTATION.SET_INACTIVE_VISIBILITY,
        !this.$store.getters.hideNonActiveParams
      );
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

