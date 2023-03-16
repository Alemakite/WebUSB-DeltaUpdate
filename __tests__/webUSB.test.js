test("checks webusb connecton", () => {
  const webusb = import("../pages/index");
  navigator.usb.requestDevice({ filters: filters }).then((device) => {
    console.log(device.productName);
    console.log(device.manufacturerName);
  });
  expect(sum(1, 2)).toBe(3);
});
