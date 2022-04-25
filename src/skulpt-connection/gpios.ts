let gGpioApi: any = null;

declare var Sk: any;

export const ensureGpioConnection = () => {
  if (gGpioApi == null) {
    gGpioApi = Sk.pytchsupport.WebSocket_GpioApi(
      WebSocket,
      "ws://localhost:8055/"
    );
  }
  Sk.pytch.gpio_api = gGpioApi;
};
