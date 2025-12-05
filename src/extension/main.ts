/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from "vue";

import { createVuetify } from "vuetify";

// Components
import ConfigurePage from "./ConfigurePage.vue";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

const app = createApp(ConfigurePage);

app.use(
  createVuetify({
    theme: {
      defaultTheme: "system",
    },
  }),
);

app.mount("#app");
