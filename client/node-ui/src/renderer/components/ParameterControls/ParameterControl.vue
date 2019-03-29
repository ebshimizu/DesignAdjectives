<template>
  <div class="parameter-control">
    <div class="label">{{ param.name }}</div>
    <div class="slider">
      <input
        type="range"
        v-model="localVal"
        v-bind:max="param.max"
        v-bind:min="param.min"
        v-on:change="commitChange"
        step="0.01"
      >
    </div>
    <div class="text-input">
      <input
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
