import { Buffer } from "buffer";
import { do_diff, do_patch } from "./bsdiff4util";
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
    console.log("control buffer 1: ", control_view.buffer);
    controlArrays = SnappyJS.compress(control_view.buffer);
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);
    //initialise a buffer object with length calculated based on control header data sizes
    // const newPatchSize =
    //   40 +
    //   parseInt(controlArrays.byteLength) +
    //   parseInt(bdiff.byteLength) +
    //   parseInt(bextra.byteLength);
    // console.log("newPatch size: ", newPatchSize);
    let newPatchControl = Buffer.alloc(32);
    //write magic number for integrity control
    newPatchControl.write(MAGIC, 0, 8);
    //write lengths of control header data, giving each 8 bytes of space
    newPatchControl.write(controlArrays.byteLength.toString(), 8); //not sure about the n of bytes to write
    newPatchControl.write(bdiff.byteLength.toString(), 16);
    newPatchControl.write(bextra.byteLength.toString(), 24);
    //newPatchControl.write(newPatchSize.toString(), 32);

    //combining control&diff data
    const Views2Write = Buffer.concat([
      new Uint8Array(controlArrays),
      new Uint8Array(bdiff),
      new Uint8Array(bextra),
    ]);
    const pack = [newPatchControl, Views2Write];

    return Buffer.concat(pack);
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that reads a BSDIFF4 patch from ArrayBuffer object
///////////////////////////////////////////////////////////////////
export async function read_patch(patch) {
  try {
    //magic check
    const magic = patch.toString("utf8", 0, 8); //read and decode magic
    if (magic != MAGIC) throw new Error("Bad patch magic");
    /* 
      Length headers, reading and decoding utf8 format data from buffer.
      Casting read string data to Numbers using parseInt.
    */
    const len_control = parseInt(patch.toString("utf8", 8, 16));
    const len_diff = parseInt(patch.toString("utf8", 16, 24));
    const len_extra = parseInt(patch.toString("utf8", 24, 32));
    //const len_dst = parseInt(patch.toString("utf8", 32, 40));

    // read the control header
    const control_offset = 32 + len_control;
    const control = patch.subarray(32, control_offset);

    let control_uncompressed = SnappyJS.uncompress(control);
    control_uncompressed = new Int8Array(control_uncompressed);

    console.log("control: ", control);
    console.log("bcontrol: ", control_uncompressed);

    // Python slice notation -> Javascript slice method
    // a[start:stop:step]    -> a[slice(start, stop, step)]  !!!!!
    // let tcontrol;
    // console.log("bcontrol length: ", control_uncompressed.length);
    // for (i in range(0, control_uncompressed.length, 24)) {
    //   tcontrol = [
    //     control_uncompressed.toString("utf8", i, i + 8),
    //     control_uncompressed.toString("utf8", i + 8, i + 16),
    //     control_uncompressed.toString("utf8", i + 16, i + 24),
    //   ];
    // }
    // console.log("tcontrol: ", tcontrol);
    // read the diff and extra blocks

    const bdiff_offset = control_offset + len_diff;
    const bdiff = patch.subarray(control_offset, bdiff_offset);
    const bextra = patch.subarray(bdiff_offset);
    let bdiff_uncompressed = SnappyJS.uncompress(bdiff);
    bdiff_uncompressed = new Int8Array(bdiff_uncompressed);
    const bextra_uncompressed = SnappyJS.uncompress(bextra);

    return [control_uncompressed, bdiff_uncompressed, bextra_uncompressed];
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
