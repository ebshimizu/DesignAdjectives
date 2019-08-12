<template>
  <div class="flex flex-row h-full w-full overflow-hidden">
    <div class="flex flex-col w-1/4 border-r border-gray-200 font-sans overflow-auto text-gray-200">
      <div class="border-b border-blue-200 bg-blue-700 text-blue-200 px-2 py-1 text-sm">
        <div class="font-bold">Sampler Settings</div>
      </div>
      <div class="w-full h-full overflow-auto">
        <div class="border-b border-gray-200 px-2 py-1">
          <div class="font-bold tracking-wide uppercase text-xs mb-1">Count</div>
          <input
            class="w-full rounded-sm p-1 text-sm text-grey-light bg-gray-800 font-mono"
            type="number"
            v-model="n"
            min="1"
            step="1"
          />
        </div>
        <div class="border-b border-gray-200 px-2 py-1">
          <div class="font-bold tracking-wide uppercase text-xs mb-1">Threshold</div>
          <div class="flex">
            <select
              v-model="thresholdMode"
              class="w-2/3 text-sm font-mono p-1 mr-2 bg-gray-800 text-gray-light"
            >
              <option
                v-for="option in thresholdModes"
                v-bind:value="option.val"
                :key="option.val"
              >{{ option.text }}</option>
            </select>
            <input
              class="w-1/3 standard-text-field"
              type="number"
              v-model="threshold"
              min="0"
              max="1"
              step="0.001"
            />
          </div>
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
            <input class="w-2/3 mx-2" type="range" v-model="free" min="0" :max="maxParams" step="1" />
            <input
              class="w-1/3 standard-text-field"
              type="number"
              v-model="free"
              min="0"
              :max="maxParams"
              step="1"
            />
          </div>
        </div>
        <div class="border-b border-gray-200 px-2 py-1">
          <div class="font-bold tracking-wide uppercase text-xs mb-1">Param Floor</div>
          <div class="flex">
            <input
              class="w-2/3 mx-2"
              type="range"
              v-model="paramFloor"
              min="0"
              :max="maxParams"
              step="1"
            />
            <input
              class="w-1/3 standard-text-field"
              type="number"
              v-model="paramFloor"
              min="0"
              :max="maxParams"
              step="1"
            />
          </div>
        </div>
        <div class="border-b border-gray-200 px-2 py-1">
          <div class="font-bold tracking-wide uppercase text-xs mb-1">Retries Before Decrease</div>
          <input
            class="w-full standard-text-field"
            type="number"
            v-model="retries"
            min="0"
            step="1"
          />
        </div>
        <div class="px-2 py-2">
          <div
            class="btn btn-green"
            @click="randomSample()"
            :class="{ 'disabled': !this.$store.getters.idle }"
          >Random Sample</div>
        </div>
      </div>
    </div>
    <div class="flex flex-row w-full h-full flex-wrap overflow-auto items-start">
      <sample v-for="sample in samples" :key="sample.idx" v-bind:sample="sample"></sample>
    </div>
  </div>
</template>

<script>
import Sample from './Sample';
import {
  ACTION,
  MUTATION,
  THRESHOLD_MODE,
  THRESHOLD_TEXT
} from '../../store/constants';

export default {
  name: 'sampler-panel',
  components: {
    Sample
  },
  computed: {
    n: {
      get() {
        return this.$store.state.snippets.samplerSettings['n'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'n',
          val: parseInt(val)
        });
      }
    },
    threshold: {
      get() {
        return this.$store.state.snippets.samplerSettings['threshold'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'threshold',
          val: parseFloat(val)
        });
      }
    },
    free: {
      get() {
        return this.$store.state.snippets.samplerSettings['freeParams'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'freeParams',
          val: parseInt(val)
        });
      }
    },
    paramFloor: {
      get() {
        return this.$store.state.snippets.samplerSettings['paramFloor'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'paramFloor',
          val: parseInt(val)
        });
      }
    },
    retries: {
      get() {
        return this.$store.state.snippets.samplerSettings['retries'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'retries',
          val: parseInt(val)
        });
      }
    },
    thresholdMode: {
      get() {
        return this.$store.state.snippets.samplerSettings['thresholdMode'];
      },
      set(val) {
        this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
          key: 'thresholdMode',
          val
        });
      }
    },
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
        this.$store.state.snippets.snippets[this.activeSnippetName].trained
      );
    },
    sampleStatus() {
      if (this.isSampling) return 'Stop';
      if (!this.$store.getters.ready) return 'No Connection';
      if (!this.activeSnippetName) return 'No Active Snippet';
      if (!this.$store.state.snippets.snippets[this.activeSnippetName].trained)
        return 'Untrained';

      return 'Start';
    },
    maxParams() {
      return this.$store.getters.paramsAsArray.length;
    },
    thresholdModes() {
      const modes = {};
      for (const key in THRESHOLD_MODE) {
        modes[key] = {
          val: key,
          text: THRESHOLD_TEXT[key]
        };
      }

      return modes;
    }
  },
  methods: {
    start() {
      // sampling conditions
      // - active sample is trained
      // - server is not already sampling
      if (this.canSample) {
        this.$store.dispatch(ACTION.START_SAMPLER, {
          name: this.$store.state.snippets.primarySnippet
        });
      }
    },
    randomSample() {
      if (this.$store.getters.idle) {
        this.$store.dispatch(ACTION.GENERATE_RANDOM, {
          count: parseInt(this.n),
          freeParams: parseInt(this.free)
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
