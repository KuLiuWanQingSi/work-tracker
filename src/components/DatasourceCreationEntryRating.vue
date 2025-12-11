<template>
  <v-card>
    <v-card-text>
      <v-slider
        v-model="configuration.maximum_score"
        color="primary"
        hide-details
        :label="$t('datasource_creation.rating_maximum')"
        :max="RatingMetaConfiguration.maximum_score"
        :min="RatingMetaConfiguration.minimum_score"
        :step="1"
      >
        <template #append>
          <v-number-input
            v-model="configuration.maximum_score"
            control-variant="stacked"
            density="compact"
            :max="RatingMetaConfiguration.maximum_score"
            :min="RatingMetaConfiguration.minimum_score"
            :step="1"
            style="width: 80px"
          />
        </template>
      </v-slider>
      <v-switch v-model="use_hints" color="primary" :label="$t('datasource_creation.rating_use_hint')" />
      <v-container v-if="use_hints">
        <v-text-field
          v-for="i in configuration.maximum_score"
          :key="i"
          v-model="configuration.hints![i - 1]"
          clearable
          density="comfortable"
          :label="i.toString()"
        />
        <hoverable-rating :configuration="configuration" />
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import { onMounted, ref } from "vue";

import { Sorting } from "@/definitions/sorting_types";
import {
  type DatasourceEntryDetailsAPI,
  type DatasourceEntryRatingExtraConfiguration,
  RatingMetaConfiguration,
} from "@/types/datasource-entry-details";

const configuration = defineModel<DatasourceEntryRatingExtraConfiguration>({ required: true });

const use_hints: Ref<boolean> = ref(false);

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.AsNumber, Sorting.Disabled],
};
defineExpose(exposed);
const emit = defineEmits<{
  ready: [];
}>();
onMounted(() => {
  use_hints.value = configuration.value
    .hints!.slice(0, configuration.value.maximum_score)
    .map(item => item.trim())
    .some(item => item.length > 0);
  emit("ready");
});
</script>
