import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import React from "react";
import Table from "../components/notifiTable";
import { Buffer } from "buffer";
import * as webUSBlib from "../lib/webUSBlib";
import WebUSBInferface from "../components/webUSBinterface";
import DoDeltaUpdate from "../components/deltaUpdateinterface";
import DoFullUpdate from "../components/fullUpdateinterface";

export default function Home() {
  const [notifs, setNotifs] = useState([]);
  //const [portRef, setportRef] = useState({ current: null });
  let portRef = useRef(undefined); //global object used to store and refer to a port on host

  const addNotif = (type, message) => {
    setNotifs((previous) => [...previous, { type: type, message: message }]);
    //notifs.concat({ type: type, message: message }));
  };

  //run GetDC() only once per page load
  useEffect(() => {
    async function getDC() {
      portRef.current = await webUSBlib.GetDC();
      if (portRef.current) addNotif("Info", "Permission found");
    }
    getDC();
  }, []);

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

  const styles3 = {
    container: {
      display: portRef.current?.opened ? "block" : "none",
    },
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
        WebUSB handler program in either of its image slots.
      </h4>
      <div style={{ display: "flex", flexDirection: "row", gap: 300 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <WebUSBInferface portRef={portRef} addNotif={addNotif} />
        </div>
        <Table notifs={notifs} />
      </div>

      <div style={styles1.container}>
        <DoDeltaUpdate portRef={portRef} addNotif={addNotif} />
      </div>
      <div style={styles3.container}>
        <h4>
          Press Read Firmware to read information on the app residing in the 2nd
          slot of the device
        </h4>
        <button>Read Firmware</button>
      </div>
      <div style={styles2.container}>
        <DoFullUpdate portRef={portRef} addNotif={addNotif} />
      </div>
    </>
  );
}

const styles1 = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 15,
    marginTop: 30,
  },
};
const styles2 = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 10,
  },
};
