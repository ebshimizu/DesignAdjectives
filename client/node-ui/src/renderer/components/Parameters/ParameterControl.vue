<template>
  <div
    class="text-gray-200 font-mono font-sm w-full border-b border-gray-200 p-1 h-24"
    :class="[activeClass]"
    v-show="showParam"
  >
    <div class="flex">
      <div
        class="label w-3/4 text-xs cursor-pointer hover:text-yellow-500"
        @click="displayExtents()"
      >{{ param.name }}</div>
      <div class="w-1/4 text-right text-xs">{{ lengthscale }}</div>
    </div>
    <div class="flex">
      <div
        class="flex justify-center items-center bg-green-900 hover:bg-green-700 w-16 mr-1 cursor-pointer"
        @click="toggleActive()"
      >
        <div class="text-xs">SEL</div>
      </div>
      <input
        class="w-5/6 mx-2"
        type="range"
        v-model="localVal"
        v-bind:max="param.max"
        v-bind:min="param.min"
        v-on:change="commitChange"
        v-bind:style="sliderGoodnessStyle"
        step="0.001"
      />
      <input
        class="w-1/6 mx-2 rounded-sm p-1 text-xs text-grey-light bg-gray-800"
        type="number"
        v-model="localVal"
        v-on:change="commitChange"
        v-bind:max="param.max"
        v-bind:min="param.min"
        step="0.001"
      />
    </div>
  </div>
</template>

<script>
// input styles from http://danielstern.ca/range.css/#/
import { MUTATION, ACTION, PARAM_COLOR_RANGE } from '../../store/constants';

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
    activeClass() {
      if (this.param.active) {
        return 'bg-gray-700';
      }

      return '';
    },
    showParam() {
      return !this.$store.getters.hideNonActiveParams || this.param.active;
    },
    sliderGoodnessStyle() {
      // if an entry exists in the param data
      if (this.param.id in this.$store.getters.paramData) {
        const abs =
          this.$store.getters.snippetSettings.paramColorRange.value ===
          PARAM_COLOR_RANGE.ABSOLUTE;
        const vals = this.$store.getters.paramData[this.param.id].mean;
        const min = abs ? 0 : this.$store.getters.paramData.meanMin;
        const max = abs ? 1 : this.$store.getters.paramData.meanMax;
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
    },
    lengthscale() {
      const snippet = this.$store.getters.primarySnippetObject;
      if ('trained' in snippet && snippet.trained) {
        // locate the parameter index (id)
        const rawLs =
          snippet.trainData.state[
            'covar_module.base_kernel.raw_lengthscale'
          ][0];

        // Either we have a manual filter, or we should use the default. Indices should match up either way
        const idIndex =
          snippet.filter.length > 0
            ? snippet.filter.indexOf(this.param.id)
            : snippet.trainData.defaultFilter.indexOf(this.param.id);

        if (idIndex >= 0) {
          return `rel: ${Math.log(1 + Math.exp(rawLs[idIndex])).toFixed(4)}`;
        }
      }

      return null;
    }
  },
  methods: {
    commitChange() {
      this.$store.dispatch(ACTION.COMMIT_PARAMS);
    },
    displayExtents() {
      // show the extents tab for the currently selected paramter
      this.$store.dispatch(ACTION.GENERATE_EXTENTS, {
        id: this.param.id,
        count: 10
      });
    },
    toggleActive() {
      this.$store.commit(MUTATION.CHANGE_PARAM_ACTIVE, {
        id: this.param.id,
        active: !this.param.active
      });
    }
  }
};
</script>

<style lang="scss" scoped>
input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  margin: 4.55px 0;
  height: 14px;
}
input[type='range']:focus {
  outline: none;
}
input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 12px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #757575, 0px 0px 1px #ffffff;
  border-radius: 1.3px;
  border: 0.2px solid #0b0101;
}
input[type='range']::-webkit-slider-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 24px;
  width: 6px;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -6.75px;
}
input[type='range']:focus::-webkit-slider-runnable-track {
}
</style>
