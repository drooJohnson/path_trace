import * as THREE from "three";
import { ColorGenerator } from "./colors";
import { Config } from "./config";
import NoiseGenerator from "./utils/curlNoise";

export class ParticleSystem {
  positions: Float32Array;
  colors: Float32Array;
  speeds: Float32Array;
  noise: NoiseGenerator;
  colorizer: ColorGenerator;
  numParticles: number;
  geometry: THREE.BufferGeometry;
  mesh: THREE.Points;
  scene: THREE.Scene;
  config: Config;

  spawnDiameter: number;
  spawnSampler: (diameter: number) => THREE.Vector3;
  life: number[];
  lifeSpanMax: number;
  lifeSpanMin: number;

  extinctionDistance: number;
  extinctionTestFunction: (i: number) => boolean;
  vMin: number;

  velocity: THREE.Vector3;
  target: THREE.Vector3;

  constructor(numParticles, noiseSeed) {
    this.positions = new Float32Array(numParticles * 3);
    this.colors = new Float32Array(numParticles * 4);
    this.speeds = new Float32Array(numParticles);

    this.colorizer;
    this.numParticles = numParticles;
    this.geometry;
    this.mesh;
    this.scene;
    this.config;
    this.noise = new NoiseGenerator(noiseSeed, 100, 10, -10);
    this.target = new THREE.Vector3(0.0, 0.0, 0.0);
    this.velocity = new THREE.Vector3();
    // this.noiseType = NoiseType.APPROXIMATE_CURL;
  }

  init(config, spawnSampler, colorizer, material, scene) {
    if (this.scene && this.mesh) {
      this.scene.remove(this.mesh);
    }

    this.config = config;
    this.numParticles = config.NUM_PARTICLES;
    this.spawnDiameter = 0.05; //config.getParam("spawnSphereDiameter");
    this.spawnSampler = spawnSampler;
    this.colorizer = colorizer;
    this.scene = scene;

    this.positions = new Float32Array(this.numParticles * 3);
    this.colors = new Float32Array(this.numParticles * 4);
    this.speeds = new Float32Array(this.numParticles);
    this.life = [];
    this.lifeSpanMin = config.lifeSpanMin || 100;
    this.lifeSpanMax = config.lifeSpanMax || 500;
    this.extinctionTestFunction;
    this.vMin = config.vMin || 0.1;

    for (let i = 0; i < this.numParticles; i++) {
      let x = i * 3;
      let y = i * 3 + 1;
      let z = i * 3 + 2;

      let r = i * 4;
      let g = i * 4 + 1;
      let b = i * 4 + 2;
      let a = i * 4 + 3;

      let position =
        i == 0
          ? this.spawnSampler(this.spawnDiameter)
          : new THREE.Vector3(
              this.positions[x - 3],
              this.positions[y - 3],
              this.positions[z - 3]
            );

      let vel = this.noise.curl3d(position.x, position.y, position.z);

      this.positions[x] = position.x + vel.x * 0.001;
      this.positions[y] = position.y + vel.y * 0.001;
      this.positions[z] = position.z + vel.z * 0.001;

      let color = this.colorizer.getColor(
        position.length() / this.spawnDiameter
      );

      this.colors[r] = color.r;
      this.colors[g] = color.g;
      this.colors[b] = color.b;
      this.colors[a] = 0.0;

      // This -1 to 1 is later rescaled to the range of minSpeed to maxSpeed;
      // this.speeds[i] = Math.random();

      // Life is decremented each tick, and when it reaches 0, the particle will be deleted if
      // the extinction method is set to AGE.
      // this.life[i] =
      //   Math.random() * (this.lifeSpanMax - this.lifeSpanMin) +
      //   this.lifeSpanMin;

      // switch(this.extinctionMethod) {
      //   case ExtinctionMethod.MIN_VELOCITY:
      //     this.extinctionTestFunction = this.killParticleByVelocity
      //     break;
      //   case ExtinctionMethod.MIN_VELOCITY_PER_AXIS:
      //     this.extinctionTestFunction = this.killParticleByVelocityPerAxis
      //     break;
      //   case ExtinctionMethod.MIN_SOFT_VELOCITY_PER_AXIS:
      //     this.extinctionTestFunction = this.killParticleBySoftVelocityPerAxis
      //     break;
      //   case ExtinctionMethod.AGE:
      //     this.extinctionTestFunction = this.killParticleByAge
      //     break;
      //   case ExtinctionMethod.DISTANCE_FROM_CENTER:
      //     this.extinctionTestFunction = this.killParticleByDistance
      //     break;
      // }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(this.colors, 4)
    );

    this.mesh = new THREE.Points(this.geometry, material);
    this.scene.add(this.mesh);
  }

  killParticleByAge = (i: number): boolean => {
    if (this.life[i] <= 0) {
      return true;
    }
    return false;
  };

  killParticleByDistance = (i: number): boolean => {
    let p = this.mesh.geometry.attributes.position;

    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);

    let position = new THREE.Vector3(x, y, z);

    if (position.length() > this.extinctionDistance) {
      return true;
    }
    return false;
  };

  killParticleByVelocity = (i: number): boolean => {
    let v = this.mesh.geometry.attributes.velocity;

    let x = v.getX(i);
    let y = v.getY(i);
    let z = v.getZ(i);

    let velocity = new THREE.Vector3(x, y, z);

    if (velocity.length() < this.vMin) {
      return true;
    }
    return false;
  };

  killParticleBySoftVelocityPerAxis = (i: number): boolean => {
    let v = this.mesh.geometry.attributes.velocity;

    let x = v.getX(i);
    let y = v.getY(i);
    let z = v.getZ(i);

    let velocity = new THREE.Vector3(x, y, z);

    if (
      velocity.x < this.vMin &&
      velocity.y < this.vMin &&
      velocity.z < this.vMin
    ) {
      return true;
    }
    return false;
  };

  killParticleByVelocityPerAxis = (i: number): boolean => {
    let v = this.mesh.geometry.attributes.velocity;

    // PREVIOUSLY THIS FUNCTION DIDN'T GET ABSOLUTE VALUES AND
    // WHILE THE RESULTS LOOKED COOL IT WAS COMPLETELY WRONG.
    let x = Math.abs(v.getX(i));
    let y = Math.abs(v.getY(i));
    let z = Math.abs(v.getZ(i));

    let velocity = new THREE.Vector3(x, y, z);

    if (
      velocity.x < this.vMin &&
      velocity.y < this.vMin &&
      velocity.z < this.vMin
    ) {
      return true;
    }
    return false;
  };

  removeFromScene() {
    this.scene.remove(this.mesh);
  }

  update(distPerStep, smoothPerturbation) {
    this.drawLineFromStart(distPerStep, smoothPerturbation);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  drawLineFromStart(distPerStep, smoothPerturbation) {
    let p = this.mesh.geometry.attributes.position; //.array;
    let c = this.mesh.geometry.attributes.color; //.array;

    let alphaDecrement = 1 / (this.numParticles * 0.25);
    let alphaFadeOutStart = this.numParticles * 0.75;
    let alphaFadeInEnd = this.numParticles * 0.25;

    let origin;
    let originalOrigin = new THREE.Vector3(p.getX(0), p.getY(0), p.getZ(0));
    if (smoothPerturbation){
      origin = this.noise
        .curl3d(
          originalOrigin.x * 10,
          originalOrigin.y * 10,
          originalOrigin.z * 10,
          -500,
          -500,
          500
        )
        .divideScalar(5000)
        .add(originalOrigin)
      let dirToOrigin = origin.clone();
      dirToOrigin.multiplyScalar(-0.0025);
      origin.add(dirToOrigin);
      //origin.add(dirToOrigin.negate().multiplyScalar(-0.000001));
    } else {
      origin = originalOrigin.add(this.spawnSampler(this.spawnDiameter).multiplyScalar(0.01));
    }
    // let rDir = new THREE.Vector3(0, 0, 0);
    // rDir.randomDirection().multiplyScalar(0.001);
    // let origin = originalOrigin.add(rDir);

    p.setXYZ(0, origin.x, origin.y, origin.z);

    let colorOrigin =
      new THREE.Vector3(origin.x, origin.y, origin.z).length() /
      this.spawnDiameter;

    let color = this.colorizer.getColor(colorOrigin);

    c.setXYZW(0, color.r, color.g, color.b, 0.0);

    for (let i = 1; i < this.numParticles; i++) {
      let color = this.colorizer.getColor(colorOrigin + i * 0.0001);

      let px = p.getX(i - 1);
      let py = p.getY(i - 1);
      let pz = p.getZ(i - 1);

      let vel = this.noise.curl3d(px, py, pz, 100, 10, 10);

      p.setXYZ(
        i,
        px + vel.x * distPerStep,
        py + vel.y * distPerStep,
        pz + vel.z * distPerStep
      );

      let alpha;
      if (i > alphaFadeOutStart) {
        alpha = 1.0 - (i - alphaFadeOutStart) * alphaDecrement;
      } else if (i < alphaFadeInEnd) {
        alpha = i * alphaDecrement;
      } else {
        alpha = 1.0;
      }

      c.setXYZW(i, color.r, color.g, color.b, alpha); //alpha);
    }
  }

  getMesh() {
    return this.mesh;
  }

  respawnParticle(
    index,
    colorBuffer,
    positionBuffer,
    velocityBuffer,
    spawnDiameter = this.config.getParam("spawnSphereDiameter"),
    spawnSampler = this.spawnSampler
    // colorMode = this.colorMode
  ) {
    let position = spawnSampler(spawnDiameter);
    let color = this.colorizer.getColor(position.length() / spawnDiameter);

    colorBuffer.setXYZW(index, color.r, color.g, color.b, 0.0);
    positionBuffer.setXYZ(index, position.x, position.y, position.z);

    this.speeds[index] = Math.random();
    this.life[index] =
      Math.random() * (this.lifeSpanMax - this.lifeSpanMin) + this.lifeSpanMin;

    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
