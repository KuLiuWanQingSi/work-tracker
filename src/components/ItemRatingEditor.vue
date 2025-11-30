<template>
  <v-row justify="space-around">
    <v-rating
      :length="(configuration as DatasourceEntryRatingExtraConfiguration).maximum_score"
      v-model="data.score"
      density="comfortable"
      clearable
    >
    </v-rating>
  </v-row>
  <v-row justify="space-around">
    <v-col cols="1">
      <v-switch v-model="data.use_comment" color="primary" :disabled="data.score === 0"></v-switch>
    </v-col>
    <v-col cols="10">
      <v-text-field v-model="data.comment" :disabled="!data.use_comment"></v-text-field>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import type { InternalRatingEntryData } from "@/types/datasource-entry";
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryRatingExtraConfiguration,
} from "@/types/datasource-entry-details";

import { watch } from "vue";

defineProps<{ configuration: DatasourceEntryConfiguration }>();
const data = defineModel<InternalRatingEntryData>("data", { required: true });
watch(data.value, () => {
  if(data.value.comment.trim() !== data.value.comment){
    data.value.comment = data.value.comment.trim();
  }
});
</script>
