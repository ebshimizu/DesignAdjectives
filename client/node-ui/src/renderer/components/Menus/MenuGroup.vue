<template>
  <li
    @click="toggle()"
    v-on:mouseleave="hide()"
    class="inline-block cursor-pointer relative"
    :class="menuStyles"
  >
    {{ name }}
    <ul
      class="dropdown list-reset border border-gray-200 shadow-md font-normal font-sm"
      :class="dropdownStyles"
      v-show="isVisible && items.length > 0"
    >
      <slot />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'menu-group',
  data: function() {
    return { items: [], isVisible: false };
  },
  props: ['name', 'menuStyle'],
  created() {
    this.items = this.$children;
  },
  computed: {
    menuStyles() {
      if (this.menuStyle === 'compact') {
        return [
          'text-gray-200',
          'font-mono',
          'text-md',
          'font-medium',
          'px-3',
          'py-1',
          'bg-gray-800',
          'hover:bg-gray-600'
        ];
      } else
        return [
          'text-gray-200',
          'font-bold',
          'px-4',
          'py-1',
          'hover:bg-gray-600',
          'bg-gray-700'
        ];
    },
    dropdownStyles() {
      if (this.menuStyle === 'compact') {
        return ['bg-gray-800'];
      } else return ['bg-gray-700'];
    }
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
  z-index: 51;
}
</style>
