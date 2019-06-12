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
        <div class="font-bold tracking-wide uppercase text-xs mb-1">Fixed Params</div>
        <input class="standard-text-field w-full" type="number" v-model="fixed" min="0" step="1">
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
      n: 50,
      threshold: 0.7,
      burnin: 100,
      fixed: 0
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
            fixed: parseInt(this.fixed)
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
