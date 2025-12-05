<template>
  <v-card>
    <v-card-text>
      <v-slider
        v-model="maximum_score"
        color="primary"
        hide-details
        :label="$t('datasource_creation.rating_maximum')"
        :max="10"
        :min="2"
        :step="1"
      >
        <template #append>
          <v-text-field v-model="maximum_score" density="compact" style="width: 80px" type="number" />
        </template>
      </v-slider>
      <v-switch v-model="use_hints" color="primary" :label="$t('datasource_creation.rating_use_hint')" />
      <v-container v-if="use_hints">
        <v-text-field
          v-for="(_, index) in hints"
          :key="index"
          v-model="hints[index]"
          clearable
          density="comfortable"
          :label="(index + 1).toString()"
        />
        <hoverable-rating :configuration="configuration" />
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { ComputedRef, Ref } from "vue";
import type {
  DatasourceEntryDetailsAPI,
  DatasourceEntryRatingExtraConfiguration,
} from "@/types/datasource-entry-details";

import { computed, ref, watch } from "vue";
import { Sorting } from "@/definitions/sorting_types";

// maximum score
const maximum_score: Ref<number> = ref(5);

const use_hints: Ref<boolean> = ref(false);

// hints for each rating level
const hints: Ref<string[]> = ref(Array.from<string>({ length: maximum_score.value }).fill(""));
// update hint array if maximum score is changed
watch(maximum_score, (new_score, old_score) => {
  if (typeof new_score === "string") {
    maximum_score.value = Number(new_score);
    return;
  }
  if (new_score === old_score) {
    return;
  }
  if (new_score > old_score) {
    hints.value.splice(old_score, 0, ...Array.from<string>({ length: new_score - old_score }).fill(""));
  } else {
    hints.value.splice(new_score);
  }
});

const configuration: ComputedRef<DatasourceEntryRatingExtraConfiguration> = computed(() => {
  return {
    type: "rating",
    maximum_score: maximum_score.value,
    hints: use_hints.value ? hints.value : null,
  };
});

const exposed: DatasourceEntryDetailsAPI = {
  SortingMethodsAvailable: [Sorting.AsNumber, Sorting.Disabled],
  HaveExtraConfigurations: true,
  get_configuration: () => configuration.value,
};
defineExpose(exposed);
</script>
