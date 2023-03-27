const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem

//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["key", "zephyr.bin"],
  ["1.2.3", "value2"],
]);

//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  if (req.method != "POST") return res.end();

  //get old image by matching the version number sent as request body to the version key in image map structure
  // var version = req.body;
  // var oldDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  // var oldImg = readFileSync(oldDir); //to load and display the binary

  // //get newest image
  // var newDir = resolve(
  //   process.cwd(),
  //   "images",
  //   images.get(images.entries().next().value) //get the image with highest version
  // );
  // var newImg = readFileSync(newDir);

  const bsdiff4 = await import("../../external/bsdiff4"); //importing the library
  // const patch = await bsdiff4.diff({
  //   oldD: oldImg,
  //   oldLength: oldImg.length,
  //   newD: newImg,
  //   newLength: newImg.length,
  // });
  const t = [0, 0b01100100, 0b01101001, 0b01100110, 0b01100110, 0]; //"diff"
  const a = Buffer.alloc(50000, "a");
  let b = Buffer.from(a);
  b.set(t, 100);
  const patch = await bsdiff4.diff({
    oldD: a,
    oldLength: a.length,
    newD: b,
    newLength: b.length,
  });
  return res.json({ patch });

  //res.redirect to chain APIs(parameters?)?
}
