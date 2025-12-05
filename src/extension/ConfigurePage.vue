<template>
  <v-app>
    <main v-if="userscript_ready">
      <v-container>
        <v-alert border="start" closable title="Do not use WT Injector on untrusted devices!" type="warning">
          WT Injector caches the (transformed) password you input in this page. The will not leak your actual
          password, but is sufficient for anyone who acquires this cached value to decrypt your database.
          Therefore, do not use this injector on devices that you do not trust! You should not input any of
          your password on devices that you do not trust anyway.
        </v-alert>
        <v-card class="my-4">
          <v-card-title>Indicator Legends</v-card-title>
          <v-card-text>
            <v-row justify="space-around">
              <v-col v-for="name in indicator_states" :key="name" class="flex-grow-0">
                <div :id="`indicator-${name}`" style="width: 50px; height: 50px; margin: auto" />
                <p style="text-align: center">{{ name }}</p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card class="my-8" color="secondary">
          <v-card-title>Databases</v-card-title>
          <v-card-text>
            <v-card
              v-for="(database, index) in local_side_components.databases"
              :id="`database-${database.id}`"
              :key="database.id"
              class="my-4"
              color="indigo-darken-3"
            >
              <v-card-title>{{
                index === modification_times.databases.length ? "create a new database" : database.name
              }}</v-card-title>
              <v-card-text>
                <v-text-field v-model="database.name" label="name" />
                <v-text-field v-model="database.url" label="URL" />
                <v-text-field v-model="database.password" label="password" type="password" />
                <div v-if="index !== modification_times.databases.length">
                  {{ `Last updated: ${modification_times.databases[index]!.toLocaleString()}` }}
                </div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <template v-if="index === modification_times.databases.length">
                  <v-btn
                    color="primary"
                    :disabled="
                      [database.name, database.url, database.password].some(value => value.length === 0)
                    "
                    @click="create_database"
                  >
                    create
                  </v-btn>
                  <v-btn color="error" @click="clear_database(database)">clear</v-btn>
                </template>
                <template v-else>
                  <v-btn @click="update_database(index)">
                    {{
                      is_modified(database, saved_local_side_components.databases[index]!) ||
                      database.password.length > 0
                        ? "update"
                        : "refetch"
                    }}
                  </v-btn>
                  <v-btn
                    color="warning"
                    @click="from_save_database(database, saved_local_side_components.databases[index]!)"
                  >
                    reset
                  </v-btn>
                  <v-btn color="error" @click="remove_database(index)">remove</v-btn>
                </template>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
        <v-card class="my-8" color="secondary">
          <v-card-title>Scripts</v-card-title>
          <v-card-text>
            <v-card
              v-for="(script, index) in local_side_components.scripts"
              :id="`script-${script.id}`"
              :key="script.id"
              class="my-4"
              color="indigo-darken-3"
            >
              <v-card-title>{{
                index === modification_times.scripts.length ? "create a new script" : script.name
              }}</v-card-title>
              <v-card-text>
                <v-text-field v-model="script.name" label="name" />
                <v-radio-group
                  v-model="script.type"
                  inline
                  label="type"
                  @update:model-value="script.source = ''"
                >
                  <v-radio label="remote" value="remote" />
                  <v-radio label="local" value="local" />
                </v-radio-group>
                <v-radio-group v-model="script.mode" inline label="mode">
                  <v-radio label="module" value="module" />
                  <v-radio label="classic" value="classic" />
                </v-radio-group>
                <v-text-field v-if="script.type === 'remote'" v-model="script.source" label="url" />
                <v-textarea v-else v-model="script.source" label="code" no-resize rows="8" />
                <div v-if="index !== modification_times.scripts.length">
                  {{ `Last updated: ${modification_times.scripts[index]!.toLocaleString()}` }}
                </div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <template v-if="index === modification_times.scripts.length">
                  <v-btn
                    color="primary"
                    :disabled="
                      [script.name, script.mode, script.type, script.source].some(value => value.length === 0)
                    "
                    @click="create_script(script)"
                  >
                    create
                  </v-btn>
                  <v-btn color="error" @click="clear_script(script)">clear</v-btn>
                </template>
                <template v-else>
                  <v-btn
                    :disabled="
                      !is_modified(script, saved_local_side_components.scripts[index]!) &&
                      script.type === 'local'
                    "
                    @click="update_script(index)"
                  >
                    {{
                      is_modified(script, saved_local_side_components.scripts[index]!) ? "update" : "refetch"
                    }}
                  </v-btn>
                  <v-btn
                    color="warning"
                    @click="from_save_script(script, saved_local_side_components.scripts[index]!)"
                  >
                    reset
                  </v-btn>
                  <v-btn color="error" @click="remove_script(index)">remove</v-btn>
                </template>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
        <v-card class="my-8" color="secondary">
          <v-card-title>Hosts</v-card-title>
          <v-card-text>
            <v-card
              v-for="(host, index) in local_side_components.hosts"
              :id="`host-${host.id}`"
              :key="host.id"
              class="my-4"
              color="indigo-darken-3"
            >
              <v-card-title>{{
                index === saved_local_side_components.hosts.length ? "create a new host" : host.name
              }}</v-card-title>
              <v-card-text>
                <v-text-field v-model="host.name" label="name" />
                <v-text-field v-model="host.host" label="matcher" />
                <v-select
                  v-model="host.database"
                  append-icon="mdi-open-in-new"
                  item-title="name"
                  item-value="id"
                  :items="local_side_components.databases.filter(database => database.id.length > 0)"
                  label="database"
                  @click:append="goto(`#database-${host.database}`)"
                />
                <v-select
                  v-model="host.script"
                  append-icon="mdi-open-in-new"
                  item-title="name"
                  item-value="id"
                  :items="local_side_components.scripts.filter(script => script.id.length > 0)"
                  label="script"
                  @click:append="goto(`#script-${host.script}`)"
                />
              </v-card-text>
              <v-card-actions class="justify-end">
                <template v-if="index === saved_local_side_components.hosts.length">
                  <v-btn
                    color="primary"
                    :disabled="
                      [host.name, host.host, host.database, host.script].some(value => value.length === 0)
                    "
                    @click="create_host(host)"
                  >
                    create
                  </v-btn>
                  <v-btn color="error" @click="clear_host(host)">clear</v-btn>
                </template>
                <template v-else>
                  <v-btn
                    :disabled="!is_modified(host, saved_local_side_components.hosts[index]!)"
                    @click="update_host(index)"
                  >
                    update
                  </v-btn>
                  <v-btn
                    v-if="is_modified(host, saved_local_side_components.hosts[index]!)"
                    color="warning"
                    @click="from_save_host(host, saved_local_side_components.hosts[index]!)"
                  >
                    reset
                  </v-btn>
                  <v-btn v-else color="error" @click="remove_host(index)">remove</v-btn>
                </template>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
        <div class="fill-width">
          <v-btn block class="my-2" color="primary" @click="update_all">refetch all</v-btn>
          <v-btn block class="my-2" color="secondary" @click="export_settings">export settings</v-btn>
          <v-btn
            block
            class="my-2"
            color="secondary"
            @click="
              import_export.content = '';
              import_export.readonly = false;
              import_export.shown = true;
            "
          >
            import settings
          </v-btn>
          <v-btn block class="my-2" color="error" @click="remove_all_shield = !remove_all_shield">
            delete all
          </v-btn>
          <v-btn v-show="!remove_all_shield" block color="error" @click="remove_all">
            I am sure: delete all!
          </v-btn>
        </div>
      </v-container>
      <v-dialog v-model="errors.shown">
        <v-alert
          border="start"
          closable
          :title="errors.title"
          type="error"
          @click:close.stop="errors.shown = false"
        >
          <p v-for="(line, index) in errors.content.split('\n')" :key="index">{{ line }}</p>
        </v-alert>
      </v-dialog>
      <v-dialog v-model="loading.shown" persistent width="max-content">
        <v-list class="py-2" color="primary" elevation="12" rounded="lg">
          <v-list-item prepend-icon="mdi-information-outline" :title="loading.description">
            <template #prepend>
              <div class="pe-4">
                <v-icon color="primary" size="x-large" />
              </div>
            </template>

            <template #append>
              <v-progress-circular
                class="mx-4"
                color="primary"
                indeterminate="disable-shrink"
                size="32"
                width="3"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-dialog>
      <v-bottom-sheet v-model="import_export.shown" inset>
        <v-sheet class="pb-12">
          <v-textarea
            v-model="import_export.content"
            label="exported data"
            no-resize
            :readonly="import_export.readonly"
            rows="16"
          />
          <v-btn
            block
            color="success"
            prepend-icon="mdi-check-circle"
            @click="import_export.readonly ? (import_export.shown = false) : import_settings()"
          />
        </v-sheet>
      </v-bottom-sheet>
    </main>
    <main v-else-if="userscript_locked">
      Cannot lock the store. It is likely that another configuration page is already opened: modifying
      configurations from multiple pages is not supported. If you are very sure that this is a mistake,
      <button @click="force_retry">click this button</button>.
    </main>
    <main v-else>
      <p>
        You need to install the work tracker injector script first, which requires
        <a href="https://violentmonkey.github.io/" referrerpolicy="no-referrer">Violentmonkey</a>.
      </p>
      <p>
        If you have already installed it but still seeing this, your installation is probability outdated.
      </p>
      <p><a href="./wt-injector.user.js">Click here</a> to install the script, then reload this page.</p>
    </main>
    <v-footer>
      <v-row class="fill-width" justify="space-between">
        <v-col style="text-align: center">
          <a
            href="https://github.com/Snake52996/work-tracker/tree/main/src/extension"
            style="text-decoration: none; color: unset"
          >
            visit codebase on GitHub
          </a>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts" setup>
import type { Reactive, Ref } from "vue";
import type { Failure, Result } from "@/types/result";
import { nextTick, onMounted, reactive, readonly, ref } from "vue";
import { useGoTo } from "vuetify";

import {
  InjectorConfiguration,
  type InjectorDatabases,
  type InjectorHosts,
  type InjectorScripts,
} from "./types/configuration";
import { Indicator, type IndicatorState } from "./types/indicator";
import versions from "./versions.json";

const goto = useGoTo();

type SavedDatabase = {
  name: string;
  url: string;
};
type LocalDatabase = SavedDatabase & {
  id: string;
  password: string;
};
type SavedScript = {
  name: string;
  type: "local" | "remote";
  mode: "classic" | "module";
  source: string;
};
type LocalScript = SavedScript & {
  id: string;
};
type SavedHost = {
  name: string;
  host: string;
  database: string;
  script: string;
};
type LocalHost = SavedHost & {
  id: string;
};
type LocalConfigure = {
  databases: LocalDatabase[];
  scripts: LocalScript[];
  hosts: LocalHost[];
};
type SavedConfigure = {
  databases: SavedDatabase[];
  scripts: SavedScript[];
  hosts: SavedHost[];
};
function to_local_database(source: InjectorDatabases): LocalDatabase {
  return {
    id: source.id,
    name: source.name,
    url: source.url.href,
    password: "",
  };
}
function to_local_script(source: InjectorScripts): LocalScript {
  return {
    id: source.id,
    name: source.name,
    type: source.url === undefined ? "local" : "remote",
    mode: source.mode,
    source: source.url === undefined ? source.content : source.url.href,
  };
}
function to_local_host(source: InjectorHosts): LocalHost {
  return {
    id: source.id,
    name: source.name,
    host: source.host,
    database: source.database_id,
    script: source.script_id,
  };
}
function to_save_database(source: LocalDatabase): SavedDatabase {
  return {
    name: source.name,
    url: source.url,
  };
}
function to_save_script(source: LocalScript): SavedScript {
  return {
    name: source.name,
    type: source.type,
    mode: source.mode,
    source: source.source,
  };
}
function to_save_host(source: LocalHost): SavedHost {
  return {
    name: source.name,
    host: source.host,
    database: source.database,
    script: source.script,
  };
}
function clear_database(target: LocalDatabase) {
  target.name = "";
  target.password = "";
  target.url = "";
}
function clear_script(target: LocalScript) {
  target.mode = "module";
  target.name = "";
  target.type = "remote";
  target.source = "";
}
function clear_host(target: LocalHost) {
  target.host = "";
  target.name = "";
}
function from_save_database(destination: LocalDatabase, source: SavedDatabase) {
  clear_database(destination);
  destination.name = source.name;
  destination.url = source.url;
}
function from_save_script(destination: LocalScript, source: SavedScript) {
  clear_script(destination);
  destination.name = source.name;
  destination.type = source.type;
  destination.mode = source.mode;
  destination.source = source.source;
}
function from_save_host(destination: LocalHost, source: SavedHost) {
  clear_host(destination);
  destination.name = source.name;
  destination.host = source.host;
  destination.database = source.database;
  destination.script = source.script;
}
function is_modified(local: LocalDatabase, saved: SavedDatabase): boolean;
function is_modified(local: LocalScript, saved: SavedScript): boolean;
function is_modified(local: LocalHost, saved: SavedHost): boolean;
function is_modified(
  local: LocalDatabase | LocalScript | LocalHost,
  saved: SavedDatabase | SavedScript | SavedHost,
): boolean {
  // @ts-ignore
  return Object.keys(saved).some(key => local[key] !== saved[key]);
}

const userscript_ready: Ref<boolean> = ref(false);
const userscript_locked: Ref<boolean> = ref(false);
const script_side_components: { configure: InjectorConfiguration | undefined } = { configure: undefined };
const local_side_components: Reactive<LocalConfigure> = reactive({
  databases: [],
  scripts: [],
  hosts: [],
});
const saved_local_side_components: SavedConfigure = {
  databases: [],
  scripts: [],
  hosts: [],
};
const modification_times: Reactive<{
  databases: Date[];
  scripts: Date[];
}> = reactive({
  databases: [],
  scripts: [],
});

function build_local_structures() {
  const configuration = script_side_components.configure!;

  local_side_components.databases.length = 0;
  local_side_components.scripts.length = 0;
  local_side_components.hosts.length = 0;
  saved_local_side_components.databases.length = 0;
  saved_local_side_components.scripts.length = 0;
  saved_local_side_components.hosts.length = 0;
  modification_times.databases.length = 0;
  modification_times.scripts.length = 0;

  for (const database of configuration.databases) {
    const local_database = to_local_database(database);
    local_side_components.databases.push(local_database);
    saved_local_side_components.databases.push(to_save_database(local_database));
    modification_times.databases.push(database.update_time);
  }
  for (const script of configuration.scripts) {
    const local_script = to_local_script(script);
    local_side_components.scripts.push(local_script);
    saved_local_side_components.scripts.push(to_save_script(local_script));
    modification_times.scripts.push(script.update_time);
  }
  for (const host of configuration.hosts) {
    const local_host = to_local_host(host);
    local_side_components.hosts.push(local_host);
    saved_local_side_components.hosts.push(to_save_host(local_host));
  }
  // place placeholder elements to help creating new elements
  local_side_components.databases.push({ id: "", name: "", url: "", password: "" });
  local_side_components.scripts.push({ id: "", name: "", type: "remote", mode: "module", source: "" });
  local_side_components.hosts.push({ id: "", name: "", host: "", database: "", script: "" });
}
async function force_retry() {
  await script_side_components.configure!.doom_the_lock();
  window.location.reload();
}
const indicator_states = readonly([
  "loading",
  "active",
  "dangling",
  "updating",
  "pending-update",
  "degraded",
  "failed",
] as IndicatorState[]);
onMounted(() => {
  window.addEventListener("injector-ready", event => {
    const load_result = (event as CustomEvent<Result<InjectorConfiguration>>).detail;
    if (load_result.is_err()) {
      return;
    }
    script_side_components.configure = load_result.unwrap();
    if (script_side_components.configure.get_interface_version() !== versions.interface_version) {
      return; // terminate since the interface version mismatched
    }
    script_side_components.configure
      .lock(modified => {
        if (modified.is_err()) {
          _display_failure_as_error(modified.unwrap_error());
          return;
        }
        const { databases, scripts } = modified.unwrap();
        for (const database of databases) {
          const index = local_side_components.databases.findIndex(item => item.id === database.id);
          modification_times.databases[index] = database.time;
        }
        for (const script of scripts) {
          const index = local_side_components.scripts.findIndex(item => item.id === script.id);
          modification_times.scripts[index] = script.time;
        }
      })
      .then(result => {
        if (result.is_err()) {
          _display_failure_as_error(result.unwrap_error());
          userscript_locked.value = true;
          return;
        }
        window.addEventListener("beforeunload", () => {
          script_side_components.configure!.unlock();
        });
        build_local_structures();
        userscript_ready.value = true;
        {
          const css = document.createElement("style");
          css.textContent = Indicator.get_css();
          document.head.append(css);
        }
        nextTick().then(() => {
          for (const state of indicator_states) {
            const indicator = new Indicator(document.querySelector(`#indicator-${state}`)!);
            indicator.state = state;
          }
        });
      });
  });
});

const errors: Reactive<{ shown: boolean; title: string; content: string }> = reactive({
  shown: false,
  title: "",
  content: "",
});
const loading: Reactive<{ shown: boolean; description: string }> = reactive({
  shown: false,
  description: "",
});

function _display_error(title: string, content?: string) {
  errors.title = title;
  errors.content = content ?? "";
  errors.shown = true;
}

function _display_failure_as_error(failure: Failure) {
  _display_error(failure.brief, failure.detail);
  console.warn(failure.stack);
}

async function _rpc_wrapper(callable: () => Promise<void>, brief: string) {
  try {
    loading.description = `Making change: ${brief}...`;
    loading.shown = true;
    await callable();
    loading.shown = false;
  } catch (error) {
    _display_error(`Failed to ${brief}`, String(error));
    loading.shown = false;
    errors.shown = true;
    console.log(error);
  }
}

function create_database() {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const new_local_database = local_side_components.databases.at(-1)!;
    const database = await configuration.new_database(
      new_local_database.name,
      new_local_database.url,
      new_local_database.password,
    );
    if (database.is_err()) {
      _display_failure_as_error(database.unwrap_error());
      return;
    }
    const received_database = database.unwrap();
    const received_local_database = to_local_database(received_database);
    local_side_components.databases.splice(-1, 0, received_local_database);
    saved_local_side_components.databases.push(to_save_database(received_local_database));
    modification_times.databases.push(received_database.update_time);
    clear_database(new_local_database);
  }, "create database");
}
function update_database(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const modified = local_side_components.databases[index]!;
    const original = saved_local_side_components.databases[index]!;
    const id = modified.id;
    const modifications = {
      name: modified.name === original.name ? undefined : modified.name,
      url: modified.url === original.url ? undefined : modified.url,
      password: modified.password.length === 0 ? undefined : modified.password,
    };
    const updated_database = await configuration.update_database(id, modifications);
    if (updated_database.is_err()) {
      _display_failure_as_error(updated_database.unwrap_error());
      return;
    }
    const received_database = updated_database.unwrap();
    modified.name = received_database.name;
    modified.url = received_database.url.href;
    modified.password = "";
    original.name = modified.name;
    original.url = modified.url;
    modification_times.databases[index] = received_database.update_time;
  }, "update database");
}
function remove_database(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const result = await configuration.remove_database(local_side_components.databases[index]!.id);
    if (result.is_err()) {
      _display_failure_as_error(result.unwrap_error());
      return;
    }
    local_side_components.databases.splice(index, 1);
    saved_local_side_components.databases.splice(index, 1);
    modification_times.databases.splice(index, 1);
  }, "remove database");
}
function create_script(script: LocalScript) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const new_script = await configuration.new_script(script.name, script.type, script.mode, script.source);
    if (new_script.is_err()) {
      _display_failure_as_error(new_script.unwrap_error());
      return;
    }
    const new_remote_script = new_script.unwrap();
    const new_local_script = to_local_script(new_remote_script);
    local_side_components.scripts.splice(-1, 0, new_local_script);
    saved_local_side_components.scripts.push(to_save_script(new_local_script));
    modification_times.scripts.push(new_remote_script.update_time);
    clear_script(script);
  }, "create script");
}
function update_script(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const modified = local_side_components.scripts[index]!;
    const original = saved_local_side_components.scripts[index]!;
    const id = modified.id;
    const modifications = {
      name: modified.name === original.name ? undefined : modified.name,
      mode: modified.mode === original.mode ? undefined : modified.mode,
      type: modified.type === original.type ? undefined : modified.type,
      source: modified.source === original.source ? undefined : modified.source,
    };
    const update_result = await configuration.update_script(id, modifications);
    if (update_result.is_err()) {
      _display_failure_as_error(update_result.unwrap_error());
      return;
    }
    const updated_script = update_result.unwrap();
    modified.name = updated_script.name;
    modified.mode = updated_script.mode;
    modified.type = updated_script.url === undefined ? "local" : "remote";
    modified.source = updated_script.url === undefined ? updated_script.content : updated_script.url.href;
    original.name = modified.name;
    original.mode = modified.mode;
    original.type = modified.type;
    original.source = modified.source;
    modification_times.scripts[index] = updated_script.update_time;
  }, "update script");
}
function remove_script(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const result = await configuration.remove_script(local_side_components.scripts[index]!.id);
    if (result.is_err()) {
      _display_failure_as_error(result.unwrap_error());
      return;
    }
    local_side_components.scripts.splice(index, 1);
    saved_local_side_components.scripts.splice(index, 1);
    modification_times.scripts.splice(index, 1);
  }, "remove script");
}
function create_host(host: LocalHost) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const create_result = await configuration.new_host(host.name, host.host, host.database, host.script);
    if (create_result.is_err()) {
      _display_failure_as_error(create_result.unwrap_error());
      return;
    }
    const local_host = to_local_host(create_result.unwrap());
    local_side_components.hosts.splice(-1, 0, local_host);
    saved_local_side_components.hosts.push(to_save_host(local_host));
    clear_host(host);
  }, "create host");
}
function update_host(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const host = local_side_components.hosts[index]!;
    const backup = saved_local_side_components.hosts[index]!;
    const update_result = await configuration.update_host(host.id, {
      name: host.name === backup.name ? undefined : host.name,
      matcher: host.host === backup.host ? undefined : host.host,
      database_id: host.database === backup.database ? undefined : host.database,
      script_id: host.script === backup.script ? undefined : host.script,
    });
    if (update_result.is_err()) {
      _display_failure_as_error(update_result.unwrap_error());
      return;
    }
    const updated = update_result.unwrap();
    host.name = updated.name;
    backup.name = updated.name;
    host.host = updated.host;
    backup.host = updated.host;
    host.database = updated.database_id;
    backup.database = updated.database_id;
    host.script = updated.script_id;
    backup.script = updated.script_id;
  }, "update host");
}
function remove_host(index: number) {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const host = local_side_components.hosts[index]!;
    const result = await configuration.remove_host(host.id);
    if (result.is_err()) {
      _display_failure_as_error(result.unwrap_error());
      return;
    }
    local_side_components.hosts.splice(index, 1);
    saved_local_side_components.hosts.splice(index, 1);
  }, "update host");
}

function update_all() {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const failed_targets: string[] = [];
    const databases = local_side_components.databases.map(async (database, index) => {
      if (index === local_side_components.databases.length - 1) {
        return;
      }
      const update_result = await configuration.update_database(database.id, {});
      if (update_result.is_err()) {
        failed_targets.push(`database-${database.name}: ${update_result.unwrap_error()}`);
        return;
      }
      local_side_components.databases[index] = to_local_database(update_result.unwrap());
    });
    const scripts = local_side_components.scripts.map(async (script, index) => {
      if (index === local_side_components.scripts.length - 1) {
        return;
      }
      const update_result = await configuration.update_script(script.id, {});
      if (update_result.is_err()) {
        failed_targets.push(`script-${script.name}: ${update_result.unwrap_error()}`);
        return;
      }
      local_side_components.scripts[index] = to_local_script(update_result.unwrap());
    });
    const results = await Promise.allSettled(databases.concat(scripts));
    for (const result of results) {
      if (result.status === "fulfilled") {
        continue;
      }
      failed_targets.push(`unknown uncaptured error: ${result.reason}`);
      console.log(result.reason);
    }
    if (failed_targets.length > 0) {
      _display_error(
        "Following errors occurred and corresponding elements are not updated",
        failed_targets.join("\n"),
      );
    }
  }, "update all");
}

const import_export: Reactive<{ shown: boolean; content: string; readonly: boolean }> = reactive({
  shown: false,
  content: "",
  readonly: true,
});
async function export_settings() {
  const configuration = script_side_components.configure!;
  const data = configuration.toJSON();
  try {
    await navigator.clipboard.writeText(data);
  } catch {
    import_export.content = data;
    import_export.readonly = true;
    import_export.shown = true;
  }
}
async function import_settings() {
  const configuration = script_side_components.configure!;
  const settings = import_export.content;
  import_export.shown = false;
  _rpc_wrapper(async () => {
    const result = configuration.replace_with_JSON(settings);
    if (result.is_err()) {
      _display_failure_as_error(result.unwrap_error());
      return;
    }
    build_local_structures();
  }, "import settings");
}
const remove_all_shield: Ref<boolean> = ref(true);
async function remove_all() {
  const configuration = script_side_components.configure!;
  _rpc_wrapper(async () => {
    const empty_settings = new InjectorConfiguration();
    const result = configuration.replace_with_JSON(empty_settings.toJSON());
    if (result.is_err()) {
      _display_failure_as_error(result.unwrap_error());
      return;
    }
    build_local_structures();
  }, "remove everything");
}
</script>
