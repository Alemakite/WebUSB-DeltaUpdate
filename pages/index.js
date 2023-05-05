import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import React from "react";
import Board from "../components/notifsBoard";
import { Buffer } from "buffer";
import * as webUSBlib from "../lib/webUSBlib";
import WebUSBInferface from "../components/webUSBinterface";
import DoDeltaUpdate from "../components/deltaUpdateinterface";
import DoFullUpdate from "../components/fullUpdateinterface";

export default function Home() {
  const [notifs, setNotifs] = useState([]);

  //global object used to store and refer to the connected device
  let portRef = useRef(undefined);

  ///////////////////////////////////////////////////////////////////
  // This function allows for adding a notification to the
  //  notification board. It can be passed to a function or component
  //  as a parameter/prop enabling it to be called from it.
  ///////////////////////////////////////////////////////////////////
  const addNotif = (type, message) => {
    setNotifs((previous) => [...previous, { type: type, message: message }]);
  };

  //run GetDC() only once per page load
  useEffect(() => {
    async function getDC() {
      portRef.current = await webUSBlib.GetDC({ addNotif: addNotif });
    }
    getDC();
  }, []);

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
      <div style={{ display: "flex", flexDirection: "row", gap: 100 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <WebUSBInferface portRef={portRef} addNotif={addNotif} />
        </div>
        <Board notifs={notifs} />
      </div>
      <div style={styles1.container}>
        <DoDeltaUpdate portRef={portRef} addNotif={addNotif} />
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
  },
};
const styles2 = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
};
