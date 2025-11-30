<template>
  <v-text-field v-model="data.value"></v-text-field>
</template>
<script setup lang="ts">
import type { StringEntryData } from "@/types/datasource-entry";

import { watch } from "vue";

const data = defineModel<StringEntryData>("data", { required: true });
watch(data.value, () => {
  if(data.value.value.trim() !== data.value.value){
    data.value.value = data.value.value.trim();
  }
});
</script>
