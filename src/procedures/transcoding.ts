export function to_readable_hexadecimal<T extends ArrayBufferView>(array: T): string {
  const viewed_array = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  return Array.from(viewed_array, value => value.toString(16).toUpperCase().padStart(2, "0")).join(":");
}
