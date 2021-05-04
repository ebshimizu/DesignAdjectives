import Vue from 'vue';
import axios from 'axios';

import App from './App';
import store from './store';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import path from 'path';

const userFolder =
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? process.env.HOME + '/Library/Preferences'
    : process.env.HOME + '/.local/share');

// duplicating stuff for full app access
window.LOG_PATH = path.join(
  userFolder,
  'parameter-toolbox',
  'logs',
  `ui-log-${new Date().getTime()}.log`
);

library.add(fas);

Vue.component('font-awesome-icon', FontAwesomeIcon);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

// ptypo isn't loaded from a module and is instead floating around the
// window context, bind it here for use later in the app
// eslint-disable-next-line no-undef
window.Ptypo = Ptypo;

/* eslint-disable no-new */
new Vue({
  components: { App },
  store,
  template: '<App/>'
}).$mount('#app');
