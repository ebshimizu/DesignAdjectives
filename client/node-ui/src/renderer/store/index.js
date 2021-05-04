import Vue from 'vue';
import Vuex from 'vuex';
import logToFile from './logToFile';

// import { createSharedMutations } from 'vuex-electron';

import modules from './modules';
import fs from 'fs-extra';
import path from 'path';

Vue.use(Vuex);

const userFolder =
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? process.env.HOME + '/Library/Preferences'
    : process.env.HOME + '/.local/share');

fs.ensureDirSync(path.join(userFolder, 'parameter-toolbox', 'logs'));
const LOG_PATH = path.join(
  userFolder,
  'parameter-toolbox',
  'logs',
  `ui-log-${new Date().getTime()}.log`
);

console.log(`Logging state transactions at ${LOG_PATH}`);

export default new Vuex.Store({
  modules,
  plugins: [
    logToFile({
      file: LOG_PATH
    })
  ],
  strict: process.env.NODE_ENV !== 'production'
});
