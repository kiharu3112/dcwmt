import Vue from "vue";
import App from "./components/App.vue";
import store from "./plugins/store";
import vuetify from "./plugins/vuetify";

import "../css/animation.css";
import "../css/design.css";
import "../css/layout.css";
import "cesium/Build/Cesium/Widgets/widgets.css";

new Vue({
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
