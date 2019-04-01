<template>
  <li
    @click="toggle()"
    v-on:mouseleave="hide()"
    class="text-grey-lightest inline-block px-4 py-2 cursor-pointer hover:bg-grey-darker bg-grey-darkest relative"
  >
    {{ name }}
    <ul
      class="dropdown list-reset bg-grey-darkest border border-grey-lightest"
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
  top: calc(2.2rem - 1px);
  left: 0;
  min-width: 8rem;
}
</style>
