<template>
  <div id="app">
    <store-test></store-test>
    <parameter-controls></parameter-controls>
  </div>
</template>

<script>
import StoreTest from '@/components/StoreTest';
import ParameterControls from '@/components/ParameterControls';

export default {
  name: 'snippets-ui',
  components: { StoreTest, ParameterControls }
};
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/colors';

#app {
  width: 100vw;
  height: 100vh;
  background-color: $bg-color;
  margin: 0;
  padding: 0;
  left: 0;
  top: 0;
  position: absolute;
}
</style>
