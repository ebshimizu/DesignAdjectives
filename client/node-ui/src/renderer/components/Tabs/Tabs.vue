<template>
  <div class="h-full w-full flex flex-col">
    <ul class="h-10">
      <li v-for="(tab, i) in tabs" :key="i" :class="{visible: tab.visible}">
        <a href="#" @click="showTab(i)">{{ tab.title }}</a>
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