import { useState } from "react";
import * as webUSBlib from "../lib/webUSBlib";

function DoFullUpdate({ addNotif, portRef }) {
  const [fullNewImg, setFullNewImg] = useState("");
  let receiveArr = [],
    start,
    end;

  const FullStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 25,
      display: portRef.current?.opened ? "block" : "none",
    },
  };

  const FullUpdate = (input) => {
    if (input.length < 1) {
      addNotif("Error", "No file chosen for full update");
      return;
    }
    start = performance.now(); //Perfromance testing start
    const reader = new FileReader();
    reader.readAsArrayBuffer(input); //read and store the image as arraybuffer
    reader.onload = async function () {
      const view = new Uint8Array(reader.result);

      await webUSBlib.Send({
        addNotif: addNotif,
        device: portRef.current,
        data: view,
      });
      await webUSBlib.Listen({
        addNotif: addNotif,
        device: portRef.current,
        buffer: receiveArr,
        size: view.length,
      });
    };
    reader.onerror = function () {
      console.error(reader.error);
    };
  };

  const SelectFile = (file) => {
    setFullNewImg(file.target.files[0]);
    if (file.target.files.length != 1) addNotif("Error", "Image not selected");
  };

  return (
    <div style={FullStyles.container}>
      <h4>
        Press Full Update to upload the selected image (file) to the connected
        device
      </h4>
      <label>
        <input
          type="file"
          onChange={(file) => {
            SelectFile(file);
          }}
        />
      </label>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => FullUpdate(fullNewImg)}>Full Update</button>
      </div>
    </div>
  );
}

export default DoFullUpdate;
