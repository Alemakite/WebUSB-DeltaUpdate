const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem
import { diff, patch } from "../../external/bsdiff4";
//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["key", "zephyr.bin"],
  ["1.2.3", "value2"],
]);

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

  const t = [0, 0b01100100, 0b01101001, 0b01100110, 0b01100110, 0]; //"diff"

  const bsdiff4 = await import("../external/bsdiff4");
  const a = Buffer.alloc(1000, "a");
  let b = Buffer.from(a);
  b.set(t, 100);
  const delta = await bsdiff4.diff_only({
    oldD: a,
    oldLength: a.length,
    newD: b,
    newLength: b.length,
  });

  const patch = await bsdiff4.write_patch({
    controlArrays: delta[0],
    bdiff: delta[1],
    bextra: delta[2],
  });

  return res.json({ value });

  //return res.json({ version, image: images.get(version) });

  //res.redirect to chain APIs(parameters?)?
}
