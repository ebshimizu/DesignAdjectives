<template>
  <div class="font-sans h-full w-full flex flex-col border-t">
    <ul class="h-10 list-reset flex border-b border-l border-gray-200 bg-gray-900">
      <li
        v-for="(tab, i) in tabs"
        :key="i"
        :class="{visible: tab.visible}"
        class="pr-1 border-r bg-gray-800 hover:bg-gray-600 font-bold"
      >
        <a
          href="#"
          :class="{visible: tab.visible}"
          class="inline-block py-2 px-4 font-semibold no-underline text-yellow-400"
          @click="showTab(i)"
        >{{ tab.title }}</a>
      </li>
    </ul>
    <div class="h-full flex-shrink overflow-hidden">
      <slot/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'tabs',
  data: function() {
    return { tabs: [] };
  },
  created() {
    this.tabs = this.$children;
  },
  mounted() {
    // set a default active tab (id 0)
    this.tabs.forEach(t => {
      t.hide();
    });

    if (this.tabs.length >= 0) this.tabs[0].show();
  },
  methods: {
    showTab(i) {
      this.tabs.forEach(t => {
        t.hide();
      });

      this.tabs[i].show();
    }
  }
};
</script>

<style lang="scss" scoped>
li.visible {
  background-color: #6e767e;
}
</style>
