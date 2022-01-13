import * as THREE from "three";

export const palettes = {
  default: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 1.0, y: 1.0, z: 1.0 },
    d: { x: 0.0, y: 0.0, z: 0.0 },
    offset: 0.5,
    scale: 1,
  },
  rainbow: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 1.0, y: 1.0, z: 1.0 },
    d: { x: 0.0, y: 0.333, z: 0.666 },
    offset: 0,
    scale: 1,
  },
  cyanMauve: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 1.0, y: 1.0, z: 1.0 },
    d: { x: 0.3, y: 0.2, z: 0.2 },
    offset: 0,
    scale: 1,
  },
  sludge: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 1.0, y: 1.0, z: 0.5 },
    d: { x: 0.8, y: 0.9, z: 0.3 },
    offset: 0,
    scale: 1,
  },
  desert: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 1.0, y: 0.7, z: 0.4 },
    d: { x: 0.0, y: 0.15, z: 0.2 },
    offset: 0,
    scale: 1,
  },
  nineties: {
    a: { x: 0.5, y: 0.5, z: 0.5 },
    b: { x: 0.5, y: 0.5, z: 0.5 },
    c: { x: 2.0, y: 1.0, z: 0.0 },
    d: { x: 0.5, y: 0.2, z: 0.25 },
    offset: 0,
    scale: 1,
  },
  greenOrange: {
    a: { x: 0.8, y: 0.5, z: 0.4 },
    b: { x: 0.2, y: 0.4, z: 0.2 },
    c: { x: 2.0, y: 1.0, z: 0.0 },
    d: { x: 0.0, y: 0.25, z: 0.25 },
    offset: 0,
    scale: 1,
  },
};

const defaultVector = { x: 0.5, y: 0.5, z: 0.5 };

type Vector = { x: number; y: number; z: number };

export class ColorGenerator {
  offset: number;
  scale: number;
  paletteName?: string;
  a: Vector;
  b: Vector;
  c: Vector;
  d: Vector;

  constructor(
    offset: number,
    scale: number,
    a: Vector = defaultVector,
    b: Vector = defaultVector,
    c: Vector = defaultVector,
    d: Vector = defaultVector
  ) {
    this.offset = offset;
    this.scale = scale;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  switchPreset = (paletteName) => {
    this.paletteName = paletteName;
    this.a = palettes[paletteName].a;
    this.b = palettes[paletteName].b;
    this.c = palettes[paletteName].c;
    this.d = palettes[paletteName].d;
  };

  updateVectors = (a, b, c, d) => {
    this.paletteName = null;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  };

  setOffset = (offset) => {
    this.offset = offset;
  };

  setScale = (scale) => {
    this.scale = scale;
  };

  getColor = (t: number, offset = this.offset, scale = this.scale) => {
    t /= 2;
    t *= scale;
    t += offset;

    const clr = [];

    for (let i = 0; i < 3; i++) {
      const key = ["x", "y", "z"][i];
      clr.push(
        this.a[key] +
          this.b[key] * Math.cos(6.28318 * (this.c[key] * t + this.d[key]))
      );
    }

    return new THREE.Color(clr[0], clr[1], clr[2]);
  };
}
