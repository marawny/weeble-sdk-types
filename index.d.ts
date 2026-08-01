/// <reference path="./lib.weeble.d.ts" />
/// <reference path="./runtime.d.ts" />

declare module "@weeble/sdk/discord" {
  const api: typeof discord;
  export default api;
}

declare module "@weeble/sdk/runtime" {
  const api: typeof weeble;
  export default api;
}

declare module "@weeble/discord" {
  const api: typeof discord;
  export default api;
}

declare module "@weeble/runtime" {
  const api: typeof weeble;
  export default api;
}
