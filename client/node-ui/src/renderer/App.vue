<template>
  <div id="app" class="bg-gray-900 flex flex-col">
    <div class="flex-none w-full border-b border-gray-200 bg-gray-700 shadow">
      <main-menu></main-menu>
    </div>
    <div class="relative h-full flex-shrink flex-no-grow main-content flex flex-row">
      <div class="h-full w-3/4 overflow-hidden flex flex-col">
        <div class="flex-1 h-1 w-full">
          <main-render-canvas></main-render-canvas>
        </div>
        <div class="sampler-panel w-full flex-no-shrink">
          <tabs>
            <tab title="Snippet Inspector">
              <snippet-inspector></snippet-inspector>
            </tab>
            <tab title="Sampler">
              <sampler-panel></sampler-panel>
            </tab>
            <tab title="Debug">
              <debug-panel></debug-panel>
            </tab>
          </tabs>
        </div>
      </div>
      <div class="h-full w-1/4 flex-none overflow-hidden">
        <parameter-panel></parameter-panel>
      </div>
    </div>
    <div class="flex-none w-full h-6 border-t border-gray-200 bg-gray-900">
      <status-bar></status-bar>
    </div>
    <div
      class="param-extents-modal overflow-auto w-48 h-full absolute z-10"
      v-show="this.$store.getters.extentsVisible"
    >
      <parameter-extents></parameter-extents>
    </div>
  </div>
</template>

<script>
import StoreTest from '@/components/StoreTest';
import ParameterPanel from '@/components/Parameters/ParameterPanel';
import MainMenu from '@/components/Menus/MainMenu';
import MainRenderCanvas from '@/components/MainRenderCanvas';
import StatusBar from '@/components/StatusBar';
import Tabs from '@/components/Tabs/Tabs';
import Tab from '@/components/Tabs/Tab';
import SnippetInspector from '@/components/Snippets/SnippetInspector';
import SamplerPanel from '@/components/Samples/SamplerPanel';
import DebugPanel from '@/components/Snippets/DebugPanel';
import ParameterExtents from '@/components/Parameters/ParameterExtents';

import '@/assets/tailwind.css';
import { MUTATION, ACTION } from '@/store/constants';

export default {
  name: 'snippets-ui',
  components: {
    StoreTest,
    ParameterPanel,
    MainMenu,
    MainRenderCanvas,
    StatusBar,
    Tab,
    Tabs,
    SnippetInspector,
    SamplerPanel,
    DebugPanel,
    ParameterExtents
  },
  mounted() {
    this.$store.commit(MUTATION.LOAD_SNIPPET_SETTINGS);
    this.$store.dispatch(ACTION.CONNECT);
  }
};
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/colors';

#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  left: 0;
  top: 0;
  position: absolute;
  overflow: hidden;
  z-index: -10;
}

.main-content {
  z-index: -5;
}

.sampler-panel {
  height: 35%;
}

.param-extents-modal {
  right: 25%;
  height: calc(100% - 1.5rem - 32px);
  top: 32px;
}
</style>
