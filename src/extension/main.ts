/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import ConfigurePage from "./ConfigurePage.vue";

// Composables
import { createApp } from "vue";

import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

const app = createApp(ConfigurePage);

app.use(
  createVuetify({
    theme: {
      defaultTheme: "system",
    },
  })
);

app.mount("#app");
