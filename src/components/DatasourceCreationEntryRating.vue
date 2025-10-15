<template>
  <v-card>
    <v-card-text>
      <v-slider
        v-model="maximum_score"
        :min="2"
        :max="10"
        :step="1"
        :label="$t('datasource_creation.rating_maximum')"
        color="primary"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            v-model="maximum_score"
            density="compact"
            type="number"
            style="width: 80px"
          ></v-text-field>
        </template>
      </v-slider>
      <v-switch
        v-model="use_hints"
        color="primary"
        :label="$t('datasource_creation.rating_use_hint')"
      ></v-switch>
      <v-container v-if="use_hints">
        <v-text-field
          v-for="(_, index) in hints"
          :key="index"
          v-model="hints[index]"
          :label="(index + 1).toString()"
          density="comfortable"
          clearable
        ></v-text-field>
        <hoverable-rating :configuration="configuration"></hoverable-rating>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { Sorting } from "@/definitions/sorting_types";
import type {
  DatasourceEntryDetailsAPI,
  DatasourceEntryRatingExtraConfiguration,
} from "@/types/datasource-entry-details";

import type { ComputedRef, Ref } from "vue";
import { computed, ref, watch } from "vue";

// maximum score
const maximum_score: Ref<number> = ref(5);

const use_hints: Ref<boolean> = ref(false);

// hints for each rating level
const hints: Ref<string[]> = ref(new Array(maximum_score.value).fill(""));
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
    hints.value.splice(old_score, 0, ...new Array(new_score - old_score).fill(""));
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
