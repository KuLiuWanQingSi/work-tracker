<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="unique"
        color="primary"
        :hint="$t('datasource_creation.string_unique_hint')"
        :label="$t('datasource_creation.string_unique')"
        persistent-hint
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { DatasourceEntryDetailsAPI } from "@/types/datasource-entry-details";
import { Sorting } from "@/definitions/sorting_types";

const unique: Ref<boolean> = ref(false);

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString, Sorting.AsNumber, Sorting.AsDate],
  HaveExtraConfigurations: true,
  get_configuration: () => ({ type: "string", unique: unique.value }),
};
defineExpose(exposed);
</script>
