<template>
  <v-card class="my-4" width="100%">
    <v-card-item>
      <template #append>
        <v-tooltip v-if="index !== 0" :text="$t('action.move_up')">
          <template #activator="{ props }">
            <v-chip v-bind="props" variant="text" @click.stop="emit('moveUp')">
              <v-icon icon="mdi-arrow-up" />
            </v-chip>
          </template>
        </v-tooltip>
        <v-tooltip v-if="index !== total - 1" :text="$t('action.move_down')">
          <template #activator="{ props }">
            <v-chip v-bind="props" variant="text" @click.stop="emit('moveDown')">
              <v-icon icon="mdi-arrow-down" />
            </v-chip>
          </template>
        </v-tooltip>
        <v-tooltip :text="$t('action.remove')">
          <template #activator="{ props }">
            <v-chip v-bind="props" variant="text" @click.stop="emit('remove')">
              <v-icon icon="mdi-delete" />
            </v-chip>
          </template>
        </v-tooltip>
      </template>
      <v-card-title>{{ configuration.name }}</v-card-title>
    </v-card-item>
    <v-card-text>
      <v-container>
        <v-row>
          <v-text-field v-model="configuration.name" :label="$t('datasource_creation.entry_name')" />
        </v-row>
        <v-row class="my-4">
          <v-select
            v-model="configuration.type"
            :hint="$t(`datasource_creation.entry_types.${configuration.type}.description`)"
            item-title="display_name"
            item-value="internal_name"
            :items="EntryTypes"
            :label="$t('datasource_creation.entry_type')"
            persistent-hint
          />
        </v-row>
        <v-row class="my-4">
          <v-select
            v-model="configuration.sorting_method"
            :disabled="configuration_component?.SortingMethodsAvailable.length === 1"
            :hint="$t(`sorting.${configuration.sorting_method}.description`)"
            item-title="display"
            item-value="name"
            :items="
              configuration_component?.SortingMethodsAvailable.map(value => ({
                name: value,
                display: $t(`sorting.${value}.name`),
              }))
            "
            :label="$t('datasource_creation.entry_sorting_method')"
            persistent-hint
          />
        </v-row>
        <v-row class="my-4">
          <v-switch
            v-model="configuration.optional"
            color="primary"
            density="comfortable"
            :hint="$t('datasource_creation.optional_detail')"
            :label="$t('datasource_creation.optional')"
            persistent-hint
          />
        </v-row>
      </v-container>
      <v-divider class="my-4" />
      <component
        :is="EntryTypesMapping.get(configuration.type) ?? DefaultType.type"
        ref="detail_configuration"
        v-model="configuration"
        @ready="reset_sorting_method"
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryDetailsAPI,
} from "@/types/datasource-entry-details";
import { useTemplateRef } from "vue";
import { i18n } from "@/locales";
import DatasourceCreationEntryRating from "./DatasourceCreationEntryRating.vue";
import DatasourceCreationEntryString from "./DatasourceCreationEntryString.vue";
import DatasourceCreationEntryTag from "./DatasourceCreationEntryTag.vue";

const { t } = i18n.global;

// information from the list holder: we need to know our position in the list to show move up/down buttons
defineProps<{
  index: number;
  total: number;
}>();
// bottom-to-up flow: the configuration is validated here and reported back via v-model
const configuration = defineModel<DatasourceEntryConfiguration>({ required: true });

// we will ask the list holder to move us around via events
const emit = defineEmits<{
  moveUp: [];
  moveDown: [];
  remove: [];
}>();

// detailed entry types available
const EntryTypesMapping = new Map<string, Component>([
  ["string", DatasourceCreationEntryString],
  ["tag", DatasourceCreationEntryTag],
  ["rating", DatasourceCreationEntryRating],
]);
const DefaultType = { name: "string", type: DatasourceCreationEntryString };
const EntryTypes = [...EntryTypesMapping.keys()].map(value => ({
  internal_name: value,
  display_name: t(`datasource_creation.entry_types.${value}.name`),
}));

// the component containing detailed configurations about the type
const configuration_component = useTemplateRef<DatasourceEntryDetailsAPI>("detail_configuration");

// reset sorting method each time entry type is changed
function reset_sorting_method() {
  if (!configuration_component.value!.SortingMethodsAvailable.includes(configuration.value.sorting_method)) {
    configuration.value.sorting_method = configuration_component.value!.SortingMethodsAvailable[0];
  }
}
</script>
