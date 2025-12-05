<template>
  <v-btn class="mb-8" prepend-icon="mdi-arrow-left" @click="emit('prev')">
    {{ $t("action.back_to_last_step") }}
  </v-btn>
  <v-card
    :subtitle="$t('datasource_creation.entry_setting_detail')"
    :title="$t('datasource_creation.entry_setting')"
  >
    <v-card-text>
      <v-sheet>
        <v-container>
          <v-switch
            v-model="include_image"
            color="primary"
            :label="$t('datasource_creation.include_image')"
          />
          <v-row v-if="include_image" align="center">
            <v-col>
              <v-text-field
                v-model="image_width"
                hide-details
                :prefix="$t('datasource_creation.width')"
                :suffix="$t('datasource_creation.pixel')"
              />
            </v-col>
            <v-col style="flex-grow: 0">
              <v-icon icon="mdi-circle-small" />
            </v-col>
            <v-col>
              <v-text-field
                v-model="image_height"
                hide-details
                :prefix="$t('datasource_creation.height')"
                :suffix="$t('datasource_creation.pixel')"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-6" />
      </v-sheet>
      <datasource-creation-entry-base
        v-for="(id, index) in entry_details"
        :key="id"
        ref="entries"
        :control-value="id"
        :index="index"
        :total="entry_details.length"
        @move-down="move_entry_down(index)"
        @move-up="move_entry_up(index)"
        @remove="remove_entry(index)"
      />
      <v-btn block prepend-icon="mdi-plus-thick" @click="add_new_entry">{{
        $t("datasource_creation.add_new_entry")
      }}</v-btn>
    </v-card-text>
  </v-card>
  <v-container class="mt-8">
    <v-row>
      <v-spacer />
      <v-btn
        append-icon="mdi-arrow-right"
        color="primary"
        :disabled="!can_go_next"
        @click="send_configurations"
      >
        {{ $t("action.continue_to_next_step") }}
      </v-btn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import type { Ref, ShallowReactive } from "vue";
import type { DatasourceEntryAPI, EntriesConfiguration } from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";
import { computed, inject, ref, shallowReactive, useTemplateRef } from "vue";

import { i18n } from "@/locales";
import { inj_DisplayNotice } from "@/types/injections";

const { t } = i18n.global;
const emit = defineEmits<{
  next: [EntriesConfiguration];
  prev: [];
}>();
const display_notice = inject(inj_DisplayNotice)!;

// if an image should be included for each item
const include_image: Ref<boolean> = ref(false);
// shape of the image to include
const image_width: Ref<number> = ref(240);
const image_height: Ref<number> = ref(135);

// an array holding id of entry details: this is an array of uuids which triggers the list rendering and
//  allowing components reused when they are only reordered
const entry_details: ShallowReactive<string[]> = shallowReactive([]);
// keep references about added entries
const entries = useTemplateRef<DatasourceEntryAPI[]>("entries");

// is continuing to next step allowed
const can_go_next = computed(() => {
  return include_image.value || entries.value?.length;
});

function add_new_entry() {
  const name = crypto.randomUUID();
  entry_details.push(name);
}
function move_entry_up(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  entry_details.splice(index - 1, 2, entry_details[index] ?? "", entry_details[index - 1] ?? "");
}
function move_entry_down(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  entry_details.splice(index, 2, entry_details[index + 1] ?? "", entry_details[index] ?? "");
}
function remove_entry(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  entry_details.splice(index, 1);
}

function send_configurations() {
  if (entries.value === null) {
    return;
  }

  // collect entries
  const entry_configurations = entries.value.map(node => node.get_configuration());
  // use a set to make sure names of entries must be unique
  const names: Set<string> = new Set();
  const failed_entries: number[] = [];
  // mark entry that returned error: that is those returned null as configuration
  for (const [index, value] of entry_configurations.entries()) {
    if (value !== null) {
      names.add(value.name);
      continue;
    }
    failed_entries.push(index);
  }
  // stop in case any error is encountered or the name is not unique
  if (failed_entries.length > 0) {
    display_notice(
      "error",
      t("message.error.failed_to_config_entries"),
      failed_entries.map(index => index.toString()).join(", "),
    );
    return;
  }
  if (names.size !== entry_configurations.length) {
    display_notice("error", t("message.error.duplicated_entries_defined"), "");
    return;
  }

  emit("next", {
    image_size: include_image.value
      ? { width: Number(image_width.value), height: Number(image_height.value) }
      : undefined,
    entries: entry_configurations as DatasourceEntryConfiguration[],
  });
}
</script>
