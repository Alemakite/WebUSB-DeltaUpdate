import { do_diff, do_patch } from "./bsdiff4util_buffers";
const MAGIC = "BSDIFF40"; //8bytes
var SnappyJS = require("snappyjs");

///////////////////////////////////////////////////////////////////
// A helper function that simply converts a number of bytes and
// returns it in more readable format such as KB or MB.
//
///////////////////////////////////////////////////////////////////
function human_bytes(n) {
  //return the number of bytes 'n' in more human readable form
  if (n < 1024) return "%i B" % n;
  k = (n - 1) / 1024 + 1;
  if (k < 1024) return "%i KB" % k;
  return "%.2f MB" % (float(n) / 2 ** 20);
}

///////////////////////////////////////////////////////////////////
//
// A function that writes a BSDIFF4-format patch to ArrayBuffer obj
//
///////////////////////////////////////////////////////////////////
async function write_patch({ controlArrays, bdiff, bextra } = {}) {
  try {
    console.log("writing patch");
    /*
      Compress each block, compress() returns either arraybuffer or uint8 when passed in.
      Control arrays is casted to int8array to facilitate having signed bytes object.
    */
    const control_view = new Int8Array(controlArrays.flat());
    controlArrays = SnappyJS.compress(control_view.buffer);
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);

    //initialise a buffer object with length calculated based on control header data sizes
    const newPatchSize = Number(
      40 + controlArrays.byteLength + bdiff.byteLength + bextra.byteLength
    );
    console.log("newPatch size: ", newPatchSize);
    let newPatch = Buffer.alloc(newPatchSize);

    //write magic for integrity control
    newPatch.write(MAGIC, 0, 8); //write patch magic, end offset is 8
    //write lengths of control header data
    newPatch.write(toString(controlArrays.byteLength), 8); //not sure about the n of bytes to write
    newPatch.write(toString(bdiff.byteLength), 16);
    newPatch.write(toString(bextra.byteLength), 24);
    newPatch.write(toString(newPatchSize), 32);
    //write diff data
    newPatch.write(controlArrays + bdiff + bextra, 40);

    return newPatch;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that reads a BSDIFF4 patch from ArrayBuffer object
///////////////////////////////////////////////////////////////////
async function read_patch(patch) {
  try {
    //magic check
    const magic = patch.toString("utf8", 0, 8); //read and decode magic
    if (magic != MAGIC) {
      throw new Error("Bad patch magic");
    }
    let tcontrol;

    // length headers
    const len_control = patch.toString("utf8", 8, 16);
    const len_diff = patch.toString("utf8", 16, 24);
    const len_extra = patch.toString("utf8", 24, 32);
    const len_dst = patch.toString("utf8", 32, 40);

    // read the control header
    const bcontrol = SnappyJS.uncompress(patch.subarray(40, len_control));

    // Python slice notation -> Javascript slice method
    // a[start:stop:step]    -> a[slice(start, stop, step)]  !!!!!
    for (i in range(0, bcontrol.length, 24)) {
      tcontrol = [
        bcontrol.toString("utf8", i, i + 8),
        bcontrol.toString("utf8", i + 8, i + 16),
        bcontrol.toString("utf8", i + 16, i + 24),
      ];
    }

    // read the diff and extra blocks
    const bdiff = SnappyJS.uncompress(patch.subarray(len_control, len_diff));
    const bextra = SnappyJS.uncompress(patch.subarray(len_diff, len_extra));

    return len_dst, tcontrol, bdiff, bextra;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that returns a BSDIFF4-format patch
// (from src_bytes to dst_bytes) as ArrayBuffer.
//
///////////////////////////////////////////////////////////////////
export async function diff({ oldD, oldLength, newD, newLength } = {}) {
  try {
    //maybe can make the process even faster by passing in an object instead of parameters
    const delta = await do_diff(oldD, oldLength, newD, newLength);
    console.log("diff result: ", delta);
    //Remember to convert delta to arraybuffers for snappyJS to work
    const patch = await write_patch({
      controlArrays: delta[0],
      bdiff: delta[1],
      bextra: delta[2],
    });
    return patch;
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that applies the BSDIFF4-format
// (patch_bytes to src_bytes) and returns the bytes as ArrayBuffer.
//
///////////////////////////////////////////////////////////////////
export async function patch(oldD, patchD) {
  return do_patch(oldD, read_patch(patchD));
}
