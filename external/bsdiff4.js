import { Buffer } from "buffer";
import { do_diff, do_patch } from "./bsdiff4util";
import SnappyJS from "snappyjs";

const MAGIC = "BSDIFF40"; //8bytes

///////////////////////////////////////////////////////////////////
// A helper function that simply converts a number of bytes and
// returns it in more readable format such as KB or MB.
///////////////////////////////////////////////////////////////////
function human_bytes(n) {
  //return the number of bytes 'n' in more human readable form
  if (n < 1024) return "%i B" % n;
  k = (n - 1) / 1024 + 1;
  if (k < 1024) return "%i KB" % k;
  return "%.2f MB" % (float(n) / 2 ** 20);
}

async function split_array(data, array) {
  let temp = [];
  for (let j = 0; j < data.length; j++) {
    temp.push(data[j]);
    console.log("temp: ", temp);
    console.log("j: ", j);

    if (temp.length == 3) {
      array.push(temp);
      console.log("temp: ", temp);
      console.log("con arr: ", array);
      temp.length = 0;
    }
  }
  return array;
}
///////////////////////////////////////////////////////////////////
// A function that writes a BSDIFF4-format patch to ArrayBuffer obj
///////////////////////////////////////////////////////////////////
export async function write_patch({ controlArrays, bdiff, bextra }) {
  try {
    console.log("writing patch");

    /*
      Compress each block, compress() returns either arraybuffer or uint8 when passed in.
      Control arrays is casted to int8array to facilitate having signed bytes object.
    */

    let control_buffer = new ArrayBuffer(controlArrays.flat().length * 2);
    let control_view = new Int16Array(control_buffer);
    control_view.set(controlArrays.flat());
    //const control_view = new Uint8Array(controlArrays.flat());
    console.log("test1: ", control_view);
    controlArrays = SnappyJS.compress(control_view.buffer); //returns array buffer
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);
    //initialise a buffer object with length calculated based on control header data sizes
    // const newPatchSize =
    //   40 +
    //   parseInt(controlArrays.byteLength) +
    //   parseInt(bdiff.byteLength) +
    //   parseInt(bextra.byteLength);
    // console.log("newPatch size: ", newPatchSize);

    //combining control&diff data
    let newPatchControl = Buffer.alloc(32);
    //write magic number for integrity control
    newPatchControl.write(MAGIC, 0, 8);
    //write lengths of control header data, giving each 8 bytes of space
    newPatchControl.write(controlArrays.byteLength.toString(), 8); //not sure about the n of bytes to write
    newPatchControl.write(bdiff.byteLength.toString(), 16);
    newPatchControl.write(bextra.byteLength.toString(), 24);
    //newPatchControl.write(newPatchSize.toString(), 32);
    const Views2Write = Buffer.concat([
      newPatchControl,
      new Uint8Array(controlArrays),
      new Uint8Array(bdiff),
      new Uint8Array(bextra),
    ]);

    return Views2Write;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that reads a BSDIFF4 patch from ArrayBuffer object
///////////////////////////////////////////////////////////////////
export async function read_patch(patch) {
  try {
    console.log("type: ", patch);
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
    // read the control data
    const control_offset = 32 + len_control;
    const control = patch.subarray(32, control_offset);
    console.log(" control compressed ", control);
    let control_uncompressed = SnappyJS.uncompress(control);
    control_uncompressed = new Int16Array(control_uncompressed.buffer);
    control_uncompressed = [...control_uncompressed]; //convert to array object

    console.log(" control uncompressed ", control_uncompressed);
    //const control_arrays = await split_array(control_uncompressed, []);
    //console.log("control arrays: ", control_arrays);

    // read the diff and extra blocks
    const bdiff_offset = control_offset + len_diff;
    const bdiff = patch.subarray(control_offset, bdiff_offset);
    let bdiff_uncompressed = SnappyJS.uncompress(bdiff);
    const bextra = patch.subarray(bdiff_offset);
    const bextra_uncompressed = SnappyJS.uncompress(bextra);

    return [
      [control_uncompressed],
      bdiff_uncompressed.buffer,
      bextra_uncompressed.buffer,
    ];
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that returns a BSDIFF4-format patch
// (from src_bytes to dst_bytes) as ArrayBuffer.
///////////////////////////////////////////////////////////////////
export async function diff({ oldD, oldLength, newD, newLength }) {
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
  }
}

export async function diff_only({ oldD, oldLength, newD, newLength }) {
  try {
    //maybe can make the process even faster by passing in an object instead of parameters
    const delta = await do_diff(oldD, oldLength, newD, newLength);
    return delta;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that applies the BSDIFF4-format
// (patch_bytes to src_bytes) and returns the bytes as ArrayBuffer.
///////////////////////////////////////////////////////////////////
export async function patch(oldD, patchD) {
  return do_patch(oldD, read_patch(patchD));
}
