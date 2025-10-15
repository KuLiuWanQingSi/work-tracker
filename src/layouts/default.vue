<template>
  <v-main>
    <router-view />
    <app-footer />
    <v-bottom-sheet v-model="notice_configuration.shown" inset>
      <v-alert
        border="start"
        :title="notice_configuration.title"
        :type="notice_configuration.type"
        @click:close.stop="notice_configuration.shown = false"
        closable
      >
        {{ notice_configuration.content }}
      </v-alert>
    </v-bottom-sheet>
  </v-main>
</template>
<script lang="ts" setup>
import { inj_DisplayNotice, type NoticeType } from "@/types/injections";

import type { Reactive } from "vue";
import { provide, reactive } from "vue";

const notice_configuration: Reactive<{
  type: NoticeType;
  title: string;
  content: string;
  shown: boolean;
}> = reactive({ type: "info", title: "", content: "", shown: false });
provide(inj_DisplayNotice, (type: NoticeType, title: string, content: string) => {
  notice_configuration.type = type;
  notice_configuration.title = title;
  notice_configuration.content = content;
  notice_configuration.shown = true;
});
</script>
