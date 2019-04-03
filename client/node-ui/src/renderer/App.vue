<template>
  <div id="app" class="bg-black">
    <main-menu></main-menu>
    <div class="main-content">
      <div class="h-full w-3/4 absolute pin-l pin-t overflow-hidden">
        <main-render-canvas></main-render-canvas>
      </div>
      <div class="h-full w-1/4 absolute pin-r pin-t overflow-hidden">
        <parameter-panel></parameter-panel>
      </div>
    </div>
  </div>
</template>

<script>
import StoreTest from '@/components/StoreTest';
import ParameterPanel from '@/components/Parameters/ParameterPanel';
import MainMenu from '@/components/Menus/MainMenu';
import MainRenderCanvas from '@/components/MainRenderCanvas';
import '@/assets/tailwind.css';

export default {
  name: 'snippets-ui',
  components: { StoreTest, ParameterPanel, MainMenu, MainRenderCanvas }
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
  margin-top: 2.2rem;
  height: calc(100vh - 2.2rem);
  position: relative;
  z-index: -5;
}
</style>
