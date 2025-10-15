<template>
  <v-btn prepend-icon="mdi-arrow-left" class="mb-8" @click="emit('prev')">
    {{ $t("action.back_to_last_step") }}
  </v-btn>
  <v-card
    :title="$t('datasource_creation.security_setup')"
    :subtitle="$t('datasource_creation.security_setup_detail')"
  >
    <v-card-text>
      <datasource-creation-argon2-parameters-probing @finished="collect_argon2_parameters" />
      <datasource-creation-keys-configuration
        :disabled="!argon2_parameters_ready"
        :argon2_parameter_getter="() => argon2_parameters"
        @finished="collect_encryption_parameters"
      />
    </v-card-text>
  </v-card>
  <v-container class="mt-8">
    <v-row>
      <v-spacer></v-spacer>
      <v-btn
        append-icon="mdi-arrow-right"
        color="primary"
        :disabled="!can_go_next"
        @click="send_configurations"
      >
        {{ $t("action.continue_to_next_step") }}
      </v-btn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import type { CryptoConfiguration, DataEncryptionKey } from "@/types/datasource-crypto";

import type { Ref } from "vue";
import { computed, ref } from "vue";

const emit = defineEmits<{
  next: [CryptoConfiguration];
  prev: [];
}>();

let argon2_parameters: { memory: number; iterations: number; threads: number } | null = null;
let argon2_salt: Uint8Array | null = null;
let encryption_key: DataEncryptionKey | null = null;
const argon2_parameters_ready: Ref<boolean> = ref(false);
const argon2_salt_ready: Ref<boolean> = ref(false);
const encryption_key_ready: Ref<boolean> = ref(false);

function collect_argon2_parameters(parameters: typeof argon2_parameters) {
  if (parameters === null) {
    return;
  }
  argon2_parameters = parameters;
  argon2_parameters_ready.value = true;
  encryption_key_ready.value = false;
}
function collect_encryption_parameters(parameter: { salt: Uint8Array; encryption: DataEncryptionKey }) {
  argon2_salt = parameter.salt;
  encryption_key = parameter.encryption;
  argon2_salt_ready.value = true;
  encryption_key_ready.value = true;
}

function send_configurations() {
  if (argon2_parameters === null || argon2_salt === null || encryption_key === null) {
    return;
  }
  const configuration: CryptoConfiguration = {
    argon2: {
      ...argon2_parameters,
      salt: argon2_salt,
    },
    data_encryption: encryption_key,
  };
  emit("next", configuration);
}

// is continuing to next step allowed
const can_go_next = computed(
  () => argon2_parameters_ready.value && argon2_salt_ready.value && encryption_key_ready.value
);
</script>
