import type {
  InjectorConfiguration,
  InjectorDatabases,
  InjectorHosts,
  InjectorScripts,
} from "../types/configuration";
import { Indicator, type IndicatorState } from "../types/indicator";
import { Runner } from "../types/runner-interfaces";

function inject_styles() {
  Runner.add_style(
    `
.wt-indicator-container {
  overflow: hidden;
  position: fixed;
  top: 0;
  right: 0;
  margin: 12px;
  width: 50px;
  height: 50px;
  z-index: 99999999;
}
.wt-alert-container {
  border-top-style: solid;
	border-top-width: 6px;
	border-top-color: #cf6679;
	padding: 12px 28px;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: #18191b;
  z-index: 99999999;
}
.wt-alert-container > h3 {
  margin: 0;
  text-align: center;
}
.wt-alert-container > button {
  width: 100%;
}`
  );
  Runner.add_style(Indicator.get_css());
}

function show_alert(config: { title?: string; content?: string }) {
  const container = document.createElement("div");
  container.classList.add("wt-alert-container");
  if (config.title) {
    const title = document.createElement("h3");
    title.innerText = config.title;
    container.appendChild(title);
  }
  if (config.content) {
    const parts = config.content.split("\n");
    parts.forEach((content, index) => {
      if (index !== 0) {
        container.appendChild(document.createElement("br"));
      }
      const content_holder = document.createElement("p");
      content_holder.innerText = content;
      container.appendChild(content_holder);
    });
  }
  const close_button = document.createElement("button");
  close_button.innerText = "Close";
  close_button.addEventListener("click", () => {
    document.body.removeChild(container);
  });
  container.appendChild(close_button);
  document.body.appendChild(container);
}

function create_indicator(): Indicator {
  inject_styles();
  const container = document.createElement("div");
  container.classList.add("wt-indicator-container");
  document.body.appendChild(container);
  return new Indicator(container);
}

type InternalState = {
  database: InjectorDatabases;
  script: InjectorScripts;
  host: InjectorHosts;
  configuration: InjectorConfiguration;
  indicator: Indicator;
  script_instance: {
    run: (data: any[]) => Promise<void>;
    stop?: () => Promise<void>;
    reset_data?: (new_data: any[]) => Promise<void>;
  };
};
function configure_indicator(
  indicator: Indicator,
  state: IndicatorState,
  action_map: Map<IndicatorState, () => void>
) {
  indicator.action = action_map.get(state)!;
  indicator.state = state;
}
async function user_script_guard(
  action: Promise<void>,
  name: string,
  indicator: Indicator,
  action_map: Map<IndicatorState, () => void>
): Promise<boolean> {
  try {
    await action;
    return false;
  } catch (error) {
    show_alert({
      title: `Failed to ${name} the script`,
      content: `This is caused by the following error:\n${String(error)}`,
    });
    configure_indicator(indicator, "failed", action_map);
    return true;
  }
}
async function update_materials(
  materials: InternalState,
  updates: { database?: InjectorDatabases; script?: InjectorScripts },
  action_map: Map<IndicatorState, () => void>
) {
  if (updates.script) {
    if (materials.script_instance.stop === undefined) {
      // the script is not equipped with API stop, we can only restart it by reloading the page
      return configure_indicator(materials.indicator, "pending-update", action_map);
    }
    if (await user_script_guard(materials.script_instance.stop(), "stop", materials.indicator, action_map)) {
      return;
    }
    materials.script = updates.script;
    materials.script_instance = await materials.script.get_instance();
  }
  if (updates.database) {
    materials.database = updates.database;
    const new_data = await materials.database.get_content();
    if (updates.script) {
      // currently the script is in stopped (not started) state
      if (
        await user_script_guard(
          materials.script_instance.run(new_data),
          "start",
          materials.indicator,
          action_map
        )
      ) {
        return;
      }
    } else {
      // currently the script is running
      // prefer reset_data if possible
      if (materials.script_instance.reset_data !== undefined) {
        if (
          await user_script_guard(
            materials.script_instance.reset_data(new_data),
            "restart",
            materials.indicator,
            action_map
          )
        ) {
          return;
        }
      } else if (materials.script_instance.stop !== undefined) {
        // if the script can be stopped, we can still update the data
        if (
          (await user_script_guard(
            materials.script_instance.stop(),
            "stop",
            materials.indicator,
            action_map
          )) ||
          (await user_script_guard(
            materials.script_instance.run(new_data),
            "start",
            materials.indicator,
            action_map
          ))
        ) {
          return;
        }
      } else {
        // we cannot update the data, the webpage has to be reloaded
        return configure_indicator(materials.indicator, "pending-update", action_map);
      }
    }
  }
  configure_indicator(materials.indicator, "active", action_map);
}
function build_state_action_map(materials: InternalState): Map<IndicatorState, () => void> {
  const result: Map<IndicatorState, () => void> = new Map();
  const noop = () => {};
  const refetch = () => {
    configure_indicator(materials.indicator, "updating", result);
    Promise.allSettled([
      materials.configuration.update_database(materials.database.id, {}),
      materials.configuration.update_script(materials.script.id, {}),
    ]).then((results) => {
      const errors = results
        .map((result) => (result.status === "rejected" ? String(result.reason) : null))
        .filter((item) => item !== null);
      if (errors.length > 0) {
        configure_indicator(materials.indicator, "degraded", result);
        show_alert({
          title: "failed to update",
          content: `This is caused by the following errors:\n${errors.join("\n")}`,
        });
        return;
      }
      if (results[0].status === "rejected" || results[1].status === "rejected") {
        return;
      }
      const new_database = results[0].value;
      const new_script = results[1].value;
      return update_materials(
        materials,
        {
          database: new_database.is_same(materials.database) ? undefined : new_database,
          script: new_script.is_same(materials.script) ? undefined : new_script,
        },
        result
      );
    });
  };
  const reload_page = () => {
    window.location.reload();
  };
  return new Map([
    ["loading", noop],
    ["active", refetch],
    ["dangling", noop],
    ["pending-update", reload_page],
    ["degraded", refetch],
    ["failed", reload_page],
  ]);
}

export async function start_injector(host: InjectorHosts, configuration: InjectorConfiguration) {
  // create indicator
  const indicator = create_indicator();

  // create container for database and script
  const { database, script } = configuration.get_components(host);
  const script_instance = await script.get_instance();
  const database_content = await database.get_content();
  const materials: InternalState = {
    database: database,
    script: script,
    host: host,
    configuration: configuration,
    indicator: indicator,
    script_instance: script_instance,
  };

  // build action map
  const action_map = build_state_action_map(materials);

  // get ready for possible updates
  configuration.setup_autoupdate();
  configuration.register_host_watcher(host.name, (modification) => {
    if (
      // the host was removed entirely
      modification.removed ||
      // the host was not removed, but no longer matches current address
      (modification.modified.matcher && window.location.href.match(RegExp(modification.host.host)) === null)
    ) {
      return configure_indicator(indicator, "dangling", action_map);
    }
    const { database, script } = configuration.get_components(host);
    update_materials(
      materials,
      {
        database: modification.modified.database ? database : undefined,
        script: modification.modified.script ? script : undefined,
      },
      action_map
    );
  });

  // initiate the script
  if (!(await user_script_guard(script_instance.run(database_content), "start", indicator, action_map))) {
    configure_indicator(indicator, "active", action_map);
  }
}
