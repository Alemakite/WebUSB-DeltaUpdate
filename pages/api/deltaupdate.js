const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem

//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["1.1", "blinky0/zephyr/zephyr.bin"],
  ["1.2", "blinky1/zephyr/zephyr.bin"],
]);
//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  if (req.method != "POST") return res.end();

  //get old image by matching the version number sent as request body to the version key in image map structure
  var version = req.body;
  var oldDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  var oldImg = readFileSync(oldDir.toString()); //to load and display the binary

  //images.get(images.entries().next().value)
  //get newest image
  var newDir = resolve(
    process.cwd(),
    "images",
    Array.from(images.values()).pop() //get the image with highest version
  );
  var newImg = readFileSync(newDir.toString());

  const bsdiff4 = await import("../../external/bsdiff4"); //importing the library
  const patch = await bsdiff4.diff({
    oldD: oldImg,
    oldLength: oldImg.length,
    newD: newImg,
    newLength: newImg.length,
  });
  return res.json({ patch });
}
