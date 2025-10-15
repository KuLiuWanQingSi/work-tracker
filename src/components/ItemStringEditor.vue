<template>
  <v-text-field v-model="data.value"></v-text-field>
</template>
<script setup lang="ts">
import type { StringEntryData } from "@/types/datasource-entry";

const data = defineModel<StringEntryData>("data", { required: true });
</script>
