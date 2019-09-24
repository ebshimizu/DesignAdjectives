<template>
  <div class="absolute left-0 top-0 w-full h-full param-spread">
    <div class="flex flex-col">
      <div class="flex flex-row items-center w-full text-gray-200 p-1 border-b">
        <div class="w-full text-md uppercase tracking-wide font-bold">Parameter Spread</div>
        <div @click="hide" class="btn btn-red">
          <div>Close</div>
        </div>
      </div>
      <div class="h-full overflow-auto"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'parameter-spread',
  props: ['isVisible'],
  computed: {
    params() {
      return this.$store.getters.paramInfo;
    },
    spreadBase() {
      return this.$store.getters.paramSpreadBase;
    }
  },
  methods: {
    hide() {
      this.$emit('hide-param-spread');
    }
  }
};
</script>

<style lang="scss" scoped>
.param-spread {
  background-color: rgba(0, 0, 0, 0.7);
}

.btn {
  margin-bottom: 0;
}
</style>