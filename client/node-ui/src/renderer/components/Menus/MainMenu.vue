<template>
  <ul class="list-reset flex z-50 font-sans">
    <menu-group name="File">
      <menu-item @click.native="open()">Open</menu-item>
    </menu-group>
    <menu-group name="Params">
      <menu-item @click.native="$emit('show-param-spread')">Display Spread</menu-item>
    </menu-group>
    <menu-group name="Sample">
      <menu-item @click.native="randomSample()">Random Sample...</menu-item>
      <menu-item @click.native="jitter()">Jitter...</menu-item>
      <menu-item @click.native="stopSampler()">Reset Sampler</menu-item>
    </menu-group>
    <menu-group name="Snippets">
      <menu-item @click.native="connect()">{{ connected }} Server</menu-item>
      <menu-item @click.native="exportSnippets()">Export Snippets...</menu-item>
      <menu-item @click.native="importSnippets()">Import Snippets...</menu-item>
      <menu-item @click.native="clearCache()">Clear Snippet Cache</menu-item>
    </menu-group>
  </ul>
</template>

<script>
import MenuGroup from './MenuGroup';
import MenuItem from './MenuItem';
import path from 'path';
import { ACTION, MUTATION } from '../../store/constants';

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
          properties: ['openFile', 'openDirectory']
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

            this.$store.commit(MUTATION.DETECT_BACKEND, file);
            this.$store.commit(MUTATION.LOAD_NEW_FILE, {
              filename: file,
              dir
            });

            this.$store.dispatch(
              ACTION.LOAD_SNIPPETS,
              this.$store.state.paramStore.cacheKey
            );
            this.$store.commit(MUTATION.SET_SAMPLER_OPTION, {
              key: 'freeParams',
              val: this.$store.getters.paramsAsArray.length / 2
            });
          }
        }
      );
    },
    connect() {
      this.$store.getters.ready
        ? this.$store.dispatch(ACTION.DISCONNECT)
        : this.$store.dispatch(ACTION.CONNECT);
    },
    exportSnippets() {
      this.$electron.remote.dialog.showSaveDialog(
        {
          title: 'Export Snippets (JSON)',
          filters: [{ name: 'JSON', extensions: ['json'] }]
        },
        filename => {
          if (filename) {
            this.$store.commit(MUTATION.EXPORT_SNIPPETS, filename);
          }
        }
      );
    },
    importSnippets() {
      this.$electron.remote.dialog.showOpenDialog(
        {
          title: 'Import Snippets (JSON)',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extension: ['json'] }]
        },
        files => {
          if (files) {
            this.$store.commit(MUTATION.IMPORT_SNIPPETS, files[0]);
          }
        }
      );
    },
    clearCache() {
      this.$store.commit(MUTATION.CLEAR_CACHE);
    },
    jitter() {
      const opt = {
        n: 20
      };

      if (this.$store.getters.activeParamIDs.length > 0)
        opt.affectedParams = this.$store.getters.activeParamIDs;

      this.$store.dispatch(ACTION.JITTER_SAMPLE, {
        x0: this.$store.getters.paramsAsArray,
        delta: 0.1,
        snippet:
          this.$store.getters.primarySnippet === ''
            ? null
            : this.$store.getters.primarySnippet,
        opt
      });
    },
    stopSampler() {
      this.$store.dispatch(ACTION.STOP_SAMPLER);
    },
    randomSample() {
      if (this.$store.getters.idle) {
        this.$store.dispatch(ACTION.GENERATE_RANDOM, {
          count: 20,
          freeParams: 10
        });
      }
    }
  }
};
</script>