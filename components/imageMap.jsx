const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem
//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["1.1", "blinky0/zephyr/zephyr.bin"],
  ["1.2", "blinky1/zephyr/zephyr.bin"],
]);

const ImgMap = ({ img }) => {
  let imgDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  var oldImg = readFileSync(oldDir.toString()); //to load and display the binary

  //images.get(images.entries().next().value)
  //get newest image
  var newDir = resolve(
    process.cwd(),
    "images",
    Array.from(images.values()).pop() //get the image with highest version
  );
  var newImg = readFileSync(newDir.toString());
  return (
    //displaying notifs passed as the argument
    <div style={styles.container}>
      {notifs.map((element, i) => {
        return <Alert key={`notifs-${i}`} notify={element} />;
      })}
    </div>
  );
};

const Img = ({ version, path }) => {
  const newImg = {
    version: version,
    path: path,
  };
  return (
    <div
      style={{
        fontWeight: "bold",
        color: color,
        outline: "solid thin",
        outlineColor: "black",
        padding: "10px",
      }}
    >
      {notify.message}
    </div>
  );
};
