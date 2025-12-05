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
      <v-card-title>{{ name }}</v-card-title>
    </v-card-item>
    <v-card-text>
      <v-container>
        <v-row>
          <v-text-field v-model="name" :label="$t('datasource_creation.entry_name')" />
        </v-row>
        <v-row class="my-4">
          <v-select
            v-model="selected_type"
            :hint="$t(`datasource_creation.entry_types.${selected_type}.description`)"
            item-title="display_name"
            item-value="internal_name"
            :items="EntryTypes"
            :label="$t('datasource_creation.entry_type')"
            persistent-hint
          />
        </v-row>
        <v-row class="my-4">
          <v-select
            v-model="sorting_method"
            :disabled="configuration_component?.SortingMethodsAvailable.length === 1"
            :hint="$t(`sorting.${sorting_method}.description`)"
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
            v-model="is_optional"
            color="primary"
            density="comfortable"
            :hint="$t('datasource_creation.optional_detail')"
            :label="$t('datasource_creation.optional')"
            persistent-hint
          />
        </v-row>
      </v-container>
      <v-divider v-show="configuration_component?.HaveExtraConfigurations" class="my-4" />
      <component
        :is="EntryTypesMapping.get(selected_type) ?? DefaultType.type"
        v-show="configuration_component?.HaveExtraConfigurations"
        ref="detail_configuration"
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import type { DatasourceEntryAPI } from "@/types/datasource-entry";
import type {
  DatasourceEntryBaseConfiguration,
  DatasourceEntryDetailsAPI,
} from "@/types/datasource-entry-details";
import { ref, useTemplateRef, watch } from "vue";
import { Sorting } from "@/definitions/sorting_types";
import { i18n } from "@/locales";
import DatasourceCreationEntryRating from "./DatasourceCreationEntryRating.vue";

import DatasourceCreationEntryString from "./DatasourceCreationEntryString.vue";
import DatasourceCreationEntryTag from "./DatasourceCreationEntryTag.vue";

const { t } = i18n.global;

// information from the list holder: we need to know our position in the list to show move up/down buttons
defineProps({
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  controlValue: { type: String, required: false },
});

// we will ask the list holder to move us around via events
const emit = defineEmits<{
  moveUp: [];
  moveDown: [];
  remove: [];
}>();

// name of the entry
const name: Ref<string> = ref("");

// if this entry is optional
const is_optional: Ref<boolean> = ref(false);

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

// current type selected
const selected_type: Ref<string> = ref(DefaultType.name);
// the component containing detailed configurations about the type
const configuration_component = useTemplateRef<DatasourceEntryDetailsAPI>("detail_configuration");

// sorting method selected
const sorting_method: Ref<Sorting> = ref(Sorting.Disabled);
// reset related configurations automatically when type is changed
watch(selected_type, () => {
  sorting_method.value = configuration_component.value?.SortingMethodsAvailable[0] ?? Sorting.Disabled;
});

// provide method to collect configurations
const exposed: DatasourceEntryAPI = {
  get_configuration: () => {
    if (configuration_component.value === null) {
      return null;
    }
    if (name.value === "") {
      return null;
    }
    const basic_configuration: DatasourceEntryBaseConfiguration = {
      name: name.value,
      sorting_method: sorting_method.value,
      optional: is_optional.value,
    };
    const extra_configuration = configuration_component.value.get_configuration();
    return { ...basic_configuration, ...extra_configuration };
  },
};
defineExpose(exposed);
</script>
