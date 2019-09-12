<template>
  <div class="w-full h-full overflow-auto border-l">
    <div
      class="w-full bg-gray-800 border-b border-gray-200 py-2 font-bold text-gray-200 tracking-wide uppercase text-center"
    >Global Options</div>
    <setting-control
      v-for="(setting, key) in snippetSettings"
      :key="key"
      :action="snippetMutation"
      v-bind:setting="setting"
      v-bind:id="key"
    ></setting-control>
    <div
      class="w-full border-b bg-gray-800 border-gray-200 py-2 font-bold text-gray-200 tracking-wide uppercase text-center"
    >Backend Options: {{ type }}</div>
    <setting-control
      v-for="(setting, key) in settings"
      :key="key"
      :action="backendMutation"
      v-bind:setting="setting"
      v-bind:id="key"
    ></setting-control>
  </div>
</template>

<script>
import Tab from '../Tabs/Tab';
import Tabs from '../Tabs/Tabs';
import SettingControl from './SettingControl';
import { MUTATION } from '../../store/constants';

export default {
  name: 'settings-panel',
  components: {
    Tab,
    Tabs,
    SettingControl
  },
  data() {
    return {
      snippetMutation: MUTATION.SET_SNIPPET_SETTING,
      backendMutation: MUTATION.SET_BACKEND_SETTING
    };
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
