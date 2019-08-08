<template>
  <div class="flex flex-col h-full w-full overflow-hidden border-gray-200 border-b">
    <div class="w-full text-gray-200 p-1 bg-gray-700 border-b border-gray-200">
      <div class="w-full font-bold tracking-wide">{{ name }}</div>
      <div class="w-full text-xs uppercase font-bold tracking-wide">{{ status }}</div>
    </div>
    <div class="w-full h-8 flex flex-row border-b border-gray-200">
      <div class="green square-button border-r" @click="addExample(1)">
        <div>Add +</div>
      </div>
      <div class="red square-button border-r" @click="addExample(0)">
        <div>Add -</div>
      </div>
      <div class="blue square-button border-r">
        <div>Set Primary</div>
      </div>
      <div class="blue square-button border-r" @click="train()">
        <div>Retrain</div>
      </div>
      <div class="red square-button border-r" @click="$emit('deactivate')">
        <div>Deactivate</div>
      </div>
    </div>
    <div class="w-full h-full overflow-auto flex flex-row flex-wrap" v-show="exemplarsVisible">
      <exemplar v-for="id in sortedExemplars" :key="id + name" :snippet-name="name" :id="id" />
    </div>
  </div>
</template>

<script>
import Exemplar from '../Samples/Exemplar';
import { ACTION } from '../../store/constants';

export default {
  name: 'snippet-widget',
  components: {
    Exemplar
  },
  props: {
    name: String,
    exemplars: Array
  },
  data() {
    return {
      exemplarsVisible: true
    };
  },
  computed: {
    trained() {
      return this.$store.state.snippets.snippets[this.name].trained;
    },
    status() {
      return this.trained ? 'Trained' : 'Not Trained';
    },
    sortedExemplars() {
      // track original id
      const dup = [];
      for (let i = 0; i < this.exemplars.length; i++) {
        dup[i] = i;
      }

      // currently sorts by score
      const self = this;
      return dup.sort(function(a, b) {
        if (self.exemplars[a].y < self.exemplars[b].y) return 1;
        if (self.exemplars[a].y > self.exemplars[b].y) return -1;
        return 0;
      });
    },
    isTraining() {
      return this.$store.getters.training;
    }
  },
  methods: {
    addExample(y) {
      // snapshot current state
      const x = this.$store.getters.paramsAsArray;

      this.$store.dispatch(ACTION.ADD_EXAMPLE, {
        name: this.name,
        point: { x, y }
      });
    },
    train() {
      if (!this.isTraining && this.trained) {
        this.$store.dispatch(ACTION.LOAD_SNIPPET, this.name);
      } else if (!this.isTraining) {
        this.$store.dispatch(ACTION.TRAIN, this.name);
      }
    }
  }
};
</script>
