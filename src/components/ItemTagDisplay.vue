<template>
  <v-row>
    <v-col v-for="tag in (data as InternalTagEntryData).tags" :key="tag" class="flex-grow-0">
      <v-chip>
        {{ typeof tag === "number" ? (database.tags.get(configuration.name)![tag] ?? "") : tag }}
      </v-chip>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import type { EntryData, InternalEntryData, InternalTagEntryData } from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";
import { useDatabaseStore } from "@/stores/database";

defineProps<{ data: EntryData | InternalEntryData; configuration: DatasourceEntryConfiguration }>();
const database = useDatabaseStore();
</script>
