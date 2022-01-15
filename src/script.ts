import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ParticleSystem } from "./particles";
import { Config } from "./config";
import { presets } from "./presets";
import { Pane } from "tweakpane";
import { ColorGenerator, palettes } from "./colors";
import {
  getPointInSphereUniform,
  getPointInSphereWeighted,
} from "./utils/sphereSampler";

var CONFIG = {
  NUM_PARTICLES: 5000,
  OPACITY: 0.025,
  SIZE: 0.5,
  LOCK_RESOLUTION: false,
  LOCKED_RESOLUTION: {
    x: 2048,
    y: 2048,
  },
  CAMERA_DISTANCE: 2.0,
  COLOR_A: { x: 0.5, y: 0.5, z: 0.5 },
  COLOR_B: { x: 0.5, y: 0.5, z: 0.5 },
  COLOR_C: { x: 1.0, y: 1.0, z: 1.0 },
  COLOR_D: { x: 0.0, y: 0.1, z: 0.2 },
  SHOW_DEBUG: true,
  NUM_STREAMS: 1,
  USE_SMOOTH_PERTURB: true,
};

const presetOptions = Object.keys(presets);

var phi = 0;
var easingPhi = 0;
var theta = 0;
var easingTheta = 0;

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Targets

let accumulationTarget;
let debugTarget;

function isWebGL2Available() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch (e) {
    return false;
  }
}

function initTargets(width?: number, height?: number) {
  let _height;
  let _width;

  if (CONFIG.LOCK_RESOLUTION) {
    if (CONFIG.LOCKED_RESOLUTION.x && CONFIG.LOCKED_RESOLUTION.y) {
      _width = CONFIG.LOCKED_RESOLUTION.x;
      _height = CONFIG.LOCKED_RESOLUTION.y;
    } else {
      console.log("Please specify custom resolution X and Y");
    }
  } else if (width && height) {
    _width = width;
    _height = height;
  } else {
    _width = window.innerWidth;
    _height = window.innerHeight;
  }

  if (accumulationTarget) {
    accumulationTarget.setSize(_width, _height);
  } else {
    if (isWebGL2Available()) {
      accumulationTarget = new THREE.WebGLMultisampleRenderTarget(
        _width,
        _height,
        {}
      );

      accumulationTarget.samples = 8;
    } else {
      accumulationTarget = new THREE.WebGLRenderTarget(_width, _height, {});
    }
  }

  if (debugTarget) {
    debugTarget.setSize(_width, _height);
  } else {
    if (isWebGL2Available()) {
      debugTarget = new THREE.WebGLMultisampleRenderTarget(_width, _height, {});

      debugTarget.samples = 0;
    } else {
      debugTarget = new THREE.WebGLRenderTarget(_width, _height, {});
    }
  }
}

initTargets();

// Scene
const scene = new THREE.Scene();

const debugScene = new THREE.Scene();

let particleSystems = [];
let particleSystemsDebugs = [];

function initParticleSystems(particleSystemCount) {
  if (particleSystems.length > 0) {
    particleSystems.forEach(function (particleSystem) {
      particleSystem.removeFromScene();
    });

    particleSystems = [];
  }

  if (particleSystemsDebugs.length > 0) {
    particleSystemsDebugs.forEach(function (particleSystem) {
      debugScene.remove(particleSystem);
    });

    particleSystemsDebugs = [];
  }

  let noiseSeed = Math.random();

  for (let i = 0; i < particleSystemCount; i++) {
    const particles = new ParticleSystem(CONFIG.NUM_PARTICLES, noiseSeed);

    const material = new THREE.PointsMaterial({
      size: CONFIG.SIZE,
      vertexColors: true,
      sizeAttenuation: false,
      opacity: CONFIG.OPACITY,
      blending: THREE.NormalBlending,
      transparent: true,
      depthTest: true,
    });

    let colorizer = new ColorGenerator(
      0,
      1.0,
      CONFIG.COLOR_A,
      CONFIG.COLOR_B,
      CONFIG.COLOR_C,
      CONFIG.COLOR_D
    );

    particles.init(CONFIG, getPointInSphereUniform, colorizer, material, scene);

    const debugMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      vertexColors: true,
      opacity: CONFIG.SHOW_DEBUG ? 1.0 : 0,
      linewidth: 1.5,
      transparent: true,
    });

    const debugGeo = new THREE.Line(particles.geometry, debugMaterial);

    debugScene.add(debugGeo);

    particleSystems.push(particles);
    particleSystemsDebugs.push(debugGeo);
  }
}

initParticleSystems(CONFIG.NUM_STREAMS);

/**
 * Sizes
 */

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;
window.addEventListener("resize", () => {
  if (
    CONFIG.LOCK_RESOLUTION &&
    CONFIG.LOCKED_RESOLUTION.x &&
    CONFIG.LOCKED_RESOLUTION.y
  ) {
    return;
  }

  if (
    window.innerWidth === windowWidth &&
    window.innerHeight === windowHeight
  ) {
    console.log("Aborted resize");
  }

  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  updateCameraAspect(sizes.width, sizes.height);
  initRenderer();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera

let aspectRatio;
if (
  CONFIG.LOCK_RESOLUTION &&
  CONFIG.LOCKED_RESOLUTION.x &&
  CONFIG.LOCKED_RESOLUTION.y
) {
  aspectRatio =
    CONFIG.LOCKED_RESOLUTION.x / CONFIG.LOCKED_RESOLUTION.y;
} else {
  aspectRatio = sizes.width / sizes.height;
}

const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 100);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = CONFIG.CAMERA_DISTANCE;
scene.add(camera);

function updateCamera() {
  easingTheta += (theta - easingTheta) * 0.02;
  easingPhi += (phi - easingPhi) * 0.02;

  camera.position.y = CONFIG.CAMERA_DISTANCE * Math.sin(easingTheta);
  camera.position.x =
    CONFIG.CAMERA_DISTANCE * Math.cos(easingTheta) * Math.cos(easingPhi);
  camera.position.z =
    CONFIG.CAMERA_DISTANCE * Math.cos(easingTheta) * Math.sin(easingPhi);

  camera.lookAt(scene.position);
}

function updateCameraAspect(width, height) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
let renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  preserveDrawingBuffer: true,
  antialias: true,
});

function initRenderer() {
  if (rendererNeedsReinit()) {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      preserveDrawingBuffer: true,
      antialias: true,
    });
    if (CONFIG.LOCK_RESOLUTION) {
      if (CONFIG.LOCKED_RESOLUTION.x && CONFIG.LOCKED_RESOLUTION.y) {
        updateCameraAspect(
          CONFIG.LOCKED_RESOLUTION.x,
          CONFIG.LOCKED_RESOLUTION.y
        );
        canvas.width = CONFIG.LOCKED_RESOLUTION.x;
        canvas.height = CONFIG.LOCKED_RESOLUTION.y;
        let body = document.querySelector("div.sizer") as HTMLElement;
        body.style.width = CONFIG.LOCKED_RESOLUTION.x + "px";
        body.style.height = CONFIG.LOCKED_RESOLUTION.y + "px";
        renderer.setSize(
          CONFIG.LOCKED_RESOLUTION.x,
          CONFIG.LOCKED_RESOLUTION.y
        );
        initTargets();
      } else {
        console.log("Please specify custom resolution X and Y");
      }
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      let body = document.querySelector("div.sizer") as HTMLElement;
      body.style.width = sizes.width + "px";
      body.style.height = sizes.height + "px";
      renderer.setSize(sizes.width, sizes.height);
      initTargets();
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClearColor = false;
  } else {
    return;
  }
}

function rendererNeedsReinit() {
  var currentRendererSize = new THREE.Vector2();
  renderer.getSize(currentRendererSize);

  if (
    CONFIG.LOCK_RESOLUTION &&
    CONFIG.LOCKED_RESOLUTION.x &&
    CONFIG.LOCKED_RESOLUTION.y
  ) {
    if (
      currentRendererSize.width !== CONFIG.LOCKED_RESOLUTION.x ||
      currentRendererSize.height !== CONFIG.LOCKED_RESOLUTION.y
    ) {
      return true;
    } else {
      return false;
    }
  } else if (
    currentRendererSize.width !== window.innerWidth ||
    currentRendererSize.height !== window.innerHeight
  ) {
    return true;
  } else {
    return false;
  }
}

initRenderer();

/**
 * Screen Quad Rendering
 */

let quadScene;
let quadCamera;

let quadAccGeometry;
let quadAccMaterial;

let quadAccMesh;
let quadDebugGeometry;
let quadDebugMaterial;

let quadDebugMesh;
let quadDebugScene;

function initQuads() {
  quadScene = new THREE.Scene();
  quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  quadAccGeometry = new THREE.PlaneBufferGeometry(2, 2);
  quadAccMaterial = new THREE.MeshBasicMaterial({
    map: accumulationTarget.texture,
    blending: THREE.NormalBlending,
  });

  quadAccMesh = new THREE.Mesh(quadAccGeometry, quadAccMaterial);

  quadDebugGeometry = new THREE.PlaneBufferGeometry(2, 2);
  quadDebugMaterial = new THREE.MeshBasicMaterial({
    map: debugTarget.texture,
    blending: THREE.AdditiveBlending,
  });

  quadDebugMesh = new THREE.Mesh(quadDebugGeometry, quadDebugMaterial);

  quadScene.add(quadCamera);
  quadScene.add(quadAccMesh);

  quadDebugScene = new THREE.Scene();

  quadDebugScene.add(quadCamera);
  quadDebugScene.add(quadDebugMesh);
  quadDebugScene.add(quadAccMesh);
}

initQuads();
/**
 * Animate
 */

const clock = new THREE.Clock();

var pressed = {};

function handleDown(e) {
  pressed[e.keyCode] = true;
}
function handleUp(e) {
  pressed[e.keyCode] = false;
  if (e.keyCode === 82) {
    buttons.clearAndReset();
  }
  if (e.keyCode === 32) {
    buttons.reset();
  }
  //Listen to 'P' key
  if (e.keyCode === 80) {
    screenshot();
  }
}

function screenshot() {
  var imgData;

  try {
    imgData = renderer.domElement.toDataURL();
    var filename = new Date().toISOString() + ".png";
    download(imgData, filename);
  } catch (e) {
    console.log("Browser does not support taking screenshot of 3d context");
    return;
  }
}

function download(dataurl, filename) {
  const link = document.createElement("a");
  link.href = dataurl;
  link.download = filename;
  link.click();
}

function handleKeys() {
  // Left
  if (pressed[37]) phi += 0.05;
  // Right
  if (pressed[39]) phi -= 0.05;
  // Up
  if (pressed[38]) theta += 0.05;
  // Down
  if (pressed[40]) theta -= 0.05;
}

document.onkeydown = handleDown;
document.onkeyup = handleUp;

const EXAMPLE_PARTICLE_DRIVER = (x, y, z) => {
  return new THREE.Vector3(0.1, 0.1, 0.1);
};

// const originPerturbation = (x, y, z) => {
//   let perturbation = getPointInSphereWeighted(0.025);

//   return new THREE.Vector3(
//     x + perturbation.x,
//     y + perturbation.y,
//     z + perturbation.z
//   );
// };

// const originPerturbation = (x,y,z) => {

// }

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects

  // TODO: COLOR UPDATE HERE

  // colorizer.saturation = CONFIG.getParam("paletteSaturation");
  // colorizer.offset = CONFIG.getParam("paletteOffset");
  // colorizer.scale = CONFIG.getParam("paletteScale");

  // TODO: PARTICLE UPDATE HERE

  // TODO: HANDLE KEYBOARD INPUT HERE

  handleKeys();

  updateCamera();

  particleSystems.forEach((ps, index) => {
    ps.update(0.001, CONFIG.USE_SMOOTH_PERTURB); //, originPerturbation);
    // update each particleStream, then set its debug equivalent's color to the particleStream's color
    let newColor = new THREE.Color(
      ps.mesh.geometry.attributes.color.getX(0),
      ps.mesh.geometry.attributes.color.getY(0),
      ps.mesh.geometry.attributes.color.getZ(0)
    );
    particleSystemsDebugs[index].material.color = newColor;
  });

  // Render
  renderer.render(scene, camera);
  renderer.setRenderTarget(accumulationTarget);
  renderer.render(scene, camera);

  renderer.setRenderTarget(debugTarget);
  renderer.clear();
  renderer.render(debugScene, camera);

  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(quadDebugScene, quadCamera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

function resetScene() {
  initRenderer();
  initParticleSystems(CONFIG.NUM_STREAMS);
}

// Debug
const pane = new Pane();

const colorConstraints = {
  r: { min: -1, max: 1 },
  g: { min: -1, max: 1 },
  b: { min: -1, max: 1 },
};

pane.addInput(CONFIG, "OPACITY", { min: 0.0001, max: 2.0, step: 0.0001 }).on("change", (ev) => {
  particleSystems.forEach((ps) => {
    ps.mesh.material.opacity = ev.value;
  });
});
pane.addInput(CONFIG, "LOCK_RESOLUTION").on("change", (ev) => {
  initRenderer();
  initTargets();
});
pane.addInput(CONFIG, "LOCKED_RESOLUTION", {
  x: {
    min: 0,
    max: 8192,
  },
  y: {
    min: 0,
    max: 8192,
  },
}).on("change", (ev) => {
  initRenderer();
  initTargets();
});

pane.addInput(CONFIG, "COLOR_A", colorConstraints);
pane.addInput(CONFIG, "COLOR_B", colorConstraints);
pane.addInput(CONFIG, "COLOR_C", colorConstraints);
pane.addInput(CONFIG, "COLOR_D", colorConstraints);
pane.addInput(CONFIG, "NUM_STREAMS", { min: 1, max: 100, step: 1 });

pane.addInput(CONFIG, "SHOW_DEBUG").on("change", (ev) => {
  particleSystemsDebugs.forEach((ps) => {
    ps.material.opacity = ev.value ? 1 : 0;
  });
});
pane.addInput(CONFIG, "USE_SMOOTH_PERTURB");

const buttons = {
  reset: function () {
    resetScene();
  },
  clearAndReset: function () {
    renderer.setRenderTarget(accumulationTarget);
    renderer.clear();
    renderer.setRenderTarget(debugTarget);
    renderer.clear();
    renderer.setRenderTarget(null);
    resetScene();
  },
  screenshot: function () {
    screenshot();
  },
};

pane
  .addButton({
    title: "Respawn",
  })
  .on("click", buttons.reset);

pane
  .addButton({
    title: "Clear and Respawn",
  })
  .on("click", buttons.clearAndReset);

pane
  .addButton({
    title: "Screenshot",
  })
  .on("click", buttons.screenshot);

tick();
