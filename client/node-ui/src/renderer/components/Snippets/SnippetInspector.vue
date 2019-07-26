<template>
  <div class="flex flex-col h-full w-full overflow-hidden border-l border-gray-200">
    <div class="flex flex-row w-full font-sans overflow-hidden text-gray-200">
      <div
        class="w-5/6 border-b border-blue-200 bg-blue-700 text-blue-200 px-2 py-1 text-sm overflow-hidden"
      >
        <select
          class="font-bold w-full border-2 border-blue-800 cursor-pointer bg-blue-700"
          v-model="activeSnippetName"
        >
          <option disabled value>Select an Axis</option>
          <option
            v-for="option in snippetOptions"
            v-bind:value="option.name"
            v-bind:key="option.name"
          >{{ option.name }}</option>
        </select>
        <div class="mb-3 p-1">{{ status }}</div>
      </div>
      <div
        class="px-2 font-bold flex-shrink bg-blue-800 hover:bg-blue-700 flex justify-center items-center border-b border-l border-gray-200 cursor-pointer"
        :class="{ disabled: isTraining }"
        @click="train()"
      >
        <div class="text-center uppercase font-sm">{{ isTraining ? 'Training...' : 'Train' }}</div>
      </div>
    </div>
    <div class="w-full half-height overflow-hidden flex flex-col h-full">
      <div
        class="flex w-full bg-green-900 text-gray-200 font-mono text-sm h-10 border-b border-gray-200"
      >
        <div class="w-full p-2">Positive</div>
        <div
          class="border-l border-gray-200 flex justify-center items-center bg-blue-800 hover:bg-blue-700 w-10 cursor-pointer"
          @click="addExample(1)"
        >
          <div class="font-sans text-lg font-bold tracking-wide uppercase">+</div>
        </div>
      </div>
      <div class="flex flex-row w-full h-full flex-wrap overflow-auto items-start">
        <exemplar
          v-for="exId in positiveExamples"
          :key="exId + activeSnippet.name"
          v-bind:snippet-name="activeSnippet.name"
          v-bind:id="exId"
        ></exemplar>
      </div>
    </div>
    <div class="border-t w-full half-height overflow-hidden flex flex-col h-full border-gray-200">
      <div
        class="flex w-full bg-red-900 text-gray-200 font-mono text-sm h-10 border-b border-gray-200"
      >
        <div class="w-full p-2">Negative</div>
        <div
          class="border-l border-gray-200 flex justify-center items-center bg-blue-800 hover:bg-blue-700 w-10 cursor-pointer"
          @click="addExample(0)"
        >
          <div class="font-sans text-lg font-bold tracking-wide uppercase">+</div>
        </div>
      </div>
      <div class="flex flex-row w-full h-full flex-wrap overflow-auto items-start">
        <exemplar
          v-for="exId in negativeExamples"
          :key="exId + activeSnippet.name"
          v-bind:snippet-name="activeSnippet.name"
          v-bind:id="exId"
        ></exemplar>
      </div>
    </div>
    <div class="debug-info w-full overflow-auto text-gray-200 border-t border-gray-200">
      <div
        class="border-b border-gray-200 px-2 py-1 overflow-hidden"
        v-for="(val, key) in trainData.state"
        :key="key"
      >
        <div class="font-bold tracking-wide uppercase text-xs mb-1 break-all">{{ key }}</div>
        <div class="font-mono text-sm">{{ val }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import Exemplar from '../Samples/Exemplar';
import { ACTION } from '../../store/constants';

export default {
  name: 'snippet-inspector',
  components: {
    Exemplar
  },
  computed: {
    activeSnippetName: {
      get() {
        return this.$store.state.snippets.activeSnippet
          ? this.$store.state.snippets.activeSnippet.name
          : '';
      },
      set(newVal) {
        this.$store.dispatch(ACTION.SET_ACTIVE_SNIPPET, newVal);
      }
    },
    snippetOptions() {
      return this.$store.state.snippets.snippets;
    },
    isTraining() {
      return this.$store.getters.training;
    },
    trained() {
      return this.activeSnippet
        ? this.$store.state.snippets.activeSnippet.trained
        : false;
    },
    activeSnippet() {
      return this.$store.state.snippets.activeSnippet;
    },
    positiveExamples() {
      const ex = [];
      if (this.activeSnippet.data) {
        for (let i = 0; i < this.activeSnippet.data.length; i++) {
          if (this.activeSnippet.data[i].y > 0) {
            ex.push(i);
          }
        }
      }

      return ex;
    },
    negativeExamples() {
      const ex = [];
      if (this.activeSnippet.data) {
        for (let i = 0; i < this.activeSnippet.data.length; i++) {
          if (this.activeSnippet.data[i].y <= 0) {
            ex.push(i);
          }
        }
      }

      return ex;
    },
    status() {
      return this.activeSnippet.trained ? 'Trained' : 'Not Trained';
    },
    trainData() {
      if (this.activeSnippet.trained) {
        const filtered = {};
        const val = this.activeSnippet.trainData;

        for (const key of Object.keys(val)) {
          if (key !== 'code' && key !== 'message') {
            filtered[key] = val[key];
          }
        }

        return filtered;
      }

      return {};
    }
  },
  methods: {
    train() {
      if (this.activeSnippet && !this.isTraining && this.trained) {
        this.$store.dispatch(ACTION.LOAD_SNIPPET, this.activeSnippet.name);
      } else if (this.activeSnippet && !this.isTraining) {
        this.$store.dispatch(ACTION.TRAIN, this.activeSnippet.name);
      }
    },
    addExample(y) {
      // check active
      if (this.activeSnippet) {
        // snapshot current state
        const x = this.$store.getters.paramsAsArray;

        this.$store.dispatch(ACTION.ADD_EXAMPLE, {
          name: this.activeSnippet.name,
          point: { x, y }
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.debug-info {
  height: 10vw;
}

.half-height {
  height: 50%;
}
</style>
