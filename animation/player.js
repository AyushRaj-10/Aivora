import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let faceMeshes = [];
let keyframes = [];
let visemes = [];
let body_motions = [];

let headBone = null;
let neckBone = null;
let rArmBone = null;
let rForeArmBone = null;
let rHandBone = null;
let rIndexBone = null;
let rMiddleBone = null;
let rRingBone = null;
let rPinkyBone = null;
let rThumbBone = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0); // Focus on face
controls.enableDamping = true; // Smooth manual rotation physics
controls.dampingFactor = 0.05;
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const loader = new GLTFLoader();

// Position camera at head height (approx 1.6m) and closer to face
camera.position.set(0, 1.6, 0.8);
camera.lookAt(0, 1.6, 0);

loader.load('avatar.glb', (gltf) => {
  scene.add(gltf.scene);

  gltf.scene.traverse((obj) => {
    if (obj.isMesh && obj.morphTargetDictionary) {
      faceMeshes.push(obj);
    }
    if (obj.isBone) {
      if (obj.name === 'mixamorigHead') headBone = obj;
      if (obj.name === 'mixamorigNeck') neckBone = obj;
      if (obj.name === 'mixamorigRightArm') rArmBone = obj;
      if (obj.name === 'mixamorigRightForeArm') rForeArmBone = obj;
      if (obj.name === 'mixamorigRightHand') rHandBone = obj;
      if (obj.name === 'mixamorigRightHandIndex1') rIndexBone = obj;
      if (obj.name === 'mixamorigRightHandMiddle1') rMiddleBone = obj;
      if (obj.name === 'mixamorigRightHandRing1') rRingBone = obj;
      if (obj.name === 'mixamorigRightHandPinky1') rPinkyBone = obj;
      if (obj.name === 'mixamorigRightHandThumb2') rThumbBone = obj;
    }
  });
  
  // Load keyframes ONLY AFTER avatar is ready
  fetch('animation_brief.json')
    .then(res => res.json())
    .then(data => {
      keyframes = data.keyframes || [];
      visemes = data.visemes || [];
      body_motions = data.body_motions || [];
      playAnimation();
    });
});


function setBlendshape(name, value) {
  faceMeshes.forEach((mesh) => {
    const index = mesh.morphTargetDictionary[name];
    if (index !== undefined) {
      mesh.morphTargetInfluences[index] = value;
    }
  });
}

function applyFrame(frame) {
  for (let k in frame.blendshapes) {
    setBlendshape(k, frame.blendshapes[k]);
  }
}

function applyViseme(shapes) {
  // Clear other simulated vowels first
  const lip_shapes = ["jawOpen", "mouthFunnel", "mouthStretchLeft", "mouthStretchRight", "mouthSmileLeft", "mouthSmileRight"];
  lip_shapes.forEach(shape => setBlendshape(shape, 0)); 
  
  if (shapes) {
    for (let s in shapes) {
      setBlendshape(s, shapes[s]);
    }
  }
}

function applyBody(bones) {
  if (headBone && bones.Head) {
     headBone.rotation.set(bones.Head.pitch, bones.Head.yaw, bones.Head.roll);
  }
  if (neckBone && bones.Neck) {
     neckBone.rotation.set(bones.Neck.pitch, bones.Neck.yaw, bones.Neck.roll);
  }
  if (rArmBone && bones.RightArm) {
     rArmBone.rotation.set(bones.RightArm.pitch, bones.RightArm.yaw, bones.RightArm.roll);
  }
  if (rForeArmBone && bones.RightForeArm) {
     rForeArmBone.rotation.set(bones.RightForeArm.pitch, bones.RightForeArm.yaw, bones.RightForeArm.roll);
  }
  if (rHandBone && bones.RightHand) rHandBone.rotation.set(bones.RightHand.pitch, bones.RightHand.yaw, bones.RightHand.roll);
  if (rIndexBone && bones.RightIndex) rIndexBone.rotation.set(bones.RightIndex.pitch, bones.RightIndex.yaw, bones.RightIndex.roll);
  if (rMiddleBone && bones.RightMiddle) rMiddleBone.rotation.set(bones.RightMiddle.pitch, bones.RightMiddle.yaw, bones.RightMiddle.roll);
  if (rRingBone && bones.RightRing) rRingBone.rotation.set(bones.RightRing.pitch, bones.RightRing.yaw, bones.RightRing.roll);
  if (rPinkyBone && bones.RightPinky) rPinkyBone.rotation.set(bones.RightPinky.pitch, bones.RightPinky.yaw, bones.RightPinky.roll);
  if (rThumbBone && bones.RightThumb) rThumbBone.rotation.set(bones.RightThumb.pitch, bones.RightThumb.yaw, bones.RightThumb.roll);
}

function playAnimation() {
  keyframes.forEach(frame => {
    setTimeout(() => {
      applyFrame(frame);
    }, frame.time * 1000);
  });

  visemes.forEach(v => {
    setTimeout(() => {
      applyViseme(v.shapes);
    }, v.time * 1000);
  });

  body_motions.forEach(b => {
    setTimeout(() => {
      applyBody(b.bones);
    }, b.time * 1000);
  });
}

let nextBlinkTime = 0;
let isBlinking = false;
let blinkStartTime = 0;
const BLINK_DURATION = 150; // 150ms blink

function updateBlink(time) {
  if (!isBlinking && time > nextBlinkTime) {
    isBlinking = true;
    blinkStartTime = time;
  }
  
  if (isBlinking) {
    let t = time - blinkStartTime;
    if (t < BLINK_DURATION) {
      let blinkValue = Math.sin((t / BLINK_DURATION) * Math.PI);
      setBlendshape("eyeBlinkLeft", blinkValue);
      setBlendshape("eyeBlinkRight", blinkValue);
    } else {
      isBlinking = false;
      setBlendshape("eyeBlinkLeft", 0);
      setBlendshape("eyeBlinkRight", 0);
      nextBlinkTime = time + 2000 + Math.random() * 3000; // Next blink in 2-5 seconds
    }
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  updateBlink(time);
  controls.update();
  renderer.render(scene, camera);
}

animate(0);