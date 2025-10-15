<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="unique"
        :label="$t('datasource_creation.string_unique')"
        :hint="$t('datasource_creation.string_unique_hint')"
        persistent-hint
        color="primary"
      ></v-switch>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { Sorting } from "@/definitions/sorting_types";
import type { DatasourceEntryDetailsAPI } from "@/types/datasource-entry-details";

const unique: Ref<boolean> = ref(false);

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString, Sorting.AsNumber, Sorting.AsDate],
  HaveExtraConfigurations: true,
  get_configuration: () => ({ type: "string", unique: unique.value }),
};
defineExpose(exposed);
</script>
