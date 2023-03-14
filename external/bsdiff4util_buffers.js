///////////////////////////////////////////////////////////////////
// An adaptation of ternary-split Quicksort of Bentley and McIlroy.
// A recursive function used in the sorting function. Splits
// src and dst data accroding to given index and length.
///////////////////////////////////////////////////////////////////
function split(I, V, st, len, h) {
  try {
    let i, j, k, x, tmp, jj, kk;
    if (len < 16) {
      for (k = st; k < st + len; k += j) {
        j = 1;
        x = V.at(I[k] + h);
        for (i = 1; k + i < st + len; i++) {
          if (V.at(I[k + i] + h) < x) {
            x = V.at(I[k + i] + h);

            j = 0;
          }
          if (V.at(I[k + i] + h) == x) {
            tmp = I.at(k + j);
            I[k + j] = I.at(k + i);
            I[k + i] = tmp;
            j++;
          }
        }
        for (i = 0; i < j; i++) {
          V[I[k + i]] = k + j - 1;
        }
        if (j == 1) I[k] = -1;
      }
    } else {
      const y = Math.floor(st + len / 2);
      x = V.at(I.at(y) + h);
      if (isNaN(x)) throw new Error(" x was a NaN");
      jj = 0;
      kk = 0;

      for (i = st; i < st + len; i++) {
        if (V.at(I[i] + h) < x) jj++;
        if (V.at(I[i] + h) == x) kk++;
      }
      jj += st;
      kk += jj;
      i = st;
      j = 0;
      k = 0;
      while (i < jj) {
        if (V.at(I[i] + h) < x) i++;
        else if (V.at(I[i] + h) == x) {
          tmp = I.at(i);
          I[i] = I.at(jj + j);
          I[jj + j] = tmp;
          j++;
        } else {
          tmp = I.at(i);
          I[i] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }

      while (jj + j < kk) {
        if (V.at(I[jj + j] + h) == x) j++;
        else {
          tmp = I.at(jj + j);
          I[jj + j] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }

      if (jj > st) split(I, V, st, jj - st, h);
      for (i = 0; i < kk - jj; i++) V[I[jj + i]] = kk - 1;
      if (jj == kk - 1) I[jj] = -1;
      if (st + len > kk) split(I, V, kk, st + len - kk, h);
      return 0;
    }
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A quick suffix sorting algorithm proposed in N.J. Larssona,
// K. Sadakaneb, "Faster suffix sorting" 2007
///////////////////////////////////////////////////////////////////
async function qsufsort(I, V, oldData, oldLength) {
  try {
    console.log("sorting");
    let buckets = [];
    /* i = position in group, h = depth of search, len = negated length of sorted groups of suffixes*/
    let i, h, len, pi, s;
    //Bucket sorting calc
    for (i = 0; i < 256; i++) buckets[i] = 0;
    for (i = 0; i < oldLength; i++) buckets[oldData[i]]++;
    for (i = 1; i < 256; i++) buckets[i] += buckets[i - 1];
    for (i = 255; i > 0; i--) buckets[i] = buckets[i - 1];
    buckets[0] = 0;
    //Placing suffixes from oldData in I array
    for (i = 0; i < oldLength; i++) I[++buckets[oldData[i]]] = i;
    I[0] = oldLength;
    /* Input transformation into array V */
    for (i = 0; i < oldLength; i++) V[i] = buckets[oldData[i]];
    V[oldLength] = 0; //0 representing the sentinel symbol

    for (i = 1; i < 256; i++) {
      if (buckets[i] == buckets[i - 1] + 1) I[buckets[i]] = -1;
    }
    I[0] = -1;

    for (h = 1; I[0] != -(oldLength + 1); h += h) {
      pi = I;
      len = 0;
      for (i = 0; i < oldLength + 1; ) {
        /*
        If negated length of sorted group detected,
        increase negated length var and increase 
        iterator to skip over sorted group
        */
        s = pi.at(i);
        if (s < 0) {
          i -= s; //pi.at(i) = s
          len += s;
        } //Treat element as unsorted
        else {
          //Combining sorted groups before i
          if (len) pi[i + len] = len;
          len = V[s] + 1 - i;
          split(I, V, i, len, h);
          i += len; //next group of suffixes
          len = 0;
        }
      }
      //Combining sorted gorups at the end of I
      if (len) pi[i + len] = len;
    }
    /* Reconstructing the (I) suffix array from its inverse (V)*/
    for (i = 0; i < oldLength + 1; i++) {
      I[V[i]] = i;
    }
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function for checking the biggest common length of two arrays.
//
///////////////////////////////////////////////////////////////////
function matchlen(old, oldsize, neww, newsize) {
  let i;
  for (i = 0; i < oldsize && i < newsize; i++) {
    if (old[i] !== neww[i]) {
      console.log("old mismatch: ", old[i]);
      console.log("new mismatch: ", neww[i]);
      break;
    }
  }
  return i;
}

///////////////////////////////////////////////////////////////////
//
// A function that performs a search...
//
// not sure if it should be returning itself
//
///////////////////////////////////////////////////////////////////
function search(I, oldData, oldSize, newData, newSize, st, en, pos) {
  try {
    let x;
    if (en - st < 2) {
      const oldDataScanX = oldData.subarray(I[st]);
      const oldDataScanY = oldData.subarray(I[en]);
      //console.log("I[st]: ", I[st]);
      //console.log("I[en]: ", I[en]);
      //console.log("oldDataScanX: ", oldDataScanX.length);
      //console.log("oldDataScanY: ", oldDataScanY.length);

      x = matchlen(oldDataScanX, oldDataScanX.length, newData, newSize);
      const y = matchlen(oldDataScanY, oldDataScanY.length, newData, newSize);

      console.log("x: ", x);
      console.log("y: ", y);
      if (x > y) {
        pos[0] = I[st];
        console.log("st: ", st);
        console.log("I[st]: ", I[st]);
        return x;
      } else {
        pos[0] = I[en];
        console.log("en: ", en);
        console.log("I[en]: ", I[en]);
        return y;
      }
    }
    // ^^ this returns 0 all the time, detects no common elements
    const b = Math.floor((en - st) / 2); // round down to avoid fraction numbers(alas int)
    x = st + b;
    const ix = Math.min(oldSize - I[x], newSize);

    if (oldData.compare(newData, 0, ix, I[x], ix) > 0) {
      console.log("x for end");

      return search(I, oldData, oldSize, newData, newSize, st, x, pos);
    } else {
      console.log("x for start");
      return search(I, oldData, oldSize, newData, newSize, x, en, pos);
    }
  } catch (Error) {
    console.error(Error);
    return;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that performs a diff between the two data streams and
// returns an array containing the control, diff and extra blocks
// that bsdiff produces.
//
///////////////////////////////////////////////////////////////////
export async function do_diff(oldData, oldDataLength, newData, newDataLength) {
  try {
    console.log("diffing");
    let lastscan, lastpos, lastoffset, oldscore, scsc, overlap, Ss;
    let lens, dblen, eblen, scan, len, s, Sf, lenf, Sb, lenb, i;
    let pos = [0];

    /* create the control array */
    let controlArrays = [];
    let cArray = [0, 0, 0];

    /*Array of containing outputs of qsufsorting (permutations of analysed suffixes from oldData).
      It is supposed to hold all numbers in range <0, oldDataLength>. 
      At the oldDataLength + 1 postion held is a "unique sentinel symbol".
      The final state of I will be referred to sorted suffix array.
      Has to be non- */
    let I = new Int16Array(oldDataLength + 1);

    /*Array being an inverse permutation of the sorted suffix array I. */
    let V = new Int16Array(oldDataLength + 1);

    /* perform suffix sort on original data */
    await qsufsort(I, V, oldData, oldDataLength);
    console.log("old data sorted");
    console.log("I:", I);
    console.log("V:", V);

    //let db = Buffer.alloc(newDataLength + 1), //diff blocks
    //  eb = Buffer.alloc(newDataLength + 1); //extra blocks

    let db = []; //diff blocks
    let eb = []; //extra blocks
    dblen = 0;
    eblen = 0;

    /* perform the diff */
    len = 0;
    scan = 0;
    lastscan = 0;
    lastpos = 0;
    lastoffset = 0;
    while (scan < newDataLength) {
      oldscore = 0;
      //do suffix scan between old and new file
      for (scsc = scan += len; scan < newDataLength; scan++) {
        console.log("scan: ", scan);
        console.log("Searching");
        len = search(
          I,
          oldData,
          oldDataLength,
          newData.subarray(scan),
          newDataLength - scan,
          0,
          oldDataLength,
          pos
        );
        console.log("len from search: %d, pos: %d ", len, pos[0]);
        if (isNaN(len) || isNaN(pos[0]))
          throw new Error("search function error");
        for (; scsc < scan + len; scsc++) {
          if (
            scsc + lastoffset < oldDataLength &&
            oldData[scsc + lastoffset] == newData[scsc]
          )
            oldscore++;
        }
        console.log("oldscore: ", oldscore);
        if ((len == oldscore && len != 0) || len > oldscore + 8) break;
        if (
          scan + lastoffset < oldDataLength &&
          oldData[scan + lastoffset] == newData[scan]
        )
          oldscore--;
      }

      //if suffix scan completed
      if (len != oldscore || scan == newDataLength) {
        console.log("hellllo");
        s = 0;
        Sf = 0;
        lenf = 0;
        for (i = 0; lastscan + i < scan && lastpos + i < oldDataLength; ) {
          if (oldData[lastpos + i] == newData[lastscan + i]) {
            s++;
          }
          i++;
          console.log("s: ", s);
          console.log("i: ", i);
          if (s * 2 - i > Sf * 2 - lenf) {
            Sf = s;
            lenf = i;
          }
        }

        lenb = 0;
        if (scan < newDataLength) {
          console.log("hello");
          s = 0;
          Sb = 0;
          for (i = 1; scan >= lastscan + i && pos[0] >= i; i++) {
            if (oldData[pos[0] - i] == newData[scan - i]) s++;
            if (s * 2 - i > Sb * 2 - lenb) {
              Sb = s;
              lenb = i;
            }
          }
        }

        //if there's an overlap
        if (lastscan + lenf > scan - lenb) {
          console.log("overlap");
          overlap = lastscan + lenf - (scan - lenb);
          s = 0;
          Ss = 0;
          lens = 0;
          for (i = 0; i < overlap; i++) {
            if (
              newData[lastscan + lenf - overlap + i] ==
              oldData[lastpos + lenf - overlap + i]
            )
              s++;
            if (newData[scan - lenb + i] == oldData[pos[0] - lenb + i]) s--;
            if (s > Ss) {
              Ss = s;
              lens = i + 1;
            }
          }

          lenf += lens - overlap;
          lenb -= lens;
        }

        //populate diff bytes and extra bytes arrays
        console.log("lenf: ", lenf);
        console.log("dblen: ", dblen);
        for (i = 0; i < lenf; i++) {
          db[dblen + i] = newData[lastscan + i] - oldData[lastpos + i];
        }
        for (i = 0; i < scan - lenb - (lastscan + lenf); i++) {
          eb[eblen + i] = newData[lastscan + lenf + i];
        }
        dblen += lenf;
        eblen += scan - lenb - (lastscan + lenf);

        console.log("db: ", db);
        console.log("dblen: ", dblen);
        console.log(
          "scan - lenb - (lastscan + lenf)",
          scan - lenb - (lastscan + lenf)
        );
        console.log(
          "pos - lenb - (lastpos + lenf)",
          pos[0] - lenb - (lastpos + lenf)
        );

        cArray[0] = lenf;
        cArray[1] = scan - lenb - (lastscan + lenf);
        cArray[2] = pos[0] - lenb - (lastpos + lenf);
        controlArrays.push(cArray);

        lastscan = scan - lenb;
        lastpos = pos[0] - lenb;
        lastoffset = pos[0] - scan;
      }
    }

    //prepare results to return
    let results = [0, 0, 0];
    results[0] = controlArrays;
    const dbBuff = new Uint8Array(db); //facilitating char* cast from og code
    results[1] = dbBuff.buffer; // saving the underlying arraybuffer
    const ebBuff = new Uint8Array(eb);
    results[2] = ebBuff.buffer;

    return results;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that takes the original data and the control,
// diff and extra blocks produced by bsdiff and returns the new data.
//
///////////////////////////////////////////////////////////////////
export function do_patch({
  oldData,
  oldDataLength,
  newDataLength,
  controlArrays,
  diffBlock,
  diffBlockLength,
  extraBlock,
  extraBlockLength,
} = {}) {
  try {
    console.log("patching");
    //copy data from parameters to local structures
    let oldBuffer = new ArrayBuffer(oldDataLength);
    let newBuffer = new ArrayBuffer(newDataLength);
    let oldView = new Uint8Array(oldBuffer);
    let newView = new Uint8Array(newBuffer);
    oldView = copy(oldData);

    let delta = diffBlock,
      extra = extraBlock,
      oldpos = 0,
      newpos = 0,
      x,
      y,
      z,
      i,
      j,
      numArrays = controlArrays.length,
      array = [];
    let AsNumber = new TextDecoder();
    for (i = 0; i < numArrays; i++) {
      array.push(controlArrays[i]);

      if (array.length != 3) {
        throw new Error("Expecting control array size of 3");
      }
      x = array[0];
      //probably need to decode [1]&[2]
      y = AsNumber.decode(array[1]);
      z = AsNumber.decode(array[2]);
      if (
        newpos + x > newDataLength ||
        delta + x > diffBlock + diffBlockLength
      ) {
        throw new Error("corrupt patch (overflow)");
      }
      //consider using copy instead of memcpy
      memcpy(newView + newpos, delta, x);
      delta += x;
      for (j = 0; j < x; j++)
        if (oldpos + j >= 0 && oldpos + j < oldDataLength)
          newView[newpos + j] += oldData[oldpos + j];
      newpos += x;
      oldpos += x;
      if (
        newpos + y > newDataLength ||
        extra + y > extraBlock + extraBlockLength
      ) {
        throw new Error("corrupt patch (overflow)");
      }
      memcpy(newView + newpos, extra, y);
      extra += y;
      newpos += y;
      oldpos += z;
    }

    /* confirm that a valid patch was applied */
    if (
      newpos != newDataLength ||
      delta != diffBlock + diffBlockLength ||
      extra != extraBlock + extraBlockLength
    ) {
      throw new Error("corrupt patch (underflow)");
    }

    // let AsBytes = new TextEncoder(); //Encode in utf-8 format
    // results = AsBytes.encode(newData);
    return newBuffer;
  } catch (Error) {
    console.error(Error);
  }
}
