<template>
  <div class="text-gray-200 font-mono font-sm w-full border-b border-gray-200 p-1 h-24">
    <div class="flex">
      <div class="label w-full text-xs p-1 cursor-pointer hover:text-yellow-500">{{ param.name }}</div>
      <div class="text-xs p-1 bg-red-900 hover:bg-red-700 w-16 text-center cursor-pointer">Lock</div>
    </div>
    <div class="flex my-1">
      <input
        class="w-5/6 mx-2"
        type="range"
        v-model="localVal"
        v-bind:max="param.max"
        v-bind:min="param.min"
        v-on:change="commitChange"
        v-bind:style="sliderGoodnessStyle"
        step="0.001"
      >
      <input
        class="w-1/6 mx-2 rounded-sm p-1 text-sm text-grey-light bg-gray-800"
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
import { MUTATION, ACTION } from '../../store/constants';

export default {
  name: 'parameter-control',
  props: ['param'],
  computed: {
    localVal: {
      get() {
        return this.param.value;
      },
      set(value) {
        this.$store.commit(MUTATION.SET_PARAM, {
          id: this.param.id,
          val: parseFloat(value)
        });
      }
    },
    sliderGoodnessStyle() {
      // if an entry exists in the param data
      if (this.param.id in this.$store.getters.paramData) {
        const vals = this.$store.getters.paramData[this.param.id].mean;
        const min = this.$store.getters.paramData.meanMin;
        const max = this.$store.getters.paramData.meanMax;
        const minHue = this.$store.getters.hueMin;
        const maxHue = this.$store.getters.hueMax;
        let grad = 'linear-gradient(to right';
        const isGreyscale = minHue - maxHue === 0;
        const isRGB = typeof minHue !== 'number';

        // scale based on max/min and also on color range
        for (let i = 0; i < vals.length; i++) {
          const normVal = (vals[i] - min) / (max - min);

          if (isGreyscale) {
            grad = `${grad}, hsl(0, 0%, ${normVal * 100}%)`;
          } else if (isRGB) {
            grad = `${grad}, rgb(${normVal * maxHue.r +
              (1 - normVal) * minHue.r}, ${normVal * maxHue.g +
              (1 - normVal) * minHue.g}, ${normVal * maxHue.b +
              (1 - normVal) * minHue.b})`;
          } else {
            const hueVal = normVal * (maxHue - minHue) + minHue;
            grad = `${grad}, hsl(${hueVal}, 100%, 50%)`;
          }
        }

        grad = grad + ')';
        return { background: grad };
      }

      return { background: 'rgba(27, 28, 29, 0.81)' };
    }
  },
  methods: {
    commitChange() {
      this.$store.dispatch(ACTION.COMMIT_PARAMS);
    },
    displayExtents() {
      // show the extents tab for the currently selected paramter
    },
    lock() {
      // lock the parameter, updating relevant state and possibly re-training active snippets?
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
  box-shadow: 1px 1px 1px #757575, 0px 0px 1px #ffffff;
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
