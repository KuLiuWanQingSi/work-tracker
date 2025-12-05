// this exists since Uint8Array.prototype.toBase64 and .fromBase64 are not yet supported by TypeScript
interface Uint8Array {
  toBase64: () => string;
}
interface Uint8ArrayConstructor {
  fromBase64: (base64: string) => Uint8Array;
}
