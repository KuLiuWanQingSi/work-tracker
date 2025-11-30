<template>
  <v-row class="ma-2">
    <template v-if="selected_tags.length !== 0">
      <v-col v-for="tag in selected_tags" :key="tag.display">
        <v-chip closable @click:close="remove_tag(tag.value)">
          {{ tag.display }}
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
      <v-chip
        :prepend-icon="item.type === TagMatchClass.Creation ? 'mdi-plus' : ''"
        :color="
          item.type === TagMatchClass.ExactMatch
            ? 'primary'
            : item.type === TagMatchClass.Creation
            ? ''
            : 'secondary'
        "
        @click="commit_tag(item.value)"
      >
        {{ item.display }}
      </v-chip>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import { find_tag_candidates, TagMatchClass } from "@/procedures/tag-matching";
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
  return data.value.tags.map((value): { display: string; value: string | number } => {
    return {
      display: typeof value === "string" ? value : tag_map[value]!,
      value: value,
    };
  });
});
const selectable_items = computed(() => {
  if (data.value === undefined) {
    return [];
  }
  const input = input_tag.value.trim();
  if (input.length === 0) {
    return [];
  }
  const selected = selected_tags.value.map(({ value }) => value);
  return find_tag_candidates(input, tag_map, { allow_creating: true }).filter(
    ({ value }) => !selected.includes(value)
  );
});

function commit_tag(tag: number | string) {
  data.value.tags.push(tag);
  input_tag.value = "";
}
function remove_tag(tag: number | string) {
  const target_index = data.value.tags.indexOf(tag);
  data.value.tags.splice(target_index, 1);
}
</script>
