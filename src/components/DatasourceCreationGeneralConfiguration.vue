<template>
  <v-btn class="mb-8" prepend-icon="mdi-arrow-left" @click="emit('prev')">
    {{ $t("action.back_to_last_step") }}
  </v-btn>
  <v-card :title="$t('datasource_creation.general_configuration')">
    <v-card-text>
      <v-text-field v-model="name" :label="$t('datasource_creation.datasource_name')" />
    </v-card-text>
  </v-card>
  <v-container class="mt-8">
    <v-row>
      <v-spacer />
      <v-btn
        append-icon="mdi-arrow-right"
        color="primary"
        :disabled="name === ''"
        @click="send_configurations"
      >
        {{ $t("action.continue_to_next_step") }}
      </v-btn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import type { GlobalConfiguration } from "@/types/datasource-global";
import { ref } from "vue";

const emit = defineEmits<{
  next: [GlobalConfiguration];
  prev: [];
}>();

const name: Ref<string> = ref("");

function send_configurations() {
  emit("next", { name: name.value });
}
</script>
