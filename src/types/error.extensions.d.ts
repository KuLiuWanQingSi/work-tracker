interface ErrorConstructor {
  captureStackTrace?: (
    object: object,
    constructor?: (new (...arg: any[]) => any) | ((...arg: any[]) => any),
  ) => void;
}
