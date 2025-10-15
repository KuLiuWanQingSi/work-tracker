import { Sorting } from "@/definitions/sorting_types";
import { i18n } from "@/locales";
import { entry_matcher } from "@/procedures/searching-support";
import { sorting_date_to_string, sorting_number_to_string, to_sorting } from "@/procedures/sorting";
import { useDatabaseStore } from "@/stores/database";
import type { DataItem } from "./datasource-data";
import type { DatasourceEntryConfiguration } from "./datasource-entry-details";

const t = i18n.global.t;

export interface iSearchNode {
  evaluate: (item: DataItem) => boolean;
  explain: () => string;
}

export abstract class iLogicalSearchNode implements iSearchNode {
  children: iSearchNode[] = [];
  abstract short_circuit(calculated: boolean): boolean;
  abstract reducer(calculated: boolean, current: boolean): boolean;
  abstract starter(): boolean;
  abstract explain(): string;

  public evaluate(item: DataItem): boolean {
    if (this.children.length === 0) {
      return true;
    }
    return this.children.reduce((calculated, current_child) => {
      if (this.short_circuit(calculated)) {
        return calculated;
      }
      return this.reducer(calculated, current_child.evaluate(item));
    }, this.starter());
  }
  public add_child(child: iSearchNode) {
    this.children.push(child);
  }
  public remove_child(child: iSearchNode) {
    this.children = this.children.filter((item) => item !== child);
  }
}
export class AndSearchNode extends iLogicalSearchNode {
  short_circuit(calculated: boolean): boolean {
    return !calculated;
  }
  reducer(calculated: boolean, current: boolean): boolean {
    return calculated && current;
  }
  starter(): boolean {
    return true;
  }
  explain(): string {
    return this.children.map((child) => child.explain()).join(t("logical.and"));
  }
}
export class OrSearchNode extends iLogicalSearchNode {
  short_circuit(calculated: boolean): boolean {
    return calculated;
  }
  reducer(calculated: boolean, current: boolean): boolean {
    return calculated || current;
  }
  starter(): boolean {
    return false;
  }
  explain(): string {
    return this.children.map((child) => child.explain()).join(t("logical.or"));
  }
}
export class NotSearchNode implements iSearchNode {
  #child: iSearchNode;
  constructor(child: iSearchNode) {
    this.#child = child;
  }
  public evaluate(item: DataItem): boolean {
    return !this.#child.evaluate(item);
  }
  explain(): string {
    return `${t("logical.not")}${this.#child.explain()}`;
  }
}
export class GeneralTextSearchNode implements iSearchNode {
  #text: string;
  #entries: DatasourceEntryConfiguration[];
  constructor(value: string, entries: DatasourceEntryConfiguration[]) {
    this.#text = value;
    this.#entries = entries;
  }
  public evaluate(item: DataItem): boolean {
    // we try no exact match on each entry
    return this.#entries.some((entry_config): boolean => {
      const entry_value = item.entries?.get(entry_config.name);
      if (entry_value === undefined) {
        return false;
      }
      const result = entry_matcher(entry_value, entry_config, this.#text);
      return result;
    });
  }
  explain(): string {
    return t("acTion.includes", [this.#text]);
  }
}
// basic entry based search node that checks only if the entry exists on the item
export class BasicEntrySearchNode implements iSearchNode {
  entry_config: DatasourceEntryConfiguration;
  constructor(config: DatasourceEntryConfiguration) {
    this.entry_config = config;
  }
  public evaluate(item: DataItem): boolean {
    const result = item.entries?.has(this.entry_config.name) ?? false;
    return result;
  }
  explain(): string {
    return t("acTion.includes_entry", [this.entry_config.name]);
  }
}
// entry based search that accepts partial match
export class PartialEntrySearchNode extends BasicEntrySearchNode {
  #target: string;
  constructor(config: DatasourceEntryConfiguration, target: string) {
    super(config);
    this.#target = target;
  }
  public evaluate(item: DataItem): boolean {
    if (!super.evaluate(item)) {
      return false;
    }
    return entry_matcher(item.entries!.get(this.entry_config.name)!, this.entry_config, this.#target);
  }
  explain(): string {
    return t("acTion.entry_includes", [this.entry_config.name, this.#target]);
  }
}
// entry based search that requires exact match
export class ExactEntrySearchNode extends BasicEntrySearchNode {
  #target: string;
  constructor(config: DatasourceEntryConfiguration, target: string) {
    super(config);
    this.#target = target;
  }
  public evaluate(item: DataItem): boolean {
    if (!super.evaluate(item)) {
      return false;
    }
    return entry_matcher(item.entries!.get(this.entry_config.name)!, this.entry_config, this.#target, {
      exact: true,
    });
  }
  explain(): string {
    return t("acTion.entry_matches", [this.entry_config.name, this.#target]);
  }
}
// sorting based search
export class SortingEntrySearchNode extends BasicEntrySearchNode {
  #comparator: (item: string) => boolean;
  #explain: string;
  constructor(config: DatasourceEntryConfiguration, comparator: (item: string) => boolean, explain: string) {
    super(config);
    this.#comparator = comparator;
    this.#explain = explain;
  }
  public evaluate(item: DataItem): boolean {
    if (!super.evaluate(item)) {
      return false;
    }
    const item_value = to_sorting(this.entry_config, item.entries!.get(this.entry_config.name)!);
    if (item_value === null) {
      return false;
    }
    return this.#comparator(item_value);
  }
  explain(): string {
    return this.#explain;
  }
}

// operators used in search commands and escaping helpers
//  NOTE: operators are always single characters!
//  escaping is only useful when specifying the name of entry since special characters in the entry name will
//   otherwise be mistaken as the operator. Therefore, escaping is only required if the entry name contains
//   any of the operators listed below, or have a leading '"'. Note that '"' in the middle of the entry name
//   can never mislead the parser
const Operators = ["=", ":", ">", "<", "@"];
export function extract_enclosed_string(value: string): { enclosed: string; remainder: string } | null {
  const matched = value.match(/^"((?:[^\\"]|\\"|\\\\)+?)"/);
  if (matched === null) {
    return null;
  }
  if (matched[1] === undefined) {
    return null;
  }
  return {
    enclosed: matched[1].replaceAll('\\"', '"').replaceAll("\\\\", "\\"),
    remainder: value.substring(matched[0].length),
  };
}
export function to_enclosed_string(value: string): string {
  if (
    value.startsWith('"') ||
    Operators.map((terminator) => value.indexOf(terminator) !== -1).some((i) => i)
  ) {
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  }
  return value;
}
export function get_operator_index(command: string): number {
  return Operators.map((terminator) => command.indexOf(terminator)).reduce((previous, current) =>
    previous === -1 ? current : current === -1 ? previous : Math.min(previous, current)
  );
}

function handle_entry_search(command: string): iSearchNode | null {
  if (command.length === 0) {
    return null;
  }
  // extract the entry name first
  const { entry_name, remainder } = (() => {
    if (command[0] === '"') {
      const intermediate = extract_enclosed_string(command);
      if (intermediate === null) {
        return { entry_name: null, remainder: null };
      }
      return { entry_name: intermediate.enclosed, remainder: intermediate.remainder };
    }
    const terminator_position = get_operator_index(command);
    return terminator_position === -1
      ? { entry_name: command, remainder: "" }
      : {
          entry_name: command.substring(0, terminator_position),
          remainder: command.substring(terminator_position),
        };
  })();
  if (entry_name === null || remainder === null) {
    return null;
  }
  const database = useDatabaseStore();
  // is this a valid entry name? try to find its configuration
  const entry_config = database.entries.find((config) => config.name === entry_name);
  if (entry_config === undefined) {
    // no it is not
    return null;
  }
  if (remainder.length === 0) {
    return new BasicEntrySearchNode(entry_config);
  }
  if (remainder.length === 1) {
    // empty string as search content is not allowed
    return null;
  }
  const effective_value = remainder.substring(1);
  if (["=", ":"].includes(remainder[0]!)) {
    return new (remainder[0] === "=" ? PartialEntrySearchNode : ExactEntrySearchNode)(
      entry_config,
      effective_value
    );
  }
  if (entry_config.sorting_method === Sorting.Disabled) {
    return null;
  }
  const sortable_target =
    entry_config.sorting_method === Sorting.AsString
      ? effective_value
      : entry_config.sorting_method === Sorting.AsDate
      ? sorting_date_to_string(effective_value)
      : sorting_number_to_string(effective_value);
  if (sortable_target === null) {
    return null;
  }
  const sortable_mapping = new Map<
    string,
    { comparator: (lhs: string, rhs: string) => boolean; explain_key: string }
  >([
    ["<", { comparator: (lhs, rhs) => lhs < rhs, explain_key: "acTion.entry_less_than" }],
    ["@", { comparator: (lhs, rhs) => lhs === rhs, explain_key: "acTion.entry_equals" }],
    [">", { comparator: (lhs, rhs) => lhs > rhs, explain_key: "acTion.entry_greater_than" }],
  ]);
  const sorting_pair = sortable_mapping.get(remainder[0]!)!;
  return new SortingEntrySearchNode(
    entry_config,
    (item: string): boolean => sorting_pair.comparator(item, sortable_target),
    t(sorting_pair.explain_key, [entry_config.name, effective_value])
  );
}

export function compile_search_command(command: string): iSearchNode | null {
  if (command.length === 0) {
    return null;
  }
  if (command[0] === "!") {
    const subcommand = compile_search_command(command.substring(1));
    return subcommand === null ? null : new NotSearchNode(subcommand);
  }
  if (command[0] === "$") {
    return handle_entry_search(command.substring(1));
  }
  const database = useDatabaseStore();
  return new GeneralTextSearchNode(command, database.entries);
}

export function get_available_operators(
  config: DatasourceEntryConfiguration
): { operator: string; explanation: string }[] {
  const base = [
    {
      operator: ":",
      explanation: t("search.partial_match"),
    },
    {
      operator: "=",
      explanation: t("search.exact_match"),
    },
  ];
  if (config.sorting_method === Sorting.Disabled) {
    return base;
  }
  return base.concat([
    {
      operator: "<",
      explanation: t("search.match_lesser"),
    },
    {
      operator: "@",
      explanation: t("search.match_equal"),
    },
    {
      operator: ">",
      explanation: t("search.match_greater"),
    },
  ]);
}
