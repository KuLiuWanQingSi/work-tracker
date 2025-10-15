import type { InjectionKey } from "vue";

export type NoticeType = "error" | "info" | "success" | "warning";
export const inj_DisplayNotice = Symbol() as InjectionKey<
  (type: NoticeType, title: string, content: string) => void
>;
