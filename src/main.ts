import './style.css';
import * as THREE from 'three';
import Stats from "stats.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {encodePointCloud2} from "./fakeRobot.ts";
import {parsePointCloud2} from "./pointcloud2.ts";

// --- Renderer / camera / controls ---

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

camera.up.set(0, 0, 1);
camera.position.set(5, 5, 5);
new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.AxesHelper(2));

// --- Terrain point cloud ---

const GRID = 1414; // points per side, 1414×1414 ≈ 2M
const SIZE = 20;  // terrain extent in meters

const positions = new Float32Array(GRID * GRID * 3);

let minZ = Infinity;
let maxZ = -Infinity;

for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    const k  = i * GRID + j;
    const x = (i / (GRID - 1) - 0.5) * SIZE;
    const y = (j / (GRID - 1) - 0.5) * SIZE;
    const z = Math.sin(x * 0.5) * Math.cos(y * 0.5) + Math.sin(x * 2.7) * Math.cos(y * 3.1) * 0.15;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    positions[k * 3] = x;
    positions[k * 3 + 1] = y;
    positions[k * 3 + 2] = z;
  }
}

const msg = encodePointCloud2(positions);
const parsed = parsePointCloud2(msg);

// --- Shader material: height color on GPU ---

const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float uMinZ;
    uniform float uMaxZ;
    varying vec3 vColor;
    void main() {
      float t = (position.z - uMinZ) / (uMaxZ - uMinZ);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = 40.0 / -mvPosition.z;
      vColor = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), t);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  uniforms: {
    uMinZ: { value: minZ },
    uMaxZ: { value: maxZ },
  }
});

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(parsed, 3));
scene.add(new THREE.Points(geometry, material));

// --- Events / loop ---

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  stats.update();
});
