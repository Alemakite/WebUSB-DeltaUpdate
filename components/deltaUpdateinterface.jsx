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

  const DeltaUpdate = async () => {
    start = performance.now(); //Perfromance testing start

    const readVersion = await webUSBlib.ReadFW({
      addNotif: addNotif,
      device: portRef.current,
    });
    console.log(readVersion);

    const response = await fetch("/api/deltaupdate", {
      method: "POST",
      body: readVersion,
    });

    let result = await response.json(); //returns array instead of typed array
    result = new Uint8Array(result.patch.data);

    await webUSBlib.Send({
      addNotif: addNotif,
      device: portRef.current,
      data: result,
    });
    await webUSBlib.Listen({
      addNotif: addNotif,
      device: portRef.current,
      buffer: receiveArr,
      size: result.length,
    });

    end = performance.now(); //Perfromance testing end
    addNotif("Transfer", `Echo received in ${end - start} ms`);
  };

  return (
    <div style={DeltaStyles.container}>
      <button onClick={() => DeltaUpdate()}>Delta Update</button>
    </div>
  );
}

export default DoDeltaUpdate;
