const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem
import { diff } from "bsdiffjs";

//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["1.1.0", "blinky0/zephyr.bin"],
  ["1.2.0", "blinky1/zephyr.bin"],
]);

//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  if (req.method != "POST") return res.end();

  //get old image by matching the version number sent as request body to the version key in image map structure
  var version = req.body;
  var oldDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  var oldImg = readFileSync(oldDir.toString()); //to load and display the binary

  // if (version >= Array.from(images.keys()).pop()) {
  //   return -2;
  // }
  //get newest image
  var newDir = resolve(
    process.cwd(),
    "images",
    Array.from(images.values()).pop() //get the image with highest version
  );
  var newImg = readFileSync(newDir.toString());

  const patch = await diff(oldImg, newImg);
  console.log(oldImg.byteLength);
  console.log(patch.byteLength);
  console.log(
    "P/T ratio:",
    +((patch.byteLength / oldImg.byteLength) * 100).toFixed(2),
    "%"
  );
  return res.json({ patch });
}
