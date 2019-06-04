<template>
  <div class="w-full h-full overflow-hidden border-l">
    <div
      class="w-full border-b border-grey-lightest py-2 font-bold text-grey-lightest tracking-wide uppercase text-center"
    >{{ type }} Options</div>
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
    },
    type() {
      return this.$store.getters.backendType;
    }
  }
};
</script>
