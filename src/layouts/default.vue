<template>
  <v-main>
    <router-view />
    <app-footer />
    <v-bottom-sheet v-model="notice_configuration.shown" inset>
      <v-alert
        border="start"
        closable
        max-height="80vh"
        :title="notice_configuration.title"
        :type="notice_configuration.type"
        @click:close.stop="notice_configuration.shown = false"
      >
        <p v-for="content in notice_configuration.contents" :key="content">
          {{ content }}
        </p>
      </v-alert>
    </v-bottom-sheet>
  </v-main>
</template>
<script lang="ts" setup>
import type { Reactive } from "vue";

import { provide, reactive } from "vue";
import { inj_DisplayNotice, type NoticeType } from "@/types/injections";

const notice_configuration: Reactive<{
  type: NoticeType;
  title: string;
  contents: string[];
  shown: boolean;
}> = reactive({ type: "info", title: "", contents: [], shown: false });
provide(inj_DisplayNotice, (type: NoticeType, title: string, content: string) => {
  notice_configuration.type = type;
  notice_configuration.title = title;
  notice_configuration.contents = content.split("\n");
  notice_configuration.shown = true;
});
</script>
