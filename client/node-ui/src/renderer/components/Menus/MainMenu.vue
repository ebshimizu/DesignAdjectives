<template>
  <ul class="list-reset flex z-50 font-sans">
    <menu-group name="File">
      <menu-item @click.native="open()">Open</menu-item>
    </menu-group>
    <menu-group name="Snippets">
      <menu-item @click.native="connect()">{{ connected }} Server</menu-item>
    </menu-group>
  </ul>
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
  computed: {
    connected() {
      return this.$store.getters.ready ? 'Disconnect' : 'Connect';
    }
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
          if (paths && paths.length > 0) {
            const file = path.basename(paths[0]);
            const dir = `${path.dirname(paths[0])}/`;

            // replace the main canvas
            let canvas = document.getElementById('mainRenderCanvas');
            const newCanvas = canvas.cloneNode(false);
            canvas.parentNode.replaceChild(newCanvas, canvas);
            canvas = newCanvas;

            this.$store.commit('DETECT_BACKEND', file);

            this.$store.commit('LOAD_NEW_FILE', {
              filename: file,
              dir
            });

            this.$store.dispatch(
              'LOAD_SNIPPETS',
              this.$store.state.paramStore.cacheKey
            );
          }
        }
      );
    },
    connect() {
      this.$store.getters.ready
        ? this.$store.dispatch('DISCONNECT')
        : this.$store.dispatch('CONNECT');
    }
  }
};
</script>