<template>
  <div class="fixed pin-t w-full border-b border-grey-lightest bg-grey-darkest">
    <ul class="list-reset flex z-50">
      <menu-group name="File">
        <menu-item @click.native="open()">Open</menu-item>
        <menu-item>Save</menu-item>
      </menu-group>
      <menu-group name="Snippets">
        <menu-item>List Snippets</menu-item>
      </menu-group>
    </ul>
  </div>
</template>

<script>
import MenuGroup from './MenuGroup';
import MenuItem from './MenuItem';
import path from 'path';

export default {
  name: 'main-menu',
  components: {
    MenuGroup,
    MenuItem
  },
  methods: {
    open() {
      this.$electron.remote.dialog.showOpenDialog(
        {
          title: 'Open File',
          properties: ['openFile']
        },
        paths => {
          // only want one path
          if (paths.length > 0) {
            const file = path.basename(paths[0]);
            const dir = `${path.dirname(paths[0])}/`;

            this.$store.dispatch('LOAD_NEW_FILE', {
              filename: file,
              dir
            });
          }
        }
      );
    }
  }
};
</script>