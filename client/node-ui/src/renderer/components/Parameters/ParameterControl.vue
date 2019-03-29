<template>
  <div class="text-grey-lightest font-mono font-sm w-full border-b border-grey-lightest p-2 h-16">
    <div class="label w-full text-xs">{{ param.name }}</div>
    <div class="flex my-1">
      <input
        class="w-5/6 mx-2"
        type="range"
        v-model="localVal"
        v-bind:max="param.max"
        v-bind:min="param.min"
        v-on:change="commitChange"
        step="0.01"
      >
      <input
        class="w-1/6 mx-2 rounded-sm p-1 text-sm text-grey-light bg-grey-darkest"
        type="number"
        v-model="localVal"
        v-on:change="commitChange"
        v-bind:max="param.max"
        v-bind:min="param.min"
        step="0.01"
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'parameter-control',
  props: ['param'],
  data: function() {
    return {
      localVal: this.param.value
    };
  },
  methods: {
    commitChange() {
      this.$store.dispatch('SET_PARAM', {
        id: this.param.id,
        val: parseFloat(this.localVal)
      });
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
