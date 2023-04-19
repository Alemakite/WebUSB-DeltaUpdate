import React, { useEffect } from "react";
import { useState } from "react";
import * as webUSBlib from "../lib/webUSBlib";

function WebUSB({ portRef, addNotif }) {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const CharsStyles = {
    container: {
      fontWeight: "bold",
      display: portRef.current?.opened ? "block" : "none",
    },
  };

  const setDCInfo = () => {
    setProductName(portRef.current.productName);
    setManufacturer(portRef.current.manufacturerName);
    setSerialNumber(portRef.current.serialNumber);
  };

  const resetDCInfo = () => {
    setProductName("");
    setManufacturer("");
    setSerialNumber("");
  };

  const Connect = async () => {
    portRef.current = await webUSBlib.RequestDC({
      portRef: portRef.current,
      addNotif: addNotif,
    });
    if (portRef.current) setDCInfo();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 40,
        }}
      >
        <button
          id="connect"
          onClick={() => Connect()}
          style={{ visibility: "visible", maxWidth: "max-content" }}
        >
          Connect Device
        </button>
        <button
          id="forget"
          onClick={() => {
            webUSBlib.ForgetDC({
              addNotif: addNotif,
              portRef: portRef.current,
            });
            resetDCInfo();
            window.location.reload();
          }}
          style={{
            display: portRef.current?.opened ? "block" : "none",
          }}
        >
          Forget Device
        </button>
      </div>

      <div style={styles.container}>
        <span style={CharsStyles.container}>Product Name:</span>
        {productName}
        <span style={CharsStyles.container}>Manufacturer:</span>
        {manufacturer}
        <span style={CharsStyles.container}>Serial Number:</span>
        {serialNumber}
      </div>
    </>
  );
}

const styles = {
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    marginTop: 15,
    gap: 10,
  },
};

export default WebUSB;
