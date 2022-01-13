import * as THREE from "three";

export const getPointInSphereUniform = (diameter) => {
  var d, x, y, z;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    d = x * x + y * y + z * z;
  } while (d > diameter);

  return new THREE.Vector3(x, y, z);
};

export const getPointInSphereWeighted = (diameter) => {
  var d, x, y, z;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    d = x * x + y * y + z * z;
  } while (d > 1.0);

  diameter *= Math.random();
  return new THREE.Vector3(x * diameter, y * diameter, z * diameter);
};
