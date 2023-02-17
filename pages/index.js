import Head from "next/head";
import { useEffect, useState, useRef } from "react";
//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];

export default function Home() {
  //Global components
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  let portRef = useRef();

  ///////////////////////////////////////////////////////////////////
  //
  // This function allows for a prompt with avaiable usb devices to
  // pop up and to request connection with one of them.
  //
  ///////////////////////////////////////////////////////////////////
  const GetDevices = async () => {
    try {
      let request = await navigator.usb.requestDevice({ filters: filters });
      portRef.current = request;
      console.log(portRef.current);
      Connect();
    } catch (error) {
      console.log(error);
    }
  };
  ///////////////////////////////////////////////////////////////////
  //
  // This function allows for establising connection with an usb device.
  //
  ///////////////////////////////////////////////////////////////////
  const Connect = async () => {
    try {
      //claiming an interface
      await portRef.current.open();
      if (portRef.current.configuration === null)
        await portRef.current.selectConfiguration(1);
      await portRef.current.claimInterface(0);
      setProductName(portRef.current.productName);
      setManufacturer(portRef.current.manufacturerName);
      setSerialNumber(portRef.current.serialNumber);
      //display data ab the connected device below connect button

      Listen(); //start listening for incoming transfers
    } catch (error) {
      portRef.current.close();
      console.log(error, "ERROR - failed to claim interface");
    }
  };

  ///////////////////////////////////////////////////////////////////
  //
  // A function for listening for incoming WebUSB tranfers.
  // This is a recursive function as it has to always listen for
  // incoming transfers. It is in effect a text receiving function.
  //
  ///////////////////////////////////////////////////////////////////
  let Listen = () => {
    if (!portRef.current) return;
    const endpointIn =
      portRef.current.configuration.interfaces[0].alternate.endpoints[0]
        .endpointNumber;
    portRef.current.transferIn(endpointIn, 64).then((result) => {
      setReciverArea(new TextDecoder().decode(result.data));
      Listen(); //recursion
    });
  };

  ///////////////////////////////////////////////////////////////////
  //
  // A function for reading a binary file. Takes the input of the
  // "choose file" button. Used in Read firmware.
  //
  ///////////////////////////////////////////////////////////////////
  const ReadFile = async (input) => {
    let file = input.target.files[0];
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function () {
      console.log(reader.result);
      Send(reader);
    };
    reader.onerror = function () {
      console.log(reader.error);
    };
    console.log(input);
  };

  ///////////////////////////////////////////////////////////////////
  //
  // This function allows for sending data to the connected
  // usb device. Data has to be of string type.
  //
  ///////////////////////////////////////////////////////////////////
  const Send = (data) => {
    if (!portRef.current) return;
    if (data.length === 0) return;
    console.log("sending to serial:" + data.length);
    console.log("sending to serial: [" + data + "]\n");
    const endpointOut =
      portRef.current.configuration.interfaces[0].alternate.endpoints[1]
        .endpointNumber;
    //converting the data into to utf-8 format
    let view = new TextEncoder().encode(data);
    console.log(view);
    portRef.current.transferOut(endpointOut, view);
  };

  //Rendered wabpage contents/ DOM structure
  return (
    <>
      <Head>
        <title>Delta WebUSB App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Delta WebUSB App</h1>
      <h4>
        This website provides a delta firmware update mechanism for Nordic's
        nrf52480dk board.
      </h4>
      <h4>
        For the board to update its firmware, it needs to have WebUSB handler
        program in either of its image slots.{" "}
      </h4>
      <h4>
        If the board does not run the handler, click "Install WebUSB handler",
        and then "Update device".{" "}
      </h4>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 40,
        }}
      >
        <button
          id="connect"
          onClick={GetDevices}
          style={{ visibility: "visible", maxWidth: "max-content" }}
        >
          Connect To WebUSB Device
        </button>
        <button>Install WebUSB handler</button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 15,
          gap: 10,
        }}
      >
        <div>
          <span style={{ fontWeight: "bold" }}>Product Name: </span>
          {productName}
        </div>
        <div>
          <span style={{ fontWeight: "bold" }}>Manufacturer: </span>
          {manufacturer}
        </div>
        <div>
          <span style={{ fontWeight: "bold" }}>Serial Number: </span>
          {serialNumber}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 15,
          marginTop: 30,
        }}
      >
        <button>Update device</button>
        <button>Read Firmware</button>
      </div>
    </>
  );
}
