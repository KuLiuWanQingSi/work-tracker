<template>
  <div class="fill-width">
    <v-rating
      v-model="(data as RatingEntryData).score"
      class="fill-width mx-auto"
      density="comfortable"
      :length="(configuration as DatasourceEntryRatingExtraConfiguration).maximum_score"
      readonly
    />
    <p v-if="comment[0]">{{ comment[0] }}</p>
    <p v-if="comment[1]">{{ comment[1] }}</p>
  </div>
</template>
<script setup lang="ts">
import type {
  EntryData,
  InternalEntryData,
  InternalRatingEntryData,
  RatingEntryData,
} from "@/types/datasource-entry";
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryRatingExtraConfiguration,
} from "@/types/datasource-entry-details";

import { computed } from "vue";

const props = defineProps<{
  data: EntryData | InternalEntryData;
  configuration: DatasourceEntryConfiguration;
}>();
const comment = computed(() => {
  const data = props.data as InternalRatingEntryData | RatingEntryData;
  const is_internal_format = (data as InternalRatingEntryData).use_comment !== undefined;
  return [
    ((props.configuration as DatasourceEntryRatingExtraConfiguration).hints ?? [])[data.score] ?? "",
    is_internal_format ? ((data as InternalRatingEntryData).use_comment ? data.comment : "") : data.comment,
  ];
});
</script>
