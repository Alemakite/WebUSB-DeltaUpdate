import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import React from "react";
import ReactDOM from "react-dom";
import Table from "../components/alertTable";
const { Buffer } = require("buffer");
//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];
let start, end; //variables for performence testing
let receiveArr, deltaLen, fullLen;
export default function Home() {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [fullNewImg, setFullNewImg] = useState("");
  const [notifs, setNotifs] = useState([]);

  let portRef = useRef(); //global object used to store and refer to a port on host

  //run only once per page load to check for existing permissions
  const GetDC = async () => {
    const devices = await navigator.usb.getDevices({ filters: filters });
    if (devices !== undefined) {
      portRef.current = devices[0];
      setNotifs((prev) => [
        ...prev,
        { type: "Info", message: "Permission found" },
      ]);
    }
  };
  useEffect(() => {
    GetDC();
  }, []);
  ///////////////////////////////////////////////////////////////////
  // This function allows for a prompt with avaiable usb devices to
  // pop up and to request connection with one of them.
  ///////////////////////////////////////////////////////////////////
  const RequestDC = async () => {
    try {
      if (portRef.current) {
        setNotifs([]); //Zeroing alert table
        return Connect();
      }
      let device = await navigator.usb.requestDevice({ filters: filters });
      if (device !== undefined) portRef.current = device;
      setNotifs([]); //Zeroing alert table
      Connect();
    } catch (Error) {
      setNotifs((prev) => [
        ...prev,
        { type: "Error", message: "ERROR - device not selected" },
      ]); //Adding an alert
      console.error(Error);
    }
  };
  ///////////////////////////////////////////////////////////////////
  // This function allows for establising connection with an usb device.
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
      setNotifs((prev) => [...prev, { type: "Info", message: "Connected" }]); //Adding an alert
      Listen(); //start listening for incoming transfers
    } catch (error) {
      portRef.current.close();
      setNotifs((prev) => [
        ...prev,
        { type: "Error", message: "ERROR - failed to claim interface" },
      ]); //Adding an alert
    }
  };
  ///////////////////////////////////////////////////////////////////
  // A function for listening for incoming WebUSB tranfers.
  // This is a recursive function as it has to always listen for
  // incoming transfers.
  ///////////////////////////////////////////////////////////////////
  let Listen = async () => {
    if (!portRef.current) {
      portRef.current.close();
      return;
    }
    const endpointIn =
      portRef.current.configuration.interfaces[0].alternate.endpoints[0]
        .endpointNumber;
    portRef.current.transferIn(endpointIn, 256).then((result) => {
      const echo = new Uint8Array(result.data.buffer);
      const tmp = new Uint8Array(receiveArr);
      receiveArr = new Uint8Array(echo.length + tmp.length);
      receiveArr.set(tmp);
      receiveArr.set(echo, tmp.length);

      if (receiveArr.length === fullLen) {
        end = performance.now(); //Perfromance testing end
        setNotifs((prev) => [
          ...prev,
          {
            type: "Info",
            message: `Full update execution time: ${Math.floor(
              end - start
            )} ms`,
          },
        ]); //Adding an alert
        setNotifs((prev) => [
          ...prev,
          { type: "Transfer", message: `Received ${fullLen} bytes ` },
        ]); //Adding an alert

        //  checkFull(fullNewImg, receiveArr);
        receiveArr = new Uint8Array(); //zeroing the sum array
      }
      if (receiveArr.length === deltaLen) {
        end = performance.now(); //Perfromance testing end
        setNotifs((prev) => [
          ...prev,
          {
            type: "Info",
            message: `Delta update execution time: ${Math.floor(
              end - start
            )} ms`,
          },
        ]); //Adding an alert
        setNotifs((prev) => [
          ...prev,
          { type: "Transfer", message: `Received ${deltaLen} bytes ` },
        ]); //Adding an alert
        receiveArr = new Uint8Array(); //zeroing the sum array
      }
      Listen(); //recursion
    });
  };
  ///////////////////////////////////////////////////////////////////
  // This function allows for sending data to the connected
  // usb device. In order to be properly received, data has to be in
  // uint8array type.
  ///////////////////////////////////////////////////////////////////
  const Send = async (data) => {
    if (!portRef.current) return;
    if (data.length === 0) return;
    const endpointOut =
      portRef.current.configuration.interfaces[0].alternate.endpoints[1]
        .endpointNumber;
    portRef.current.transferOut(endpointOut, data).then((result) => {
      setNotifs((prev) => [
        ...prev,
        { type: "Transfer", message: `Data sent: ${result.status}` },
      ]); //Adding an alert
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
    deltaLen = result.length;
    Send(result);
  };
  const Do_full_update = (input) => {
    start = performance.now(); //Perfromance testing start
    const reader = new FileReader();
    reader.readAsArrayBuffer(input); //read and store the image as arraybuffer
    reader.onload = function () {
      const view = new Uint8Array(reader.result);
      fullLen = view.length;
      Send(view);
      setNotifs((prev) => [
        ...prev,
        { type: "Transfer", message: "Sending full" },
      ]); //Adding an alert
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
          onClick={RequestDC}
          style={{ visibility: "visible", maxWidth: "max-content" }}
        >
          Connect To WebUSB Device
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            display: "flex",
            flex: 1,
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
        <Table notifs={notifs} />
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
          gap: 5,
        }}
      >
        <button
          onClick={() => {
            if (fullNewImg.length > 1) Do_full_update(fullNewImg);
            else {
              setNotifs((prev) => [
                ...prev,
                {
                  type: "Error",
                  message: "Cannot do full update without any image selected",
                },
              ]); //Adding an alert
            }
          }}
        >
          Full Update
        </button>
        <label>Select a new image:</label>
        <input
          type="file"
          onChange={(e) => {
            setFullNewImg(e.target.files[0]);
            if (e.target.files.length < 1) {
              setNotifs((prev) => [
                ...prev,
                { type: "Error", message: "Image not selected" },
              ]); //Adding an alert
            }
          }}
        />
      </div>
      <button onClick={() => checkFull(fullNewImg, receiveArr)}>Check</button>
    </>
  );
}
