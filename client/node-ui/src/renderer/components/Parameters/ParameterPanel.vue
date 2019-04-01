<template>
  <div class="w-full h-full overflow-hidden">
    <tabs>
      <tab title="Params">
        <parameter-controls></parameter-controls>
      </tab>
    </tabs>
  </div>
</template>

<script>
import Tab from '../Tabs/Tab';
import Tabs from '../Tabs/Tabs';
import ParameterControls from './ParameterControls';

export default {
  name: 'parameter-panel',
  components: {
    Tab,
    Tabs,
    ParameterControls
  }
};
</script>
