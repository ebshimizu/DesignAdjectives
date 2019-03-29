<template>
  <div v-show="visible" class="h-full w-full overflow-hidden">
    <slot/>
  </div>
</template>

<script>
export default {
  name: 'tab',
  props: {
    title: { required: true }
  },
  data: function() {
    return { visible: false };
  },
  computed: {
    name() {
      return this.title.toLowerCase().replace(' ', '-');
    }
  },
  methods: {
    hide() {
      this.visible = false;
    },
    show() {
      this.visible = true;
    }
  }
};
</script>
