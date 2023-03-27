import Head from "next/head";
import { useEffect, useState, useRef } from "react";
//import { webusb } from "usb";
import React from "react";
import ReactDOM from "react-dom";
import notifTable from "./notifTable";
const { Buffer } = require("buffer");
//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];
let start, end;
let receiveArr, patch;
export default function Home() {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [fullNewImg, setFullNewImg] = useState("");

  let portRef = useRef(); //used to store and refer to a port on client's pc
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
    } catch (Error) {
      console.error(Error);
    }
  };
  ///////////////////////////////////////////////////////////////////
  //
  // This function allows for establising connection with an usb device.
  //
  ///////////////////////////////////////////////////////////////////
  const Connect = async () => {
    try {
      //claiming interface
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
      console.error("ERROR - failed to claim interface");
    }
  };
  ///////////////////////////////////////////////////////////////////
  //
  // A function for listening for incoming WebUSB tranfers.
  // This is a recursive function as it has to always listen for
  // incoming transfers. It is in effect a text receiving function.
  //
  ///////////////////////////////////////////////////////////////////
  let Listen = async () => {
    if (!portRef.current) return;
    const endpointIn =
      portRef.current.configuration.interfaces[0].alternate.endpoints[0]
        .endpointNumber;
    portRef.current.transferIn(endpointIn, 256).then((result) => {
      const echo = new Uint8Array(result.data.buffer);
      const tmp = new Uint8Array(receiveArr);
      receiveArr = new Uint8Array(echo.length + tmp.length);
      receiveArr.set(tmp);
      receiveArr.set(echo, tmp.length);

      if (receiveArr.length === 19740) {
        console.log("Read status: ", result.status);
        console.log("Received: ", receiveArr);
        end = performance.now(); //Perfromance testing end
        console.log(
          `Full update execution time: ${Math.floor(end - start)} ms`
        );
        //  checkFull(fullNewImg, receiveArr);
        receiveArr = new Uint8Array(); //zeroing the sum array
      }
      if (receiveArr.length === 2407) {
        console.log("Read status: ", result.status);
        console.log("Received: ", receiveArr);
        end = performance.now(); //Perfromance testing end
        console.log(
          `Delta update execution time: ${Math.floor(end - start)} ms`
        );
        receiveArr = new Uint8Array(); //zeroing the sum array
      }
      Listen(); //recursion
    });
  };
  ///////////////////////////////////////////////////////////////////
  //
  // This function allows for sending data to the connected
  // usb device. Data has to be of string type.
  //
  ///////////////////////////////////////////////////////////////////
  const Send = async (data) => {
    if (!portRef.current) return;
    if (data.length === 0) return;
    const endpointOut =
      portRef.current.configuration.interfaces[0].alternate.endpoints[1]
        .endpointNumber;
    // //converting the data into to utf-8 format
    // let view = new TextEncoder().encode(data); when sending a string
    //console.log(view);
    //portRef.current.transferOut(endpointOut, view);
    portRef.current.transferOut(endpointOut, data).then((result) => {
      console.log("Write status: ", result.status);
    });
  };

  ///////////////////////////////////////////////////////////////////
  //
  // This function sends a POST message to the API method in deltaupdate.js
  // passing the read firmware version as its body.
  ///////////////////////////////////////////////////////////////////
  const Do_delta_update = async (readVersion) => {
    start = performance.now(); //Perfromance testing start
    const response = await fetch("./api/deltaupdate", {
      method: "POST",
      body: readVersion,
    });
    let result = await response.json(); //returns array instead of typed array
    result = new Uint8Array(result.patch.data);
    console.log(result);
    Send(result);
  };

  const Do_full_update = (input) => {
    start = performance.now(); //Perfromance testing start
    const reader = new FileReader();
    reader.readAsArrayBuffer(input); //read and store the image as arraybuffer
    reader.onload = function () {
      const view = new Uint8Array(reader.result);
      Send(view);
    };
    reader.onerror = function () {
      console.error(reader.error);
    };
  };

  const checkFull = (writeRes, readRes) => {
    console.log(writeRes);
    const reader = new FileReader();
    reader.readAsArrayBuffer(writeRes); //read and store the image as arraybuffer
    reader.onload = function () {
      writeRes = new Uint8Array(reader.result);
      if (Buffer.compare(writeRes, readRes) == 0)
        console.log("Full update transfer integrity check passed");
      else console.log("Full update transfer integrity check failed");
    };
  };

  ///////////////////////////////////////////////////////////////////
  // A helper function that simply converts a number of bytes and
  // returns it in more readable format such as KB or MB.
  ///////////////////////////////////////////////////////////////////
  function human_bytes(n) {
    //return the number of bytes 'n' in more human readable form
    if (n < 1024) return "%i B" % n;
    k = (n - 1) / 1024 + 1;
    if (k < 1024) return "%i KB" % k;
    return "%.2f MB" % (float(n) / 2 ** 20);
  }
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
        This is a proof-of-concept of a web app serving delta firmware updates
        through webUSB connection to a client's usb devices.
      </h4>
      <h4>
        For the usb device to apply the received update, it needs to have a
        WebUSB handler program in either of its image slots.{" "}
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
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 15,
          gap: 10,
        }}
      >
        <span style={{ fontWeight: "bold" }}>Product Name: </span>
        {productName}
        <span style={{ fontWeight: "bold" }}>Manufacturer: </span>
        {manufacturer}
        <span style={{ fontWeight: "bold" }}>Serial Number: </span>
        {serialNumber}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 15,
          marginTop: 30,
        }}
      >
        <button onClick={() => Do_delta_update("1.1")}> Delta Update </button>
        <button>Read Firmware</button>
      </div>
      <h4>
        Press Full Update to upload the selected image to the connected device
      </h4>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 15,
        }}
      >
        <button onClick={() => Do_full_update(fullNewImg)}>Full Update</button>
        <label>Select a new image:</label>
        <input type="file" onChange={(e) => setFullNewImg(e.target.files[0])} />
      </div>
      <button onClick={() => checkFull(fullNewImg, receiveArr)}>Check</button>
    </>
  );
}
