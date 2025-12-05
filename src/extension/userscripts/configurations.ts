import type { Result } from "@/types/result";
import { InjectorConfiguration } from "../types/configuration";

export async function start_configuration() {
  const configure = await InjectorConfiguration.from_store();
  const event = new CustomEvent<Result<InjectorConfiguration>>("injector-ready", {
    detail: configure,
  });
  window.dispatchEvent(event);
}
