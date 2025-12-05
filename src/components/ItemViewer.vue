<template>
  <v-tooltip v-model="show_tooltip" close-delay="300" :disabled="inEditor" interactive open-delay="500">
    <template #activator="{ props: activatorProps }">
      <v-card v-bind="activatorProps" :color="selection?.has(dataId) ? 'primary' : ''">
        <div v-if="database_store.has_image" class="fill-width">
          <v-lazy>
            <v-img
              :aspect-ratio="`${database_store.image_size.width}/${database_store.image_size.height}`"
              class="image-display"
              :src="overrideImage ?? fetched_image"
              style="margin: auto"
              width="100%"
              @click="load_full_image"
            >
              <template #placeholder>
                <div
                  class="align-center justify-center fill-height"
                  style="background: linear-gradient(to right, #f0c27b, #4b1248)"
                />
              </template>
            </v-img>
          </v-lazy>
        </div>
        <v-card-text>
          <div style="display: grid; grid-template-columns: max-content 1fr; gap: 24px 16px">
            <template v-for="entry in entries_available_for_present" :key="entry.name">
              <p style="width: max-content">{{ entry.name }}</p>
              <component
                :is="display_map[entry.type]"
                :configuration="entry"
                :data="props.data.entries?.get(entry.name)!"
              />
            </template>
          </div>
        </v-card-text>
      </v-card>
    </template>
    <div style="display: grid; grid-template-columns: 1fr; gap: 8px">
      <v-btn block @click="request_for_modify">{{ $t("action.edit") }}</v-btn>
      <v-btn v-if="selection?.has(dataId)" block @click="emit('unselect', dataId)">{{
        $t("action.unselect")
      }}</v-btn>
      <v-btn v-else block @click="emit('select', dataId)">{{ $t("action.select") }}</v-btn>
    </div>
  </v-tooltip>
</template>
<script setup lang="ts">
import type { DataItem } from "@/types/datasource-data";
import type { InternalDataItem } from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";
import { computed, onMounted } from "vue";
import { useDatabaseStore } from "@/stores/database";
import ItemRatingDisplay from "./ItemRatingDisplay.vue";
import ItemStringDisplay from "./ItemStringDisplay.vue";

import ItemTagDisplay from "./ItemTagDisplay.vue";

const display_map = {
  string: ItemStringDisplay,
  tag: ItemTagDisplay,
  rating: ItemRatingDisplay,
};

const database_store = useDatabaseStore();
const props = defineProps<{
  dataId: string;
  data: DataItem | InternalDataItem;
  configuration: DatasourceEntryConfiguration[];
  overrideImage: string | null;
  inEditor?: boolean;
  updateBroadcast?: Set<string>;
  selection?: Set<string>;
}>();
const emit = defineEmits<{
  requestModify: [string];
  select: [string];
  unselect: [string];
}>();
const load_full_image: Ref<(() => void) | undefined> = ref(undefined);

const entries_available_for_present = computed(() => {
  if (!props.configuration) {
    return [];
  }
  return props.configuration.filter(entry => props.data.entries?.has(entry.name));
});
const fetched_image: Ref<string> = ref("");

function update_header_image() {
  const cached_image = database_store.get_cached_image(props.dataId);
  if (cached_image !== undefined) {
    // full image have been loaded, just display it
    fetched_image.value = cached_image;
    return;
  }
  // full image is not loaded, we need to get the thumbnail
  database_store.get_thumbnail(props.dataId).then(image => {
    fetched_image.value = image;
  });
  // set full image fetcher
  load_full_image.value = () => {
    // the fetcher should be called only once
    load_full_image.value = undefined;
    database_store.get_image(props.dataId).then(image => {
      fetched_image.value = image;
    });
  };
}

onMounted(() => {
  if (props.overrideImage === null) {
    update_header_image();
    if (props.updateBroadcast !== undefined) {
      watch(props.updateBroadcast, new_value => {
        if (new_value.has(props.dataId)) {
          update_header_image();
        }
      });
    }
  }
});

const show_tooltip: Ref<boolean> = ref(false);
function request_for_modify() {
  emit("requestModify", props.dataId);
  show_tooltip.value = false;
}
</script>
<style lang="css" scoped>
.image-display img {
  object-fit: contain;
}
</style>
