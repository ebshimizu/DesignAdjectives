<template>
  <div id="app">
    <store-test></store-test>
  </div>
</template>

<script>
import StoreTest from '@/components/StoreTest';
export default { name: 'snippets-ui', components: { StoreTest } };
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
