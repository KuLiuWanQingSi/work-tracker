<template>
  <v-row class="ma-2">
    <template v-if="selected_tags.length !== 0">
      <v-col v-for="tag in selected_tags" :key="tag.title">
        <v-chip closable @click:close="remove_tag(tag)">
          {{ tag.title }}
        </v-chip>
      </v-col>
    </template>
    <v-col cols="12">
      <v-text-field
        v-model="input_tag"
        :disabled="(configuration as DatasourceEntryTagConfiguration).exclusive && selected_tags.length !== 0"
      ></v-text-field>
    </v-col>
    <v-col v-for="item in selectable_items">
      <v-chip :prepend-icon="item.value === -1 ? 'mdi-plus' : ''" @click="commit_tag(item)">
        {{ item.title }}
      </v-chip>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import { useDatabaseStore } from "@/stores/database";
import type { InternalTagEntryData } from "@/types/datasource-entry";
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryTagConfiguration,
} from "@/types/datasource-entry-details";

import { computed, readonly } from "vue";

const props = defineProps<{ entry_name: string; configuration: DatasourceEntryConfiguration }>();
const database = useDatabaseStore();
const data = defineModel<InternalTagEntryData>("data", { required: true });
const tag_map = readonly(database.tags.get(props.entry_name) ?? []);

const input_tag: Ref<string> = ref("");

const selected_tags = computed(() => {
  return data.value.tags.map((value) => {
    const string_value = typeof value === "string" ? value : tag_map[value]!;
    const index_value = typeof value === "string" ? -1 : value;
    return {
      title: string_value,
      value: index_value,
    };
  });
});
const selectable_items = computed(() => {
  if (data.value === undefined) {
    return [];
  }
  if (input_tag.value === "") {
    return [];
  }
  const result = tag_map
    .map((value, index) => ({
      title: value,
      value: index,
    }))
    .filter(({ title, value }) => !data.value.tags.includes(value) && title.includes(input_tag.value));
  // slot to help with creation
  if (
    !selected_tags.value
      .concat(result)
      .map((item) => item.title)
      .includes(input_tag.value)
  ) {
    result.push({ title: input_tag.value, value: -1 });
  }

  return result;
});

function commit_tag(tag: { title: string; value: number }) {
  if (tag.value !== -1) {
    data.value.tags.push(tag.value);
  } else {
    data.value.tags.push(tag.title);
  }
  input_tag.value = "";
}
function remove_tag(tag: { title: string; value: number }) {
  const target = tag.value !== -1 ? tag.value : tag.title;
  const target_index = data.value.tags.indexOf(target);
  data.value.tags.splice(target_index, 1);
}
</script>
