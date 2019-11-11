<template>
  <div class="w-full h-full overflow-hidden">
    <tabs>
      <tab title="Params">
        <parameter-controls></parameter-controls>
      </tab>
      <tab title="Adjectives">
        <snippets-panel />
      </tab>
      <tab title="Settings">
        <settings-panel></settings-panel>
      </tab>
    </tabs>
  </div>
</template>

<script>
import Tab from '../Tabs/Tab';
import Tabs from '../Tabs/Tabs';
import ParameterControls from './ParameterControls';
import SettingsPanel from '../Settings/SettingsPanel';
import SnippetsPanel from '../Snippets/SnippetsPanel';

export default {
  name: 'parameter-panel',
  components: {
    Tab,
    Tabs,
    ParameterControls,
    SettingsPanel,
    SnippetsPanel
  }
};
</script>
