// declare interfaces provided by Violentmonkey / Greasemonkey
declare const GM: {
  addStyle: (css: string) => void;
  getValue: (key: string, defaultValue: any) => Promise<any>;
  setValue: (key: string, value: any) => Promise<void>;
  deleteValue: (key: string) => Promise<void>;
};
declare function GM_addValueChangeListener(
  name: string,
  callback: (name: string, oldValue: any, newValue: any, remote: boolean) => void
): string;
export class Runner {
  private constructor() {}
  static add_style(css: string): void {
    return GM.addStyle(css);
  }
  static async get_value<T>(key: string): Promise<T | undefined> {
    return (await GM.getValue(key, undefined)) as T | undefined;
  }
  static async set_value<T>(key: string, value: T): Promise<void> {
    return GM.setValue(key, value);
  }
  static async delete_value(key: string): Promise<void> {
    return GM.deleteValue(key);
  }
  static add_listener<T>(
    name: string,
    callback: (name: string, old_value: T, new_value: T, remote: boolean) => void
  ): string {
    return GM_addValueChangeListener(name, callback);
  }
}
