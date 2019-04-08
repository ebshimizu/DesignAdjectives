<template>
  <div id="app" class="bg-black flex flex-col">
    <div class="flex-none w-full border-b border-grey-lightest bg-grey-darkest shadow">
      <main-menu></main-menu>
    </div>
    <div class="relative h-full flex-shrink flex-no-grow main-content flex flex-row">
      <div class="h-full w-3/4 overflow-hidden">
        <main-render-canvas></main-render-canvas>
      </div>
      <div class="h-full w-1/4 flex-none overflow-hidden">
        <parameter-panel></parameter-panel>
      </div>
    </div>
    <div class="flex-none w-full h-6 border-t border-grey-lightest bg-grey-darkest">
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
import '@/assets/tailwind.css';

export default {
  name: 'snippets-ui',
  components: {
    StoreTest,
    ParameterPanel,
    MainMenu,
    MainRenderCanvas,
    StatusBar
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
</style>
