<template>
  <v-footer app height="40">
    <v-row justify="space-between" class="fill-width">
      <v-col style="text-align: center">
        <a href="https://github.com/Snake52996/work-tracker/">visit codebase on GitHub</a>
      </v-col>
      <v-col style="text-align: center">
        <a href="https://snake.moe/wt-injector/">WT Injector</a>
      </v-col>
      <v-col style="text-align: center">
        <a @click="show_licenses = true">Licenses</a>
      </v-col>
    </v-row>
  </v-footer>
  <v-dialog v-model="show_licenses">
    <v-container width="max-content" style="overflow-y: scroll; scrollbar-width: none">
      <v-banner sticky class="pa-1">
        <v-btn block @click="show_licenses = false">close</v-btn>
      </v-banner>
      <v-card v-for="(group, group_index) in licenses" :key="group_index" class="my-4">
        <v-card-text>
          <v-card
            v-for="(item, item_index) in group"
            :key="item.name"
            class="my-2"
            :color="item_index % 2 === 0 ? 'primary' : 'secondary'"
          >
            <v-card-title>{{ item.name }}</v-card-title>
            <v-card-subtitle>{{ item.usage }}</v-card-subtitle>
            <v-card-text>
              <p>
                Project URL: <a :href="item.url">{{ item.url }}</a>
              </p>
              <p>License: {{ item.license_name }}</p>
              <p>
                License URL: <a :href="item.license_url">{{ item.license_url }}</a>
              </p>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { ref } from "vue";

const show_licenses: Ref<boolean> = ref(false);
const licenses: {
  name: string;
  usage: string;
  url: string;
  license_name: string;
  license_url: string;
}[][] = [
  [
    {
      name: "Work Tracker",
      usage: "This application",
      url: "https://github.com/Snake52996/work-tracker/",
      license_name: "GNU Affero General Public License",
      license_url: "https://www.gnu.org/licenses/agpl-3.0.en.html#license-text",
    },
  ],
  [
    {
      name: "Bun",
      usage: "Package manager and JavaScript runtime",
      url: "https://bun.sh/",
      license_name: "MIT License",
      license_url: "https://bun.com/docs/project/license",
    },
    {
      name: "MaterialDesign-Webfont",
      usage: "Icon font",
      url: "https://github.com/Templarian/MaterialDesign-Webfont/",
      license_name: "Pictogrammers Free License",
      license_url: "https://pictogrammers.com/docs/general/license/",
    },
    {
      name: "argon2-browser",
      usage: "Implementation of Argon2, the KDF used",
      url: "https://github.com/antelle/argon2-browser/",
      license_name: "MIT License",
      license_url: "https://github.com/antelle/argon2-browser/blob/master/LICENSE",
    },
    {
      name: "@types/argon2-browser",
      usage: "Type definitions for argon2-browser",
      url: "https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/argon2-browser/",
      license_name: "MIT License",
      license_url: "https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE",
    },
    {
      name: "zip.js",
      usage: "Zip file creator",
      url: "https://gildas-lormeau.github.io/zip.js/",
      license_name: "BSD 3-Clause License",
      license_url: "https://github.com/gildas-lormeau/zip.js/blob/master/LICENSE",
    },
    {
      name: "pinia",
      usage: "Store / state manager",
      url: "https://pinia.vuejs.org/",
      license_name: "MIT License",
      license_url: "https://github.com/vuejs/pinia/blob/v3/LICENSE",
    },
    {
      name: "Vue.js",
      usage: "The progressive JavaScript framework",
      url: "https://vuejs.org/",
      license_name: "MIT License",
      license_url: "https://github.com/vuejs/core/blob/main/LICENSE",
    },
    {
      name: "vue-i18n",
      usage: "Internationalization plugin for Vue.js",
      url: "https://vue-i18n.intlify.dev/",
      license_name: "MIT License",
      license_url: "https://github.com/intlify/vue-i18n/blob/master/LICENSE",
    },
    {
      name: "Vuetify",
      usage: "Component Framework",
      url: "https://vuetifyjs.com/",
      license_name: "MIT License",
      license_url: "https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/LICENSE.md",
    },
    {
      name: "vite",
      usage: "Building tool",
      url: "https://vite.dev/",
      license_name: "MIT License",
      license_url: "https://github.com/vitejs/vite/blob/main/LICENSE",
    },
    {
      name: "terser",
      usage: "JavaScript mangler and compressor",
      url: "https://terser.org/",
      license_name: "BSD 2-Clause License",
      license_url: "https://github.com/terser/terser/blob/master/LICENSE",
    },
  ],
];
</script>
<style lang="css" scoped>
a {
  text-decoration: none;
  color: unset;
}
</style>
