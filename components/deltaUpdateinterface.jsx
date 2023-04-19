import React from "react";
import * as webUSBlib from "../lib/webUSBlib";

function DoDeltaUpdate({ addNotif, portRef }) {
  let receiveArr = [],
    start,
    end;

  const DeltaStyles = {
    container: {
      display: portRef.current?.opened ? "block" : "none",
    },
  };

  const DeltaUpdate = async (readVersion) => {
    start = performance.now(); //Perfromance testing start
    const response = await fetch("/api/deltaupdate", {
      method: "POST",
      body: readVersion,
    });

    let result = await response.json(); //returns array instead of typed array
    result = new Uint8Array(result.patch.data);

    await webUSBlib.Send({
      addNotif: addNotif,
      portRef: portRef.current,
      data: result,
    });
    await webUSBlib.Listen({
      addNotif: addNotif,
      portRef: portRef.current,
      buffer: receiveArr,
      size: result.length,
    });
    end = performance.now(); //Perfromance testing end
  };

  return (
    <div style={DeltaStyles.container}>
      <button onClick={() => DeltaUpdate("1.1")}>Delta Update</button>
    </div>
  );
}

export default DoDeltaUpdate;
