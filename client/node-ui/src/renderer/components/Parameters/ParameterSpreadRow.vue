<template>
  <div class="w-full flex flex-row items-center p-1" :class="[activeBG]">
    <div class="w-1/5 flex flex-col items-center">
      <div
        class="w-full h-full px-2 text-gray-200 font-bold text-md font-mono tracking-wide text-center py-3 break-all"
      >[{{id}}] {{ name }}</div>
      <div class="green square-button uppercase tracking-wide" @click="toggleActive">Select</div>
    </div>
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
import { MUTATION } from '../../store/constants';

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
    },
    activeBG() {
      return this.active ? 'bg-gray-700' : '';
    }
  },
  methods: {
    toggleActive() {
      this.$store.commit(MUTATION.CHANGE_PARAM_ACTIVE, {
        id: this.id,
        active: !this.active
      });
    }
  }
};
</script>