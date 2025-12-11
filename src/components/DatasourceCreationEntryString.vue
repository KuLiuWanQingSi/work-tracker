<template>
  <v-card>
    <v-card-text>
      <v-switch
        v-model="configuration.unique"
        color="primary"
        :hint="$t('datasource_creation.string_unique_hint')"
        :label="$t('datasource_creation.string_unique')"
        persistent-hint
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type {
  DatasourceEntryDetailsAPI,
  DatasourceEntryStringConfiguration,
} from "@/types/datasource-entry-details";
import { onMounted } from "vue";
import { Sorting } from "@/definitions/sorting_types";

const configuration = defineModel<DatasourceEntryStringConfiguration>({ required: true });
const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.Disabled, Sorting.AsString, Sorting.AsNumber, Sorting.AsDate],
};
defineExpose(exposed);
const emit = defineEmits<{
  ready: [];
}>();
onMounted(() => {
  emit("ready");
});
</script>
