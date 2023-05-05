var FWREAD = 0xa2;
var VERSION_STRUCT_SIZE = 0x10;
///////////////////////////////////////////////////////////////////
// This function allows to check for existing permissions to
//access any detected USB device.
///////////////////////////////////////////////////////////////////
export const GetDC = async ({ addNotif }) => {
  try {
    const devices = await navigator.usb.getDevices({ filters: filters });
    if (devices !== undefined) {
      addNotif("Info", "Permission found");
      await Connect({
        device: devices[0],
        addNotif: addNotif,
      });
    }
  } catch (Error) {
    addNotif("Error", Error);
  }
};

///////////////////////////////////////////////////////////////////
// This function allows for a prompt with avaiable usb devices to
// pop up and to request connection with one of them.
///////////////////////////////////////////////////////////////////
export const RequestDC = async ({ device, addNotif }) => {
  try {
    if (device) {
      await Connect({ device: device, addNotif: addNotif });
      return device;
    }

    const dc = await navigator.usb.requestDevice({ filters: filters });
    if (dc !== undefined) {
      await Connect({ device: dc, addNotif: addNotif });
      return dc;
    }
  } catch (Error) {
    console.error(Error);
  }
};

///////////////////////////////////////////////////////////////////
// This function allows for establising connection with an usb device.
///////////////////////////////////////////////////////////////////
export const Connect = async ({ device, addNotif }) => {
  try {
    console.log(device);
    //claiming interface
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    await device.claimInterface(0);
    addNotif("Info", "Device Connected");
  } catch (error) {
    addNotif("Error", error);
    device.close();
  }
};

///////////////////////////////////////////////////////////////////
// A function for listening for incoming WebUSB tranfers.
// This is a recursive function as it has to always listen for
// incoming transfers.
///////////////////////////////////////////////////////////////////
export const Listen = async ({ addNotif, device, buffer, size }) => {
  if (!device) {
    device.close();
    addNotif("Error", "Device closed");
    return;
  }

  const endpointIn =
    device.configuration.interfaces[0].alternate.endpoints[0].endpointNumber;
  const result = await device.transferIn(endpointIn, 64);

  if (result.status === "stall") {
    console.warn("Endpoint stalled. Clearing.");
    await device.clearHalt(1);
  }

  const echo = new Uint8Array(result.data.buffer);
  let tmp = new Uint8Array(buffer);
  buffer = new Uint8Array(echo.length + tmp.length);
  buffer.set(tmp);
  buffer.set(echo, tmp.length);
  if (buffer.byteLength === size) {
    console.log(buffer);
    tmp = buffer.byteLength;
    buffer = new Uint8Array(1);
    addNotif(
      "Transfer",
      `Data received: status ${result.status},  ${tmp} bytes`
    );
    return;
  }
  Listen({
    addNotif: addNotif,
    device: device,
    buffer: buffer,
    size: size,
  }); //recursion
};

///////////////////////////////////////////////////////////////////
// This function allows for sending data to the connected
// usb device. In order to be properly received, data has to be in
// uint8array or buffer type.
///////////////////////////////////////////////////////////////////
export const Send = async ({ addNotif, device, data }) => {
  if (!device) {
    addNotif("Error", "FAILED - BAD CONNECTION");
    return;
  }
  if (data.length === 0) {
    addNotif("Error", "FAILED - BAD LENGTH");
    return;
  }
  console.log(data);
  const endpointOut =
    device.configuration.interfaces[0].alternate.endpoints[1].endpointNumber;
  const result = await device.transferOut(endpointOut, data);
  addNotif(
    "Transfer",
    `Data sent: status ${result.status}, ${result.bytesWritten} bytes`
  );
};

///////////////////////////////////////////////////////////////////
// This function allows for reading firmware version of the image
//  residing in the secondary slot of the device. The function
//  sends a control request and receives the image read structure
//  in return. The strucure representing an image version consists
//  of 3 elements: major, minor, and revision.
///////////////////////////////////////////////////////////////////
export const ReadFW = async ({ addNotif, device }) => {
  if (!device) {
    addNotif("Error", "DEVICE NOT CONNECTED");
    return;
  }

  const result = await device.controlTransferIn(
    {
      requestType: "vendor",
      recipient: "interface",
      request: 0x0f, // vendor-specific request:
      value: 0x00,
      index: 0x00, // Interface 0 is the recipient
    },
    VERSION_STRUCT_SIZE
  );

  const main = new Uint8Array(result.data.buffer);
  const revision = new Uint16Array(result.data.buffer, 2);
  const version = `${main[0]}.${main[1]}.${revision.toString()}`;
  addNotif(
    "Transfer",
    `Firmware Read status: ${result.status}, version: ${version} `
  );

  return version;
};

///////////////////////////////////////////////////////////////////
// This function allows for revoking permission to access paired
// device on web page load.
///////////////////////////////////////////////////////////////////
export const ForgetDC = async ({ addNotif, device }) => {
  await device.close();
  await device.forget();
  addNotif("Info", "Device Forgotten");
};

//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];
