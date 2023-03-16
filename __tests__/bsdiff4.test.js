test("performs a test of local differentiation and checks diff blocks equality", async () => {
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

  const check_patch = await bsdiff4.read_patch(patch);

  expect(check_patch).toEqual(delta);
});
