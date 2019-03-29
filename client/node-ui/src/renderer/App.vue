<template>
  <div id="app" class="bg-black">
    <store-test></store-test>
    <div class="h-screen w-1/4 absolute pin-r pin-t overflow-hidden">
      <parameter-panel></parameter-panel>
    </div>
  </div>
</template>

<script>
import StoreTest from '@/components/StoreTest';
import ParameterPanel from '@/components/Parameters/ParameterPanel';
import '@/assets/tailwind.css';

export default {
  name: 'snippets-ui',
  components: { StoreTest, ParameterPanel }
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
}
</style>
