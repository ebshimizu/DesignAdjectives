<template>
  <li class="hover:bg-gray-600 py-1 px-2">
    <a class="text-gray-200 no-underline" href="#">
      <slot/>
    </a>
  </li>
</template>

<script>
export default {
  name: 'menu-item'
};
</script>
