<template>
  <div class="text-gray-200 w-full border-b border-gray-200 px-2 py-4">
    <div v-if="setting.type === 'number'" class="w-full px-2">
      <div class="label font-bold tracking-wide uppercase mb-1 w-full text-xs">{{ setting.name }}</div>
      <input
        class="standard-text-field w-full"
        type="number"
        v-model="localVal"
        v-bind:max="setting.max"
        v-bind:min="setting.min"
        v-bind:step="setting.step"
      />
    </div>
    <div v-else-if="setting.type === 'boolean'" class="w-full px-2">
      <label class="checkbox text-sm font-bold tracking-wide uppercase">
        {{ setting.name }}
        <input type="checkbox" v-model="localVal" />
        <span class="check"></span>
      </label>
    </div>
    <div v-else-if="setting.type === 'enum'" class="w-full px-2">
      <div class="label font-bold tracking-wide uppercase mb-1 w-full text-xs">{{ setting.name }}</div>
      <select v-model="localVal" class="text-sm font-mono p-1 w-full bg-gray-800 text-grey-light">
        <option v-for="option in setting.values" v-bind:value="option" :key="option">{{ option }}</option>
      </select>
    </div>
    <div v-else-if="setting.type === 'string'" class="w-full px-2">
      <div class="label font-bold tracking-wide uppercase mb-1 w-full text-xs">{{ setting.name }}</div>
      <div class="flex">
        <input
          class="standard-text-field w-full"
          v-model="localVal"
          v-bind:disabled="setting.readOnly === true"
          ref="settingTextField"
        />
        <div
          v-if="setting.folderBrowser"
          class="w-1/4 blue square-button ml-1"
          @click="browseFolder"
        >
          <div>Browse...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'setting-control',
  props: ['id', 'setting', 'action'],
  computed: {
    localVal: {
      get() {
        return this.setting.value;
      },
      set(value) {
        if (this.setting.type === 'number') {
          if (!isNaN(parseFloat(value))) {
            this.$store.commit(this.action, {
              key: this.id,
              value: parseFloat(value)
            });
          }
        } else this.$store.commit(this.action, { key: this.id, value });
      }
    }
  },
  methods: {
    browseFolder() {
      const self = this;
      this.$electron.remote.dialog.showOpenDialog(
        {
          title: 'Select Substance Automation Toolkit Folder',
          properties: ['openDirectory'],
          defaultPath: self.localVal
        },
        paths => {
          if (paths && paths.length > 0) {
            const dir = paths[0];
            self.localVal = dir;
            self.$refs.settingTextField.value = dir;
          }
        }
      );
    }
  }
};
</script>

<style scoped>
.checkbox {
  display: block;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.check {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #eee;
}

.checkbox:hover input ~ .check {
  background-color: #ccc;
}

.checkbox input:checked ~ .check {
  background-color: #2196f3;
}

.check:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox input:checked ~ .check:after {
  display: block;
}

.checkbox .check:after {
  left: 8px;
  top: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}
</style>
