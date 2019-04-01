<template>
  <li class="hover:bg-grey-darker py-1 px-2">
    <a class="text-grey-lightest no-underline" href="#">
      <slot/>
    </a>
  </li>
</template>

<script>
export default {
  name: 'menu-item'
};
</script>
