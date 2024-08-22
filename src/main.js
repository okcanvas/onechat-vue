import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './assets/iconfont/iconfont.css';
import httpRequest from './api/httpRequest';
import * as socketApi from './api/wssocket';
import emotion from './api/emotion.js';
import element from './api/element.js';
import store from './store';
import * as  enums from './api/enums.js';
import './utils/directive/dialogDrag';

Vue.use(ElementUI);


Vue.prototype.$wsApi = socketApi;
Vue.prototype.$http = httpRequest 
Vue.prototype.$emo = emotion; 
Vue.prototype.$elm = element;
Vue.prototype.$enums = enums; 
Vue.config.productionTip = false;
Vue.config.silent = true

new Vue({
  el: '#app',
  router,
  store,
  render: h=>h(App)
})
