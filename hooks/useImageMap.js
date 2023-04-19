import { useState } from "react";

export const useImageMap = () => {
  //strucutre for storing image binaries along with their respective versions

  const [images, setImages] = useState(
    new Map([
      ["1.1", "blinky0/zephyr/zephyr.bin"],
      ["1.2", "blinky1/zephyr/zephyr.bin"],
    ])
  );

  const [extImages, setExtImages] = useState(new Map());

  const addExternal = (version, link) => {
    setExtImages((extImages) => extImages.set(version, link));
  };
  return { extImages, addExternal, images };
};
