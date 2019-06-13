<template>
  <div class="flex flex-row h-full w-full overflow-hidden">
    <div class="w-64 border-r border-gray-200 font-sans overflow-auto text-gray-200">
      <div class="border-b border-blue-200 bg-blue-700 text-blue-200 px-2 py-1 text-sm">
        <div class="font-bold">{{ activeSnippetName ? activeSnippetName : '[No Active Snippet]' }}</div>
        <div>Sampler Control</div>
      </div>
      <div class="border-b border-gray-200 px-2 py-1">
        <div class="font-bold tracking-wide uppercase text-xs mb-1">Count</div>
        <input
          class="w-full rounded-sm p-1 text-sm text-grey-light bg-gray-800 font-mono"
          type="number"
          v-model="n"
          min="1"
          step="1"
        >
      </div>
      <div class="border-b border-gray-200 px-2 py-1">
        <div class="font-bold tracking-wide uppercase text-xs mb-1">Threshold</div>
        <input
          class="w-full rounded-sm p-1 text-sm text-grey-light bg-gray-800 font-mono"
          type="number"
          v-model="threshold"
          min="0"
          max="1"
          step="0.001"
        >
      </div>
      <!-- <div class="border-b border-gray-200 px-2 py-1">
        <div class="font-bold tracking-wide uppercase text-xs mb-1">Burn-in</div>
        <input
          class="w-full rounded-sm p-1 text-sm text-grey-light bg-gray-800 font-mono"
          type="number"
          v-model="burnin"
          min="0"
          max="10000"
          step="1"
        >
      </div>-->
      <div class="border-b border-gray-200 px-2 py-1">
        <div class="font-bold tracking-wide uppercase text-xs mb-1">Free Params</div>
        <div class="flex">
          <input class="w-2/3 mx-2" type="range" v-model="free" min="0" :max="maxParams" step="1">
          <input
            class="w-1/3 standard-text-field"
            type="number"
            v-model="free"
            min="0"
            :max="maxParams"
            step="1"
          >
        </div>
      </div>
      <div class="p-2">
        <div
          class="btn btn-green"
          :class="{ 'btn-red': isSampling, 'disabled': !canSample }"
          @click="toggleSampler()"
        >{{ sampleStatus }}</div>
      </div>
    </div>
    <div class="flex flex-row w-full h-full flex-wrap overflow-auto items-start">
      <sample v-for="sample in samples" :key="sample.idx" v-bind:sample="sample"></sample>
    </div>
  </div>
</template>

<script>
import Sample from './Sample';
import { ACTION } from '../../store/constants';

export default {
  name: 'sampler-panel',
  components: {
    Sample
  },
  data() {
    return {
      n: 10,
      threshold: 0.7,
      burnin: 100,
      free: 3
    };
  },
  computed: {
    samples() {
      return this.$store.state.snippets.samples;
    },
    isSampling() {
      return this.$store.getters.sampling;
    },
    canSample() {
      return (
        this.$store.getters.ready &&
        this.activeSnippetName &&
        this.$store.state.snippets.activeSnippet.trained
      );
    },
    sampleStatus() {
      if (this.isSampling) return 'Stop';
      if (!this.$store.getters.ready) return 'No Connection';
      if (!this.activeSnippetName) return 'No Active Snippet';
      if (!this.$store.state.snippets.activeSnippet.trained) return 'Untrained';

      return 'Start';
    },
    activeSnippetName() {
      if ('name' in this.$store.state.snippets.activeSnippet)
        return this.$store.state.snippets.activeSnippet.name;

      return null;
    },
    maxParams() {
      return this.$store.getters.paramsAsArray.length;
    }
  },
  methods: {
    start() {
      // sampling conditions
      // - active sample is trained
      // - server is not already sampling
      if (this.canSample) {
        this.$store.dispatch(ACTION.START_SAMPLER, {
          name: this.$store.state.snippets.activeSnippet.name,
          data: {
            n: parseInt(this.n),
            threshold: parseFloat(this.threshold),
            freeParams: parseInt(this.free)
          }
        });
      }
    },
    stop() {
      this.$store.dispatch(ACTION.STOP_SAMPLER);
    },
    toggleSampler() {
      if (this.canSample) {
        if (this.isSampling) this.stop();
        else this.start();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  margin: 3.55px 6px 3.55px 0;
}
input[type='range']:focus {
  outline: none;
}
input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 20.9px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  border-radius: 1.3px;
  border: 0.2px solid #0b0101;
  background: #2d3748;
}
input[type='range']::-webkit-slider-thumb {
  box-shadow: 0.9px 0.9px 1px #ffffff, 0px 0px 0.9px #ffffff;
  border: 1px solid #000000;
  height: 28px;
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
