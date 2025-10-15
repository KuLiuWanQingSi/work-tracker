<template>
  <v-container>
    <v-row justify="center">
      <v-rating
        :length="props.configuration.maximum_score"
        v-model="value"
        :readonly="props.readonly ?? false"
        hover
        id="bbcca2d8-6e82-471c-85ac-0221358ee09a"
      >
      </v-rating>
    </v-row>

    <v-row v-if="props.configuration.hints !== null" justify="center">
      <div>
        {{ props.configuration.hints[label_index] }}
      </div>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { DatasourceEntryRatingExtraConfiguration } from "@/types/datasource-entry-details";

import type { Ref } from "vue";
import { computed, onMounted, ref, watch } from "vue";
import type { VRating } from "vuetify/components";
const props = defineProps<{
  readonly?: boolean;
  configuration: DatasourceEntryRatingExtraConfiguration;
}>();
const value: Ref<number> = ref(1);

const hovered = ref<number | null>(null);
function onHover(val: number) {
  hovered.value = val;
}
function onLeave() {
  hovered.value = null;
}
const label_index = computed(() => {
  return (hovered.value ?? value.value) - 1;
});

function attach_hover_listener(
  start?: number,
  container = document.getElementById("bbcca2d8-6e82-471c-85ac-0221358ee09a")
) {
  if (container === null) {
    return;
  }
  container.querySelectorAll("button").forEach((node, index) => {
    if (index < (start ?? 0)) {
      return;
    }
    node.addEventListener("mouseover", () => {
      onHover(index + 1);
    });
  });
}
function initialize_listeners() {
  const container = document.getElementById("bbcca2d8-6e82-471c-85ac-0221358ee09a");
  if (container === null) {
    return;
  }
  container.addEventListener("mouseleave", onLeave);
  attach_hover_listener(0, container);
}

onMounted(initialize_listeners);
watch(
  () => props.configuration,
  (new_value, old_value) => {
    nextTick().then(() => {
      if (old_value.hints === null && new_value.hints !== null) {
        initialize_listeners();
      }
      if (old_value.maximum_score >= new_value.maximum_score) {
        return;
      }
      attach_hover_listener(old_value.maximum_score);
    });
  }
);
</script>
