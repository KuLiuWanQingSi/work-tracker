<template>
  <v-btn class="mb-8" prepend-icon="mdi-arrow-left" @click="emit('prev')">
    {{ $t("action.back_to_last_step") }}
  </v-btn>
  <v-card
    :subtitle="$t('datasource_creation.entry_setting_detail')"
    :title="$t('datasource_creation.entry_setting')"
  >
    <v-card-text>
      <v-file-input
        filter-by-type="application/json"
        :hint="$t('datasource_creation.load_existing_configuration.hint')"
        :label="$t('datasource_creation.load_existing_configuration.label')"
        persistent-hint
        @update:model-value="load_existing_configure"
      />
      <v-sheet>
        <v-container>
          <v-switch
            v-model="image_configuration.included"
            color="primary"
            :label="$t('datasource_creation.include_image')"
          />
          <v-row v-if="image_configuration.included" align="center">
            <v-col>
              <v-text-field
                v-model="image_configuration.width"
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
                v-model="image_configuration.height"
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
        v-for="({ unique_id }, index) in entry_configurations"
        :key="unique_id"
        v-model="entry_configurations[index]!.configuration"
        :index="index"
        :total="entry_configurations.length"
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
        v-if="configuration_invalid_reasons.length === 0"
        append-icon="mdi-arrow-right"
        color="primary"
        @click="send_configurations"
      >
        {{ $t("action.continue_to_next_step") }}
      </v-btn>
      <v-btn
        v-else
        color="warning"
        @click="
          display_notice(
            'warning',
            t('datasource_creation.error.title'),
            configuration_invalid_reasons.join('\n'),
          )
        "
      >
        {{ $t("action.check") }}
      </v-btn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import type { Reactive } from "vue";
import type { EntriesConfiguration } from "@/types/datasource-entry";
import { computed, inject, reactive } from "vue";
import { Sorting } from "@/definitions/sorting_types";

import { i18n } from "@/locales";
import {
  get_entry_configuration_invalid_reasons,
  get_entry_configuration_invalid_reasons_trusted,
} from "@/procedures/config-validator";
import {
  type DatasourceEntryBaseConfiguration,
  type DatasourceEntryConfiguration,
  type DatasourceEntryExtraConfiguration,
  type DatasourceEntryRatingExtraConfiguration,
  type DatasourceEntryStringConfiguration,
  type DatasourceEntryStringExtraConfiguration,
  type DatasourceEntryTagExtraConfiguration,
  RatingMetaConfiguration,
} from "@/types/datasource-entry-details";
import { inj_DisplayNotice } from "@/types/injections";

const { t } = i18n.global;
const emit = defineEmits<{
  next: [EntriesConfiguration];
  prev: [];
}>();
const display_notice = inject(inj_DisplayNotice)!;

const image_configuration: Reactive<{
  included: boolean;
  width: number;
  height: number;
}> = reactive({
  included: false,
  width: 240,
  height: 135,
});

const entry_configurations: Reactive<
  {
    unique_id: string;
    configuration: DatasourceEntryConfiguration;
  }[]
> = reactive([]);

function build_basic_config() {
  return {
    name: "",
    sorting_method: Sorting.Unset,
    optional: false,
    type: "string",
    unique: false,
    exclusive: false,
    maximum_score: 5,
    hints: Array.from({ length: RatingMetaConfiguration.maximum_score }),
  };
}

function add_new_entry() {
  // we need to include fields for each possible type
  const new_entry = build_basic_config() as DatasourceEntryStringConfiguration;
  entry_configurations.push({
    unique_id: crypto.randomUUID(),
    configuration: new_entry,
  });
}

function swap_array_element<T>(array: T[], i: number, j: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  [array[i], array[j]] = [array[j]!, array[i]!];
}
function move_entry_up(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  swap_array_element(entry_configurations, index, index - 1);
}
function move_entry_down(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  swap_array_element(entry_configurations, index, index + 1);
}
function remove_entry(index: number) {
  // check is omitted since this function is not supposed to be called with random parameter
  entry_configurations.splice(index, 1);
}
function load_existing_configure(source: File | File[] | undefined) {
  if (source === undefined) {
    return;
  }
  if (Array.isArray(source)) {
    if (source[0] !== undefined) {
      load_existing_configure(source[0]);
    }
    return;
  }
  (async () => {
    const text = await source.text();
    const data = JSON.parse(text);
    const reasons = get_entry_configuration_invalid_reasons(data);
    if (reasons.length > 0) {
      display_notice("error", t("datasource_creation.error.title"), reasons.join("\n"));
      return;
    }
    const imported_configure = data as EntriesConfiguration;
    if (imported_configure.image_size === undefined) {
      image_configuration.included = false;
    } else {
      image_configuration.included = true;
      image_configuration.height = imported_configure.image_size.height;
      image_configuration.width = imported_configure.image_size.width;
    }
    entry_configurations.splice(0);
    for (const entry of imported_configure.entries) {
      const basic = build_basic_config();
      if (entry.type === "rating") {
        if (entry.hints === null) {
          entry.hints = Array.from<string>({ length: RatingMetaConfiguration.maximum_score }).fill("");
        } else {
          entry.hints.push(
            ...Array.from<string>({
              length: RatingMetaConfiguration.maximum_score - entry.hints.length,
            }).fill(""),
          );
        }
      }
      entry_configurations.push({
        unique_id: crypto.randomUUID(),
        configuration: { ...basic, ...entry } as DatasourceEntryConfiguration,
      });
    }
  })().catch(error => {
    display_notice("error", t("message.error.failed_to_import_reasons"), String(error));
  });
}

// since we includes all possible fields in the internal configuration structure, we need to filter those
//  that are not used out before saving it
const final_configuration = computed((): EntriesConfiguration => {
  const result: EntriesConfiguration = {
    image_size: image_configuration.included
      ? { width: Number(image_configuration.width), height: Number(image_configuration.height) }
      : undefined,
    entries: [],
  };
  for (const { configuration: entry } of entry_configurations) {
    const basic_configuration: DatasourceEntryBaseConfiguration = {
      name: entry.name.trim(),
      sorting_method: entry.sorting_method,
      optional: entry.optional,
    };
    const extra_configuration = ((): DatasourceEntryExtraConfiguration => {
      switch (entry.type) {
        case "string": {
          const result: DatasourceEntryStringExtraConfiguration = {
            type: entry.type,
            unique: entry.unique,
          };
          return result;
        }
        case "tag": {
          const result: DatasourceEntryTagExtraConfiguration = {
            type: entry.type,
            exclusive: entry.exclusive,
          };
          return result;
        }
        case "rating": {
          const hint_slice = entry.hints!.slice(0, entry.maximum_score).map(item => item.trim());
          const result: DatasourceEntryRatingExtraConfiguration = {
            type: entry.type,
            maximum_score: entry.maximum_score,
            hints: hint_slice.some(item => item.length > 0) ? hint_slice : null,
          };
          return result;
        }
      }
    })();
    result.entries.push({ ...basic_configuration, ...extra_configuration });
  }
  return result;
});

const configuration_invalid_reasons = computed((): string[] =>
  get_entry_configuration_invalid_reasons_trusted(final_configuration.value),
);

function send_configurations() {
  emit("next", final_configuration.value);
}
</script>
