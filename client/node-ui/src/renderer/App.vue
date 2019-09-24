<template>
  <div id="app" class="bg-gray-900 flex flex-col">
    <div class="flex-none w-full border-b border-gray-200 bg-gray-700 shadow">
      <main-menu v-on:show-param-spread="showParamSpread"></main-menu>
    </div>
    <div class="relative h-full flex-shrink flex-no-grow main-content flex flex-row">
      <div class="h-full w-3/4 overflow-hidden flex flex-col">
        <div class="flex-1 h-1 w-full">
          <main-render-canvas></main-render-canvas>
        </div>
        <div class="sampler-panel w-full flex-no-shrink">
          <tabs>
            <tab title="Sampler">
              <sampler-panel></sampler-panel>
            </tab>
            <tab title="Mix">
              <mix-panel />
            </tab>
            <tab title="Axis Mixer">
              <axis-mixer />
            </tab>
            <tab title="Debug">
              <debug-panel></debug-panel>
            </tab>
          </tabs>
        </div>
      </div>
      <div class="h-full w-1/5 flex-none overflow-hidden">
        <snippet-widget-panel v-show="!this.$store.getters.extentsVisible" />
        <parameter-extents v-show="this.$store.getters.extentsVisible" />
      </div>
      <div class="h-full w-1/5 flex-none overflow-hidden">
        <parameter-panel></parameter-panel>
      </div>
      <parameter-spread v-if="paramSpreadVisible" v-on:hide-param-spread="hideParamSpread"></parameter-spread>
    </div>
    <div class="flex-none w-full h-6 border-t border-gray-200 bg-gray-900">
      <status-bar></status-bar>
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
import SnippetWidgetPanel from '@/components/Snippets/SnippetWidgetPanel';
import SamplerPanel from '@/components/Samples/SamplerPanel';
import DebugPanel from '@/components/Snippets/DebugPanel';
import ParameterExtents from '@/components/Parameters/ParameterExtents';
import MixPanel from '@/components/Snippets/MixPanel';
import AxisMixer from '@/components/Snippets/AxisMixer';
import ParameterSpread from '@/components/Parameters/ParameterSpread';

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
    SnippetWidgetPanel,
    SamplerPanel,
    DebugPanel,
    ParameterExtents,
    MixPanel,
    AxisMixer,
    ParameterSpread
  },
  data() {
    return {
      paramSpreadVisible: false
    };
  },
  mounted() {
    document.title = `Parameter Exploration Toolkit - v${this.$electron.remote.app.getVersion()}`;
    this.$store.commit(MUTATION.LOAD_SNIPPET_SETTINGS);
    this.$store.dispatch(ACTION.CONNECT);
  },
  methods: {
    showParamSpread() {
      this.$store.commit(
        MUTATION.SET_SPREAD_BASE,
        this.$store.getters.paramsAsArray
      );
      this.paramSpreadVisible = true;
    },
    hideParamSpread() {
      this.paramSpreadVisible = false;
    }
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
  height: 40%;
}

.param-extents-modal {
  right: 20%;
  height: calc(100% - 1.5rem - 32px);
  top: 32px;
  width: 400px;
}
</style>
