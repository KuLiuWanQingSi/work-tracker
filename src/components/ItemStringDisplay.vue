<template>
  <span> {{ (props.data as StringEntryData).value }} </span>
</template>
<script setup lang="ts">
import type { EntryData, InternalEntryData, StringEntryData } from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";

const props = defineProps<{
  data: EntryData | InternalEntryData;
  configuration: DatasourceEntryConfiguration;
}>();
</script>
