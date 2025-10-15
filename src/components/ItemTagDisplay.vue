<template>
  <v-row>
    <v-col v-for="tag in (data as InternalTagEntryData).tags" class="flex-grow-0">
      <v-chip>
        {{ typeof tag === "number" ? database.tags.get(configuration.name)![tag] ?? "" : tag }}
      </v-chip>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import { useDatabaseStore } from "@/stores/database";
import type {
  EntryData,
  InternalEntryData,
  InternalTagEntryData,
  TagEntryData,
} from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";

defineProps<{ data: EntryData | InternalEntryData; configuration: DatasourceEntryConfiguration }>();
const database = useDatabaseStore();
</script>
