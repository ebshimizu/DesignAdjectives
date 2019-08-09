<template>
  <li :class="menuStyles">
    <a :class="textStyles" href="#">
      <slot />
    </a>
  </li>
</template>

<script>
export default {
  name: 'menu-item',
  props: ['menuStyle'],
  computed: {
    menuStyles() {
      if (this.menuStyle === 'compact') {
        return ['hover:bg-gray-600', 'px-1'];
      } else return ['hover:bg-gray-600', 'py-1', 'px-2'];
    },
    textStyles() {
      if (this.menuStyle === 'compact') {
        return ['text-gray-200', 'no-underline', 'text-sm'];
      } else return ['text-gray-200', 'no-underline'];
    }
  }
};
</script>
