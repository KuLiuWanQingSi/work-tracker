<!-- Select datasource: load from local directory, remote url or create a new database? -->

<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-card elevated max-width="648" width="75%" :loading="loading">
        <v-card-title>{{ $t("message.select_datasource") }}</v-card-title>
        <v-card-subtitle>{{ $t("message.select_datasource_detail") }}</v-card-subtitle>
        <v-card-text v-if="ask_password">
          <v-text-field
            v-model="password"
            variant="outlined"
            :type="show_password ? 'text' : 'password'"
            :append-icon="show_password ? 'mdi-eye-off' : 'mdi-eye'"
            :label="$t('message.input_password')"
            @click:append="show_password = !show_password"
            @keydown.enter="phase2_function"
          ></v-text-field>
          <v-btn color="primary" class="my-4" block :disable="password !== ''" @click="phase2_function">{{
            $t("action.open")
          }}</v-btn>
        </v-card-text>
        <v-card-text v-else>
          <v-text-field
            v-model="url"
            density="comfortable"
            prepend-icon="mdi-link-variant"
            clearable
            :label="$t('message.input_remote_url')"
            @keydown.enter="!!url && load_from_remote_url()"
          >
            <template v-slot:append>
              <v-btn icon="mdi-download" :disabled="!url" @click="load_from_remote_url"></v-btn>
            </template>
          </v-text-field>
          <v-file-input
            density="compact"
            prepend-icon="mdi-folder"
            webkitdirectory
            multiple
            :label="$t('message.input_local_directory')"
            @update:model-value="load_from_local_directory_phase1"
          ></v-file-input>
          <v-divider>{{ $t("message.alternative_way") }}</v-divider>
          <v-btn color="info" class="my-4" block to="/NewDatasource">{{
            $t("message.create_new_datasource")
          }}</v-btn>
          <div class="mt-12">
            <LanguageSelector />
          </div>
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { i18n } from "@/locales";
import { load_datasource_phase1, load_datasource_phase2 } from "@/procedures/crypto-readonly";
import { useDatabaseStore } from "@/stores/database";
import type { EncryptedDatasource } from "@/types/datasource";
import type { ImageLoader } from "@/types/datasource-images";
import { inj_DisplayNotice } from "@/types/injections";

import type { Ref } from "vue";
import { inject, ref } from "vue";

const { t } = i18n.global;
const display_notice = inject(inj_DisplayNotice)!;
const loading: Ref<boolean> = ref(false);
const ask_password: Ref<boolean> = ref(false);
const password: Ref<string> = ref("");
const show_password: Ref<boolean> = ref(false);
const phase2_function: Ref<() => void> = ref(() => {});
const router = useRouter();
const database_store = useDatabaseStore();

// variable to collect the url
const url: Ref<string> = ref("");

function open_database_phase2(encrypted_database: EncryptedDatasource, image_loader: ImageLoader) {
  loading.value = true;
  load_datasource_phase2(encrypted_database, password.value, image_loader).then((database) => {
    loading.value = false;
    database_store.build_runtime_database(database);
    router.push("/Main");
  });
}

function load_from_remote_url() {
  loading.value = true;
  // check the URL entered, add https:// protocol prefix if no prefix is given
  //  since we expect to receive URL pointing to a directory, we ensure the url ends with a "/"
  const padded_url = url.value.endsWith("/") ? url.value : `${url.value}/`;
  const base_url = [padded_url, `https://${padded_url}`]
    .map((url) => URL.parse(url))
    .filter((value) => value !== null)[0];
  if (base_url === undefined) {
    display_notice("error", "message.error.invalid_url", "");
    loading.value = false;
    return;
  }

  // place fetching into async lambda expression to make the code clean
  (async () => {
    // try to fetch data.json
    const path = URL.parse("data.json", base_url)!;
    const response = await fetch(path);
    if (!response.ok) {
      display_notice(
        "error",
        t("message.error.failed_to_fetch_data", { source: path.toString() }),
        `${response.status}: ${response.statusText}`
      );
      return;
    }
    const database_source = await response.text();
    phase2_function.value = () => {
      open_database_phase2(load_datasource_phase1(database_source), (name: string) => {
        const target_url = URL.parse(name, base_url);
        if (target_url === null) {
          return null;
        }
        return new Promise((resolve, _) => {
          const request = fetch(target_url);
          request.then((response) => {
            response.blob().then((result) => {
              resolve(result);
            });
          });
        });
      });
    };
    ask_password.value = true;
  })().then(() => {
    loading.value = false;
  });
}

function load_from_local_directory_phase1(input_file: File | File[] | undefined) {
  if (input_file === undefined) {
    return;
  }
  loading.value = true;
  const files = input_file instanceof Array ? input_file : [input_file];

  (async () => {
    // filter out files in subdirectories
    const root_files = files.filter((file) => file.webkitRelativePath.split("/").length === 2);
    // construct a mapping for fast access
    const file_lookup_table = new Map<string, File>(
      root_files.map((file) => [file.webkitRelativePath.split("/")[1] ?? "", file])
    );
    const database_file = file_lookup_table.get("data.json");
    if (database_file === undefined) {
      return null;
    }
    const database_source = await database_file.text();
    phase2_function.value = () => {
      open_database_phase2(load_datasource_phase1(database_source), (name: string) => {
        const file = file_lookup_table.get(name);
        if (file === undefined) {
          return null;
        }
        return new Promise((resolve, _) => {
          resolve(file);
        });
      });
    };
    loading.value = false;
    ask_password.value = true;
  })();
}
</script>
