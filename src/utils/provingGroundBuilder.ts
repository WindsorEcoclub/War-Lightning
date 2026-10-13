import * as THREE from 'three';

const skyboxImgUrl = '/src/assets/images/skybox_mountains_wt_1791813119628.jpg';
const dirtRoadImgUrl = '/src/assets/images/ground_dirt_road_1791813131797.jpg';
const grassSoilImgUrl = '/src/assets/images/terrain_grass_soil_1791877681686.jpg';

export function buildProvingGroundScenery(scene: THREE.Scene, biome: 'kursk' | 'sinai' | 'arctic') {
  const sceneryGroup = new THREE.Group();
  scene.add(sceneryGroup);

  const textureLoader = new THREE.TextureLoader();

  // 1. Panoramic Photorealistic Mountain Sky Dome
  const skyGeo = new THREE.SphereGeometry(1400, 32, 24);
  const skyTexture = textureLoader.load(skyboxImgUrl);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  skyTexture.wrapS = THREE.RepeatWrapping;
  skyTexture.repeat.set(2, 1);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    fog: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.y = 120;
  sceneryGroup.add(skyDome);

  // 2. Vast Rolling Terrain Floor with Multi-Texture Grass and Soil
  const grassTexture = textureLoader.load(grassSoilImgUrl);
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(60, 60);

  const terrainGeo = new THREE.PlaneGeometry(1600, 2200, 32, 32);
  terrainGeo.rotateX(-Math.PI / 2);

  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.88,
    metalness: 0.05,
    color: biome === 'sinai' ? new THREE.Color(0xd4b886) : biome === 'arctic' ? new THREE.Color(0xe2e8f0) : new THREE.Color(0x7c8567),
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.set(0, 0, 750);
  terrainMesh.receiveShadow = true;
  sceneryGroup.add(terrainMesh);

  // 3. Central Military Tank Firing Lane (Compacted Dirt Road with Track Imprints)
  const roadWidth = 11.5;
  const roadLength = 1900.0;
  const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 4, 64);
  roadGeo.rotateX(-Math.PI / 2);

  const roadTexture = textureLoader.load(dirtRoadImgUrl);
  roadTexture.wrapS = THREE.RepeatWrapping;
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(2, 65);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.92,
    metalness: 0.08,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.position.set(0, 0.08, 800);
  roadMesh.receiveShadow = true;
  sceneryGroup.add(roadMesh);

  // Crushed Stone Gravel Shoulders with Tire Rut Berms
  const shoulderGeo = new THREE.PlaneGeometry(4.2, roadLength, 2, 32);
  shoulderGeo.rotateX(-Math.PI / 2);
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: 0x42382c,
    roughness: 0.96,
  });
  const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  leftShoulder.position.set(-7.8, 0.05, 800);
  leftShoulder.receiveShadow = true;
  const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  rightShoulder.position.set(7.8, 0.05, 800);
  rightShoulder.receiveShadow = true;
  sceneryGroup.add(leftShoulder, rightShoulder);

  // 4. Lateral Cross-Road for Moving Patrol Target Tank
  const crossRoadGeo = new THREE.PlaneGeometry(380, 9.5);
  crossRoadGeo.rotateX(-Math.PI / 2);
  const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
  crossRoad.position.set(0, 0.06, 210);
  crossRoad.receiveShadow = true;
  sceneryGroup.add(crossRoad);

  // 5. Realistic Utility Poles with Insulators and Catenary Overhead Wires (Matching IMG_1728.jpeg)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3d2d1d, roughness: 0.95 });
  const poleGeo = new THREE.CylinderGeometry(0.13, 0.18, 9.8, 10);
  const crossarmGeo = new THREE.BoxGeometry(2.5, 0.15, 0.15);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x1f2937 });

  const polePositions: THREE.Vector3[] = [];

  for (let z = 20; z <= 1300; z += 65) {
    const poleGroup = new THREE.Group();
    const p = new THREE.Mesh(poleGeo, poleMat);
    p.position.y = 4.9;
    p.castShadow = true;
    const cross = new THREE.Mesh(crossarmGeo, poleMat);
    cross.position.y = 9.0;
    cross.castShadow = true;

    // Ceramic insulators
    const insGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 8);
    const insMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 });
    [-0.95, 0, 0.95].forEach((ix) => {
      const ins = new THREE.Mesh(insGeo, insMat);
      ins.position.set(ix, 9.2, 0);
      poleGroup.add(ins);
    });

    poleGroup.add(p, cross);
    poleGroup.position.set(10.0, 0, z);
    sceneryGroup.add(poleGroup);

    polePositions.push(new THREE.Vector3(10.0, 9.2, z));
  }

  // Draw catenary utility wires connecting the telephone poles
  for (let i = 0; i < polePositions.length - 1; i++) {
    const p1 = polePositions[i];
    const p2 = polePositions[i + 1];

    [-0.95, 0, 0.95].forEach((wireOffsetX) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1.x + wireOffsetX, p1.y, p1.z),
        new THREE.Vector3(p1.x + wireOffsetX, (p1.y + p2.y) * 0.5 - 0.75, (p1.z + p2.z) * 0.5),
        new THREE.Vector3(p2.x + wireOffsetX, p2.y, p2.z),
      ]);
      const points = curve.getPoints(12);
      const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
      const wireLine = new THREE.Line(wireGeo, wireMat);
      sceneryGroup.add(wireLine);
    });
  }

  // 6. High-Fidelity 3D Pine & Deciduous Trees Lining the Range (Realistic silhouettes, not blocky)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2b1c10, roughness: 0.96 });
  const needleMat1 = new THREE.MeshStandardMaterial({ color: 0x1d361c, roughness: 0.82 });
  const needleMat2 = new THREE.MeshStandardMaterial({ color: 0x254624, roughness: 0.82 });
  const needleMat3 = new THREE.MeshStandardMaterial({ color: 0x162c15, roughness: 0.82 });

  const createRealisticPineTree = (scale = 1.0) => {
    const tree = new THREE.Group();
    // Tapered trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.48 * scale, 4.0 * scale, 10), trunkMat);
    trunk.position.y = 2.0 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    // 4-layer stepped foliage cones
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(3.0 * scale, 4.2 * scale, 8), needleMat1);
    c1.position.y = 4.2 * scale;
    c1.castShadow = true;

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(2.5 * scale, 3.8 * scale, 8), needleMat2);
    c2.position.y = 6.4 * scale;
    c2.castShadow = true;

    const c3 = new THREE.Mesh(new THREE.ConeGeometry(1.9 * scale, 3.4 * scale, 8), needleMat1);
    c3.position.y = 8.4 * scale;
    c3.castShadow = true;

    const c4 = new THREE.Mesh(new THREE.ConeGeometry(1.2 * scale, 2.8 * scale, 8), needleMat3);
    c4.position.y = 10.2 * scale;
    c4.castShadow = true;

    tree.add(c1, c2, c3, c4);
    return tree;
  };

  // Populate dense tree belts along left and right proving ground borders
  for (let z = 30; z <= 1100; z += 22) {
    // Left side forest
    const leftX1 = -20 - (Math.sin(z * 0.04) * 6 + Math.random() * 8);
    const leftTree1 = createRealisticPineTree(0.85 + Math.random() * 0.55);
    leftTree1.position.set(leftX1, 0, z + (Math.random() - 0.5) * 12);
    sceneryGroup.add(leftTree1);

    const leftX2 = -32 - (Math.cos(z * 0.03) * 8 + Math.random() * 10);
    const leftTree2 = createRealisticPineTree(1.1 + Math.random() * 0.6);
    leftTree2.position.set(leftX2, 0, z + (Math.random() - 0.5) * 16);
    sceneryGroup.add(leftTree2);

    // Right side forest (behind telephone poles)
    const rightX1 = 20 + (Math.cos(z * 0.04) * 6 + Math.random() * 8);
    const rightTree1 = createRealisticPineTree(0.85 + Math.random() * 0.55);
    rightTree1.position.set(rightX1, 0, z + (Math.random() - 0.5) * 12);
    sceneryGroup.add(rightTree1);

    const rightX2 = 34 + (Math.sin(z * 0.03) * 8 + Math.random() * 10);
    const rightTree2 = createRealisticPineTree(1.1 + Math.random() * 0.6);
    rightTree2.position.set(rightX2, 0, z + (Math.random() - 0.5) * 16);
    sceneryGroup.add(rightTree2);
  }

  // 7. Distance Milestone Markers with High-Contrast Stencils
  const distances = [
    { dist: 100, label: '100 m' },
    { dist: 200, label: '200 m' },
    { dist: 400, label: '400 m' },
    { dist: 600, label: '600 m' },
    { dist: 800, label: '800 m' },
    { dist: 1000, label: '1000 m' },
    { dist: 1200, label: '1200 m' },
    { dist: 1400, label: '1400 m' },
  ];

  distances.forEach(({ dist, label }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 128);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(5, 5, 246, 118);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 64);

    const signTexture = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.7 });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), signMat);
    signMesh.position.set(7.5, 1.6, dist);
    signMesh.rotation.y = -Math.PI / 2;

    const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), poleMat);
    postMesh.position.set(7.5, 1.0, dist);

    sceneryGroup.add(signMesh, postMesh);
  });

  // 8. Military Defense Fortifications: Czech Hedgehogs and Dragon's Teeth along borders
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.6, metalness: 0.7 });
  for (let z = 60; z <= 700; z += 90) {
    [-11.5, 12.0].forEach((hx) => {
      // Czech hedgehog (three crossed I-beams)
      const hGroup = new THREE.Group();
      const beamGeo = new THREE.BoxGeometry(0.18, 0.18, 2.4);
      const b1 = new THREE.Mesh(beamGeo, steelMat);
      const b2 = new THREE.Mesh(beamGeo, steelMat);
      b2.rotation.x = Math.PI / 3;
      const b3 = new THREE.Mesh(beamGeo, steelMat);
      b3.rotation.y = Math.PI / 3;
      hGroup.add(b1, b2, b3);
      hGroup.position.set(hx, 0.9, z);
      sceneryGroup.add(hGroup);
    });
  }

  return sceneryGroup;
}
