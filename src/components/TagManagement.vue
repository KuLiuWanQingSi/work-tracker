<template>
  <v-select
    v-model="local_state.selected_entry"
    :items="[...database.tags.keys()]"
    :label="$t('maintenance.tag_management.entry_picker')"
    @update:model-value="reset_intermediate_states"
  />
  <v-text-field
    v-if="items.length > 5"
    v-model="local_state.entry_search"
    class="mx-8"
    clearable
    prepend-inner-icon="mdi-magnify"
  />
  <v-data-table-virtual
    v-if="local_state.selected_entry !== null"
    v-model="local_state.selected_tags"
    filter-keys="content"
    fixed-header
    :headers="headers"
    height="360px"
    :items="items"
    :search="local_state.entry_search"
    show-select
    striped="odd"
  >
    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-pencil-outline"
        size="small"
        variant="plain"
        @click="rename_tag(local_state.selected_entry, item.id, item.content)"
      />
      <v-btn
        icon="mdi-delete-outline"
        size="small"
        variant="plain"
        @click="remove_tag(local_state.selected_entry, item.id, item.references)"
      />
    </template>
  </v-data-table-virtual>
  <v-row class="mt-4" justify="space-between">
    <v-col cols="6">
      <v-btn
        v-if="local_state.selected_tags.length > 1"
        block
        @click="merge_tags(local_state.selected_entry!)"
      >
        {{ $t("maintenance.tag_management.merge_tags") }}
      </v-btn>
    </v-col>
    <v-col cols="6">
      <v-btn
        v-if="unused_tags.length > 0"
        block
        @click="
          remove_tags_internal(
            local_state.selected_entry!,
            unused_tags.map(({ id }) => id),
          )
        "
      >
        {{ $t("maintenance.tag_management.remove_unused_tags") }}
      </v-btn>
    </v-col>
  </v-row>

  <v-overlay v-model="local_state.dialog.shown" contained height="100%" width="100%">
    <v-confirm-edit
      :disabled="false"
      @cancel="local_state.dialog.shown = false"
      @save="
        local_state.dialog.next();
        local_state.dialog.shown = false;
      "
    >
      <template #default="{ actions }">
        <v-card class="mx-auto" max-width="60%" style="top: 50%; transform: translateY(-50%)">
          <v-card-title>{{ local_state.dialog.title }}</v-card-title>
          <v-card-text v-if="local_state.dialog.type === 'remove'">
            {{ $t("maintenance.tag_management.confirm_removal.explanation") }}
          </v-card-text>
          <v-card-text v-else-if="local_state.dialog.type === 'rename'">
            <v-text-field
              v-model="local_state.rename_into"
              :label="$t('maintenance.tag_management.confirm_rename.rename_into')"
            />
          </v-card-text>
          <v-card-text v-else-if="local_state.dialog.type === 'merge'">
            <v-select
              v-model="local_state.merge_into"
              :items="merge_options"
              :label="$t('maintenance.tag_management.confirm_merge.merge_into')"
            />
          </v-card-text>
          <template #actions>
            <v-spacer />
            <component :is="actions" />
          </template>
        </v-card>
      </template>
    </v-confirm-edit>
  </v-overlay>
</template>

<script setup lang="ts">
import type { Reactive } from "vue";
import type { TagEntryData } from "@/types/datasource-entry";
import { computed, reactive } from "vue";
import { i18n } from "@/locales";
import { useDatabaseStore } from "@/stores/database";
import { useNotifier } from "@/stores/notifier";

const database = useDatabaseStore();
const notifier = useNotifier();
const { t } = i18n.global;

const local_state: Reactive<{
  selected_entry: string | null;
  selected_tags: number[];
  entry_search: string;
  dialog: {
    shown: boolean;
    next: () => void;
    title: string;
    type: "rename" | "merge" | "remove";
  };
  rename_into: string;
  merge_into: number;
}> = reactive({
  selected_entry: null,
  selected_tags: [],
  entry_search: "",
  dialog: { shown: false, next: () => undefined, title: "", type: "remove" },
  rename_into: "",
  merge_into: 0,
});

function reset_intermediate_states() {
  local_state.selected_tags.splice(0);
  local_state.entry_search = "";
}

const headers = [
  { key: "id", extra: { align: "center" as const, sortable: true } },
  { key: "content", extra: { sortable: true } },
  { key: "references", extra: { sortable: true } },
  { key: "actions", extra: { sortable: false } },
].map(({ key, extra }) => ({
  key,
  title: t(`maintenance.tag_management.table.titles.${key}`),
  ...extra,
}));

const items = computed(() => {
  if (local_state.selected_entry === null) {
    return [];
  }
  const raw_tags = database.tags.get(local_state.selected_entry);
  if (raw_tags === undefined) {
    return [];
  }
  const result = raw_tags.map((content, index) => ({ id: index, content, references: 0, actions: "" }));
  for (const item of database.data.values()) {
    if (item.entries === undefined) {
      continue;
    }
    const defined_tags = item.entries.get(local_state.selected_entry) as TagEntryData | undefined;
    if (defined_tags === undefined) {
      continue;
    }
    for (const tag of defined_tags.tags) {
      result[tag]!.references += 1;
    }
  }
  return result;
});

const unused_tags = computed(() => items.value.filter(({ references }) => references === 0));
const merge_options = computed(() =>
  local_state.selected_tags.map(id => ({
    title: items.value[id]!.content,
    value: id,
  })),
);

function rename_tag(entry: string, id: number, content: string) {
  const job = (): void => {
    const new_name = local_state.rename_into.trim();
    if (new_name.length === 0) {
      notifier.post_notify(
        "error",
        t("message.error.failed_to_rename_tag"),
        t("message.error.empty_tag_name.brief") + ": " + t("message.error.empty_tag_name.detail"),
      );
      return;
    }
    const result = database.rename_tag(entry, id, new_name);
    if (result.is_err()) {
      notifier.post_notify("error", t("message.error.failed_to_rename_tag"), String(result.unwrap_error()));
    }
  };
  local_state.dialog.next = job;
  local_state.dialog.title = t("maintenance.tag_management.confirm_rename.title", { old_name: content });
  local_state.dialog.type = "rename";
  local_state.rename_into = content;
  local_state.dialog.shown = true;
}

function merge_tags(entry: string) {
  const job = (): void => {
    const result = database.merge_tags(entry, local_state.selected_tags, local_state.merge_into);
    if (result.is_err()) {
      notifier.post_notify("error", t("message.error.failed_to_remove_tag"), String(result.unwrap_error()));
    } else {
      local_state.selected_tags.splice(0);
    }
  };
  local_state.dialog.next = job;
  local_state.dialog.title = t("maintenance.tag_management.confirm_merge.title");
  local_state.dialog.type = "merge";
  local_state.merge_into = local_state.selected_tags[0]!;
  local_state.dialog.shown = true;
}

function remove_tags_internal(entry: string, id: number[]) {
  const result = database.remove_tag(entry, id);
  if (result.is_err()) {
    notifier.post_notify("error", t("message.error.failed_to_remove_tag"), String(result.unwrap_error()));
  }
}

function remove_tag(entry: string, id: number, references: number) {
  const job = (): void => {
    remove_tags_internal(entry, [id]);
  };
  if (references > 0) {
    local_state.dialog.next = job;
    local_state.dialog.title = t("maintenance.tag_management.confirm_removal.title");
    local_state.dialog.type = "remove";
    local_state.dialog.shown = true;
  } else {
    job();
  }
}
</script>
