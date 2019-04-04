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
        step="0.001"
      >
      <input
        class="w-1/6 mx-2 rounded-sm p-1 text-sm text-grey-light bg-grey-darkest"
        type="number"
        v-model="localVal"
        v-on:change="commitChange"
        v-bind:max="param.max"
        v-bind:min="param.min"
        step="0.001"
      >
    </div>
  </div>
</template>

<script>
// input styles from http://danielstern.ca/range.css/#/

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
input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  margin: 3.55px 0;
}
input[type='range']:focus {
  outline: none;
}
input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 25.9px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  background: rgba(27, 28, 29, 0.81);
  border-radius: 1.3px;
  border: 0.2px solid #0b0101;
}
input[type='range']::-webkit-slider-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 33px;
  width: 8px;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -3.75px;
}
input[type='range']:focus::-webkit-slider-runnable-track {
  background: rgba(39, 41, 42, 0.81);
}
input[type='range']::-moz-range-track {
  width: 100%;
  height: 25.9px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  background: rgba(27, 28, 29, 0.81);
  border-radius: 1.3px;
  border: 0.2px solid #0b0101;
}
input[type='range']::-moz-range-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 33px;
  width: 8px;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}
input[type='range']::-ms-track {
  width: 100%;
  height: 25.9px;
  cursor: pointer;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type='range']::-ms-fill-lower {
  background: rgba(15, 15, 16, 0.81);
  border: 0.2px solid #0b0101;
  border-radius: 2.6px;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
}
input[type='range']::-ms-fill-upper {
  background: rgba(27, 28, 29, 0.81);
  border: 0.2px solid #0b0101;
  border-radius: 2.6px;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
}
input[type='range']::-ms-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 33px;
  width: 8px;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  height: 25.9px;
}
input[type='range']:focus::-ms-fill-lower {
  background: rgba(27, 28, 29, 0.81);
}
input[type='range']:focus::-ms-fill-upper {
  background: rgba(39, 41, 42, 0.81);
}
</style>
