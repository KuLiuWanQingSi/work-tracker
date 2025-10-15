import { InjectorConfiguration } from "../types/configuration";

export async function start_configuration() {
  const configure = await InjectorConfiguration.from_store();
  const event = new CustomEvent<InjectorConfiguration>("injector-ready", {
    detail: configure,
  });
  window.dispatchEvent(event);
}
