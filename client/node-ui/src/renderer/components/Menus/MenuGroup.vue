<template>
  <li
    @click="toggle()"
    v-on:mouseleave="hide()"
    class="text-gray-200 font-bold inline-block px-4 py-1 cursor-pointer hover:bg-gray-600 bg-gray-700 relative"
  >
    {{ name }}
    <ul
      class="dropdown list-reset bg-gray-700 border border-gray-200 shadow-md font-normal font-sm"
      v-show="isVisible && items.length > 0"
    >
      <slot/>
    </ul>
  </li>
</template>

<script>
export default {
  name: 'menu-group',
  data: function() {
    return { items: [], isVisible: false };
  },
  props: ['name'],
  created() {
    this.items = this.$children;
  },
  methods: {
    show() {
      this.isVisible = true;
    },
    hide() {
      this.isVisible = false;
    },
    toggle() {
      this.isVisible = !this.isVisible;
    }
  }
};
</script>

<style lang="scss">
.dropdown {
  display: block;
  position: absolute;
  top: calc(2.2rem - 3px);
  left: 0;
  width: 12rem;
}
</style>
