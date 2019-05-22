<template>
  <div class="w-full h-full overflow-hidden border-l">
    <setting-control
      v-for="(setting, key) in settings"
      :key="key"
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
    }
  }
};
</script>
