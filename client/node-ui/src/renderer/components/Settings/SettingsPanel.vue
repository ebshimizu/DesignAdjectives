<template>
  <div class="w-full h-full overflow-auto border-l">
    <div
      class="w-full bg-grey-darkest border-b border-grey-lightest py-2 font-bold text-grey-lightest tracking-wide uppercase text-center"
    >Global Snippet Options</div>
    <setting-control
      v-for="(setting, key) in snippetSettings"
      :key="key"
      action="SET_SNIPPET_SETTING"
      v-bind:setting="setting"
      v-bind:id="key"
    ></setting-control>
    <div
      class="w-full border-b bg-grey-darkest border-grey-lightest py-2 font-bold text-grey-lightest tracking-wide uppercase text-center"
    >Backend: {{ type }}</div>
    <setting-control
      v-for="(setting, key) in settings"
      :key="key"
      action="SET_BACKEND_SETTING"
      v-bind:setting="setting"
      v-bind:id="key"
    ></setting-control>
  </div>
</template>

<script>
import Tab from '../Tabs/Tab';
import Tabs from '../Tabs/Tabs';
import SettingControl from './SettingControl';

export default {
  name: 'settings-panel',
  components: {
    Tab,
    Tabs,
    SettingControl
  },
  computed: {
    settings() {
      return this.$store.getters.settings;
    },
    snippetSettings() {
      return this.$store.getters.snippetSettings;
    },
    type() {
      return this.$store.getters.backendType;
    }
  }
};
</script>
