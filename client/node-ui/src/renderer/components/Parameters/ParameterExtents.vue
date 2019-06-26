<template>
  <div
    class="h-full w-full overflow-auto bg-gray-800 border-gray-200 border shadow-md flex flex-col"
  >
    <div
      class="w-full h-8 text-gray-200 border-b border-gray-200 bg-blue-700 justify-center items-center flex"
    >
      <div class="font-mono text-sm w-full text-center">Parameter Extents</div>
      <div
        class="font-mono text-sm h-full w-8 bg-red-800 flex items-center justify-center cursor-pointer hover:bg-red-700 border-l border-gray-200"
        @click="hideExtents()"
      >X</div>
    </div>
    <div class="w-full text-gray-200 border-b border-gray-200 p-1">
      <div class="font-bold tracking-wide uppercase text-xs break-all mb-1">Active Parameter</div>
      <div class="font-mono text-xs break-all">{{ activeParam }}</div>
    </div>
    <div class="w-full h-full overflow-auto"></div>
  </div>
</template>

<script>
import { MUTATION } from '../../store/constants';

export default {
  name: 'parameter-extents',
  computed: {
    activeParam() {
      if (this.$store.getters.extentsParam === '') return 'No Active Param';

      return this.$store.getters.extentsParam;
    }
  },
  methods: {
    hideExtents() {
      this.$store.commit(MUTATION.HIDE_EXTENTS);
    }
  }
};
</script>
