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
    //start = performance.now(); //Perfromance testing start

    const readVersion = await webUSBlib.ReadFW({
      addNotif: addNotif,
      device: portRef.current,
      imageID: 2,
    });
    if (readVersion == -2) {
      addNotif("Info", "Current firmware version is up to date");
      return;
    }
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

    //end = performance.now(); //Perfromance testing end
    //addNotif("Transfer", `Echo received in ${end - start} ms`);
  };
  const DeltaUpdateTest = async (readVersion) => {
    //start = performance.now(); //Perfromance testing start

    const response = await fetch("/api/deltaupdate", {
      method: "POST",
      body: readVersion,
    });

    let result = await response.json(); //returns array instead of typed array
    let resultPatch = new Uint8Array(result.patch.data);
    addNotif("Info", `Target size: ${result.targetSize}`);
    addNotif("Info", `Patch size: ${result.patchSize}`);
    addNotif("Info", `Patch to Target ratio: ${result.ptRatio}`);
    await webUSBlib.Send({
      addNotif: addNotif,
      device: portRef.current,
      data: resultPatch,
    });
    await webUSBlib.Listen({
      addNotif: addNotif,
      device: portRef.current,
      buffer: receiveArr,
      size: resultPatch.length,
    });

    //end = performance.now(); //Perfromance testing end
    //addNotif("Transfer", `Echo received in ${end - start} ms`);
  };

  return (
    <div style={DeltaStyles.container}>
      <h4>
        Press Delta Update to perform a delta update of the linked device.
      </h4>
      <button onClick={() => DeltaUpdate()}>Delta Update</button>
    </div>
  );
}

export default DoDeltaUpdate;
