const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem
import { diff, patch } from "../../external/bsdiff4";
//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["key", "zephyr.bin"],
  ["1.2.3", "value2"],
]);

///////////////////////////////////////////////////////////////////
// A function for converting a buffer object to ArrayBuffer.
// Returns new ArrayBuffer with conents of given buffer.
//
// Author: Martin Thomson
// Date: Aug 23, 2012
// URL: https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
///////////////////////////////////////////////////////////////////
function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  //if (req.method != "POST") return res.end();

  //get old image
  var version = req.body;
  var oldDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  var oldImg = readFileSync(oldDir); //to load and display the binary

  //get newest image
  var newDir = resolve(
    process.cwd(),
    "images",
    images.get(images.entries().next().value)
  );
  var newImg = readFileSync(newDir);

  const arrBuff_oldImg = toArrayBuffer(oldImg);
  const arrBuff_newImg = toArrayBuffer(newImg);
  //diff here after converting newImg and oldImg to arraybuffer
  //const arrBuff_diff = diff(arrBuff_oldImg, arrBuff_newImg);

  //DEV
  // const t = [0b01100100, 0b01101001, 0b01100110, 0b01100110]; //"diff"
  // // Array buffer approach
  // // const a = new ArrayBuffer(800);
  // // let aS = new Int8Array(a);
  // // aS.fill(0b01100001); //'a'

  // // let b = new ArrayBuffer(700);
  // // let bS = new Int8Array(b);
  // // bS.fill(0b01100001); //'a'
  // // bS.set(t, 50);
  // //diff here after converting newImg and oldImg to arraybuffer

  // //Buffer approach
  // const a = Buffer.alloc(200, 0b01100001);
  // let b = Buffer.alloc(150, 0b01100001);
  // console.log(a.length);
  // b.set(t, 100);
  // diff({
  //   oldD: a,
  //   oldLength: a.length,
  //   newD: b,
  //   newLength: b.length,
  // }).then((value) => {
  //   if (value == -1) return -1;
  //   // console.log(value.byteLength);
  //   // console.log(value);
  return res.json({ value });
  //});
  //return res.json({ version, image: images.get(version) });

  //res.redirect to chain APIs(parameters?)?
}
