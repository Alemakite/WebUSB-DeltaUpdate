test("performs a test of local differentiation, checks for diff blocks equality and update size reduction", async () => {
  const change = [0, 0b01100100, 0b01101001, 0b01100110, 0b01100110, 0]; //"diff"
  const { Buffer } = require("node:buffer");
  const bsdiff4 = require("../bsdiff4.cjs");
  const source = Buffer.alloc(3000, "a");
  let target = Buffer.from(source);
  target.set(change, 100);
  const delta = await bsdiff4.diffOnly({
    oldD: source,
    oldLength: source.length,
    newD: target,
    newLength: target.length,
  });
  const patch = await bsdiff4.writePatch({
    controlArrays: delta[0],
    bdiff: delta[1],
    bextra: delta[2],
  });
  const check_patch = await bsdiff4.readPatch(patch);

  expect(patch.length).toBeLessThan(source.byteLength);
  expect(check_patch).toEqual(delta);
});
