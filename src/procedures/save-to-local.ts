export function save_to_local(file: Blob, name?: string) {
  const helper = document.createElement("a");
  helper.href = URL.createObjectURL(file);
  helper.download = name ?? "save_to_local";
  helper.click();
  URL.revokeObjectURL(helper.href);
}
