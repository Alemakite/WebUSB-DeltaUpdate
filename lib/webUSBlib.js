///////////////////////////////////////////////////////////////////
// This function allows to check for existing permissions to
//access any detected USB device.
///////////////////////////////////////////////////////////////////
export const GetDC = async () => {
  try {
    const devices = await navigator.usb.getDevices({ filters: filters });
    if (devices !== undefined) return devices[0];
  } catch (Error) {
    console.error(Error);
  }
};

///////////////////////////////////////////////////////////////////
// This function allows for a prompt with avaiable usb devices to
// pop up and to request connection with one of them.
///////////////////////////////////////////////////////////////////
export const RequestDC = async ({ portRef, addNotif }) => {
  try {
    if (portRef) {
      await Connect({ portRef: portRef, addNotif: addNotif });
      return portRef;
    }

    const device = await navigator.usb.requestDevice({ filters: filters });
    if (device !== undefined) {
      await Connect({ portRef: device, addNotif: addNotif });
      return device;
    }
  } catch (Error) {
    console.error(Error);
  }
};

///////////////////////////////////////////////////////////////////
// This function allows for establising connection with an usb device.
///////////////////////////////////////////////////////////////////
export const Connect = async ({ portRef, addNotif }) => {
  try {
    console.log(portRef);
    //claiming interface
    await portRef.open();
    if (portRef.configuration === null) await portRef.selectConfiguration(1);
    await portRef.claimInterface(0);
    console.log(portRef);
    addNotif("Info", "Device Connected");
  } catch (error) {
    addNotif("Error", error);
    portRef.close();
    //return " failed to claim interface";
  }
};

///////////////////////////////////////////////////////////////////
// A function for listening for incoming WebUSB tranfers.
// This is a recursive function as it has to always listen for
// incoming transfers.
///////////////////////////////////////////////////////////////////
export const Listen = async ({ addNotif, portRef, buffer, size }) => {
  if (!portRef) {
    portRef.close();
    addNotif("Error", "Device closed");
    return;
  }
  const endpointIn =
    portRef.configuration.interfaces[0].alternate.endpoints[0].endpointNumber;
  const result = await portRef.transferIn(endpointIn, 256);
  const echo = new Uint8Array(result.data.buffer);
  let tmp = new Uint8Array(buffer);
  buffer = new Uint8Array(echo.length + tmp.length);
  buffer.set(tmp);
  buffer.set(echo, tmp.length);
  if (buffer.byteLength === size) {
    tmp = new Uint8Array(buffer);
    buffer = new Uint8Array(1);
    addNotif("Transfer", `Echo received: ${tmp.byteLength} bytes`);
  } else
    return Listen({
      addNotif: addNotif,
      portRef: portRef,
      buffer: buffer,
      size: size,
    }); //recursion
};

///////////////////////////////////////////////////////////////////
// This function allows for sending data to the connected
// usb device. In order to be properly received, data has to be in
// uint8array type.
///////////////////////////////////////////////////////////////////
export const Send = async ({ addNotif, portRef, data }) => {
  if (!portRef) {
    addNotif("Error", "FAILED - BAD CONNECTION");
    return;
  }
  if (data.length === 0) {
    addNotif("Error", "FAILED - BAD LENGTH");
    return;
  }
  console.log(portRef);
  const endpointOut =
    portRef.configuration.interfaces[0].alternate.endpoints[1].endpointNumber;
  const result = await portRef.transferOut(endpointOut, data);
  addNotif(
    "Transfer",
    `Data sent: ${result.status} size: ${result.bytesWritten} bytes`
  );
};

export const ForgetDC = async ({ addNotif, portRef }) => {
  await portRef.close();
  console.log(portRef);
  await portRef.forget();
  console.log(portRef);
  addNotif("Info", "Device Forgotten");
};

//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];
