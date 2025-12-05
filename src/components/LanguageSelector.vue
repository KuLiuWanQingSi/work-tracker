<!-- A language select bar for changing display language dynamically -->

<template>
  <v-select
    v-model="selected_language"
    item-title="name"
    item-value="key"
    :items="LanguagesAvailable"
    :loading="show_loading"
  />

  <v-snackbar v-model="show_error" multi-line :timeout="error_message_timeout">
    {{ $t("message.cannot_change_language") }} {{ error_content }}
    <template #actions>
      <v-btn color="info" @click="copy_error_message">
        <v-icon v-if="copy_succeed" icon="mdi-check-bold" />
        <v-icon v-if="copy_failed" icon="mdi-alert" />
        {{ $t("action.copy") }}
      </v-btn>
      <v-btn color="error" @click="show_error = false">{{ $t("action.close") }}</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import type { Ref } from "vue";

import { ref, watch } from "vue";
import { i18n, setI18nLanguage, SUPPORT_LOCALES } from "@/locales";

const LanguagesAvailable: { key: string; name: string }[] = [...SUPPORT_LOCALES.keys()].map(key_name => ({
  key: key_name,
  name: SUPPORT_LOCALES.get(key_name) ?? "",
}));

const show_loading: Ref<boolean> = ref(false);
const show_error: Ref<boolean> = ref(false);
const error_content: Ref<string> = ref("");
const error_message_timeout: Ref<number> = ref(5000);
const copy_succeed: Ref<boolean> = ref(false);
const copy_failed: Ref<boolean> = ref(false);

const selected_language: Ref<string> = ref(i18n.global.locale.value);
watch(selected_language, async (new_selection, old_selection) => {
  if (new_selection === old_selection) {
    return;
  }
  if (i18n.global.locale.value === new_selection) {
    return;
  }
  show_loading.value = true;
  try {
    await setI18nLanguage(i18n, selected_language.value);
  } catch (error) {
    // switching failed, do recovery
    error_content.value = String(error);
    error_message_timeout.value = 5000;
    copy_succeed.value = false;
    copy_failed.value = false;
    show_error.value = true;

    selected_language.value = old_selection;
  }
  show_loading.value = false;
});

// copy the error message
async function copy_error_message() {
  try {
    await navigator.clipboard.writeText(error_content.value);
    copy_succeed.value = true;
  } catch {
    error_message_timeout.value = -1;
    copy_failed.value = true;
  }
}
</script>
