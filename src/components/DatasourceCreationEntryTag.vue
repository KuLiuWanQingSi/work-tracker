<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="exclusive_mode"
        :label="$t('datasource_creation.tag_exclusive')"
        :hint="$t('datasource_creation.tag_exclusive_hint')"
        persistent-hint
        color="primary"
      ></v-switch>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { Sorting } from "@/definitions/sorting_types";
import type { DatasourceEntryDetailsAPI } from "@/types/datasource-entry-details";

import type { Ref } from "vue";
import { ref } from "vue";

const exclusive_mode: Ref<boolean> = ref(false);

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString],
  HaveExtraConfigurations: true,
  get_configuration: () => ({ type: "tag", exclusive: exclusive_mode.value }),
};
defineExpose(exposed);
</script>
