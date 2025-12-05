<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="exclusive_mode"
        color="primary"
        :hint="$t('datasource_creation.tag_exclusive_hint')"
        :label="$t('datasource_creation.tag_exclusive')"
        persistent-hint
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import type { DatasourceEntryDetailsAPI } from "@/types/datasource-entry-details";

import { ref } from "vue";
import { Sorting } from "@/definitions/sorting_types";

const exclusive_mode: Ref<boolean> = ref(false);

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString],
  HaveExtraConfigurations: true,
  get_configuration: () => ({ type: "tag", exclusive: exclusive_mode.value }),
};
defineExpose(exposed);
</script>
