<template>
  <div class="w-full flex flex-row items-center">
    <div class="w-1/5 px-2 text-gray-200 font-bold text-md font-mono tracking-wide">{{ name }}</div>
    <spread-sample
      v-for="item in spread"
      :key="item.label"
      :x="item.x"
      :id="id"
      :label="item.label"
      class="w-1/5"
    ></spread-sample>
  </div>
</template>

<script>
import SpreadSample from '../Samples/SpeadSample';

export default {
  name: 'parameter-spread-row',
  components: {
    SpreadSample
  },
  props: ['x0', 'count', 'id'],
  computed: {
    param() {
      return this.$store.getters.param(this.id);
    },
    name() {
      return this.param.name;
    },
    active() {
      return this.param.active;
    },
    spread() {
      const data = [];
      for (let i = 0; i < this.count; i++) {
        const alpha = i / (this.count - 1);
        const x = this.x0.slice(0);
        x[this.id] = this.param.min * (1 - alpha) + this.param.max * alpha;
        data.push({
          x,
          label: x[this.id].toFixed(2)
        });
      }

      return data;
    }
  }
};
</script>