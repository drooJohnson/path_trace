import * as THREE from "three";

  var grad3:Array<Array<number>> = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];

  var grad4:Array<Array<number>> = [
    [0, 1, 1, 1],
    [0, 1, 1, -1],
    [0, 1, -1, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [0, -1, 1, -1],
    [0, -1, -1, 1],
    [0, -1, -1, -1],
    [1, 0, 1, 1],
    [1, 0, 1, -1],
    [1, 0, -1, 1],
    [1, 0, -1, -1],
    [-1, 0, 1, 1],
    [-1, 0, 1, -1],
    [-1, 0, -1, 1],
    [-1, 0, -1, -1],
    [1, 1, 0, 1],
    [1, 1, 0, -1],
    [1, -1, 0, 1],
    [1, -1, 0, -1],
    [-1, 1, 0, 1],
    [-1, 1, 0, -1],
    [-1, -1, 0, 1],
    [-1, -1, 0, -1],
    [1, 1, 1, 0],
    [1, 1, -1, 0],
    [1, -1, 1, 0],
    [1, -1, -1, 0],
    [-1, 1, 1, 0],
    [-1, 1, -1, 0],
    [-1, -1, 1, 0],
    [-1, -1, -1, 0],
  ];

  // A lookup table to traverse the simplex around a given point in 4D.
  // Details can be found where this table is used, in the 4D noise method.
  var simplex:Array<Array<number>> = [
    [0, 1, 2, 3],
    [0, 1, 3, 2],
    [0, 0, 0, 0],
    [0, 2, 3, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 3, 0],
    [0, 2, 1, 3],
    [0, 0, 0, 0],
    [0, 3, 1, 2],
    [0, 3, 2, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 3, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 0, 3],
    [0, 0, 0, 0],
    [1, 3, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 3, 0, 1],
    [2, 3, 1, 0],
    [1, 0, 2, 3],
    [1, 0, 3, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 3, 1],
    [0, 0, 0, 0],
    [2, 1, 3, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 1, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 0, 1, 2],
    [3, 0, 2, 1],
    [0, 0, 0, 0],
    [3, 1, 2, 0],
    [2, 1, 0, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 1, 0, 2],
    [0, 0, 0, 0],
    [3, 2, 0, 1],
    [3, 2, 1, 0],
  ];

  function fastFloor(x) {
    return x > 0 ? ~~x : ~~x - 1;
  }

  function dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  function dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  function dot4(g, x, y, z, w) {
    return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
  }

  interface Simplex3Sample {
    value: number;
    derivative: THREE.Vector3;
  }

  class NoiseGenerator {
    private p: Uint8Array;
    private perm: Uint8Array;
    private permMod12: Uint8Array;
    offsetX: number;
    offsetY: number;
    offsetZ: number;

    constructor(seed:number, offsetX:number, offsetY:number, offsetZ:number) {
      const random = alea(seed);
      this.p = buildPermutationTable(random);
      this.perm = new Uint8Array(512);
      this.permMod12 = new Uint8Array(512);

      for ( let i = 0; i < 512; i++ ) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
      }

      this.offsetX = offsetX || 0;
      this.offsetY = offsetY || 0;
      this.offsetZ = offsetZ || 0;
    }

    simplex3Sample = (xin:number, yin:number, zin:number):Simplex3Sample => {
      const permMod12 = this.permMod12;
      const perm = this.perm;
      
      var n0, n1, n2, n3;

      var F3 = 1.0 / 3.0;
      var s = (xin + yin + zin) * F3;
      // const i = fastFloor(xin + s);
      // const j = fastFloor(yin + s);
      // const k = fastFloor(zin + s);
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const k = Math.floor(zin + s);

      const G3 = 1.0 / 6.0;
      const t = (i + j + k) * G3;
      const X0 = i - t;
      const Y0 = j - t;
      const Z0 = k - t;
      const x0 = xin - X0;
      const y0 = yin - Y0;
      const z0 = zin - Z0;

      let i1, j1, k1;
      let i2, j2, k2;

      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        }
      } else {
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        }
      }

      const x1 = x0 - i1 + G3;
      const y1 = y0 - j1 + G3;
      const z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2.0 * G3;
      const y2 = y0 - j2 + 2.0 * G3;
      const z2 = z0 - k2 + 2.0 * G3;
      const x3 = x0 - 1.0 + 3.0 * G3;
      const y3 = y0 - 1.0 + 3.0 * G3;
      const z3 = z0 - 1.0 + 3.0 * G3;

      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;

      var gx0, gy0, gz0, gx1, gy1, gz1; /* Gradients at simplex corners */
      var gx2, gy2, gz2, gx3, gy3, gz3;
      var t20, t40, t21, t41, t22, t42, t23, t43;

      var gi0 = permMod12[ii + perm[jj + perm[kk]]];
      var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
      var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
      var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

      var t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) {
        n0 = 0.0;
        gx0 = 0.0;
        gy0 = 0.0;
        gz0 = 0.0;
        t20 = 0.0;
        t40 = 0.0;
      } else {
        t20 = t0 * t0;
        t40 = t20 * t20;
        gx0 = grad3[gi0][0];
        gy0 = grad3[gi0][1];
        gz0 = grad3[gi0][2];
        n0 = t40 * dot3(grad3[gi0], x0, y0, z0);
      }

      var t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) {
        n1 = 0.0;
        gx1 = 0.0;
        gy1 = 0.0;
        gz1 = 0.0;
        t21 = 0.0;
        t41 = 0.0;
      } else {
        t21 = t1 * t1;
        t41 = t21 * t21;
        gx1 = grad3[gi1][0];
        gy1 = grad3[gi1][1];
        gz1 = grad3[gi1][2];
        n1 = t41 * dot3(grad3[gi1], x1, y1, z1);
      }

      var t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) {
        n2 = 0.0;
        gx2 = 0.0;
        gy2 = 0.0;
        gz2 = 0.0;
        t22 = 0.0;
        t42 = 0.0;
      } else {
        t22 = t2 * t2;
        t42 = t22 * t22;
        gx2 = grad3[gi2][0];
        gy2 = grad3[gi2][1];
        gz2 = grad3[gi2][2];
        n2 = t42 * dot3(grad3[gi2], x2, y2, z2);
      }

      var t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) {
        n3 = 0.0;
        gx3 = 0.0;
        gy3 = 0.0;
        gz3 = 0.0;
        t23 = 0.0;
        t43 = 0.0;
      } else {
        t23 = t3 * t3;
        t43 = t23 * t23;
        gx3 = grad3[gi3][0];
        gy3 = grad3[gi3][1];
        gz3 = grad3[gi3][2];
        n3 = t43 * dot3(grad3[gi3], x3, y3, z3);
      }

      // GET DERIVATIVE

      let dx, dy, dz;

      let temp0, temp1, temp2, temp3;

      temp0 = t20 * t0 * (gx0 * x0 + gy0 * y0 + gz0 * z0);
      dx = temp0 * x0;
      dy = temp0 * y0;
      dz = temp0 * z0;
      temp1 = t21 * t1 * (gx1 * x1 + gy1 * y1 + gz1 * z1);
      dx += temp1 * x1;
      dy += temp1 * y1;
      dz += temp1 * z1;
      temp2 = t22 * t2 * (gx2 * x2 + gy2 * y2 + gz2 * z2);
      dx += temp2 * x2;
      dy += temp2 * y2;
      dz += temp2 * z2;
      temp3 = t23 * t3 * (gx3 * x3 + gy3 * y3 + gz3 * z3);
      dx += temp3 * x3;
      dy += temp3 * y3;
      dz += temp3 * z3;
      dx *= -8.0;
      dy *= -8.0;
      dz *= -8.0;
      dx += t40 * gx0 + t41 * gx1 + t42 * gx2 + t43 * gx3;
      dy += t40 * gy0 + t41 * gy1 + t42 * gy2 + t43 * gy3;
      dz += t40 * gz0 + t41 * gz1 + t42 * gz2 + t43 * gz3;
      dx *= 32.0; /* Scale derivative to match the noise scaling */
      dy *= 32.0;
      dz *= 32.0;

      return {
        value: 32.0 * (n0 + n1 + n2 + n3),
        derivative: new THREE.Vector3(dx, dy, dz),
      };

    }
    
    curl3d = (x:number, y:number, z:number, offsetX?:number, offsetY?:number, offsetZ?:number):THREE.Vector3 => {

      const xOff = offsetX || this.offsetX;
      const yOff = offsetY || this.offsetY;
      const zOff = offsetZ || this.offsetZ;

      let sampleX = this.simplex3Sample(x + xOff, y, z);
      let sampleY = this.simplex3Sample(x, y + yOff, z);
      let sampleZ = this.simplex3Sample(x, y, z + zOff);

      var curl = new THREE.Vector3();

      curl.x = sampleZ.derivative.y - sampleY.derivative.z;
      curl.y = sampleX.derivative.z - sampleZ.derivative.x;
      curl.z = sampleY.derivative.x - sampleX.derivative.y;

      return curl;
    }
  }

export function buildPermutationTable(random) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }
  for (let i = 0; i < 255; i++) {
    const r = i + ~~(random() * (256 - i));
    const aux = p[i];
    p[i] = p[r];
    p[r] = aux;
  }
  return p;
}

function alea(seed:number) {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = masher();
  s0 = mash(" ");
  s1 = mash(" ");
  s2 = mash(" ");

  s0 -= mash(seed);
  if (s0 < 0) {
    s0 += 1;
  }
  s1 -= mash(seed);
  if (s1 < 0) {
    s1 += 1;
  }
  s2 -= mash(seed);
  if (s2 < 0) {
    s2 += 1;
  }

  return function () {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
    s0 = s1;
    s1 = s2;
    return (s2 = t - (c = t | 0));
  };
}

interface MasherReturn {
  (value:string|number):number;
}

function masher():MasherReturn {
  let n = 0xefc8249d;
  return function (data) {
    data = data.toString();
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };
}

export default NoiseGenerator;