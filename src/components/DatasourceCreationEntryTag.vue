<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="configuration.exclusive"
        color="primary"
        :hint="$t('datasource_creation.tag_exclusive_hint')"
        :label="$t('datasource_creation.tag_exclusive')"
        persistent-hint
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type {
  DatasourceEntryDetailsAPI,
  DatasourceEntryTagConfiguration,
} from "@/types/datasource-entry-details";

import { onMounted } from "vue";
import { Sorting } from "@/definitions/sorting_types";

const configuration = defineModel<DatasourceEntryTagConfiguration>({ required: true });
const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString],
};
defineExpose(exposed);
const emit = defineEmits<{
  ready: [];
}>();
onMounted(() => {
  emit("ready");
});
</script>
