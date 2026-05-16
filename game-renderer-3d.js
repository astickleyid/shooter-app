/**
 * VOID RIFT - 3D Third Person Shooter Renderer
 * Uses Three.js for proper 3D spaceship combat
 */

const GameRenderer3D = (function() {
  'use strict';

  // Three.js core objects
  let scene, camera, renderer, composer;
  let clock, deltaTime;

  // Game objects
  let playerShip = null;
  let enemyMeshes = new Map();
  let bulletMeshes = [];
  let particleSystems = [];
  let asteroidMeshes = [];
  let starField = null;
  let nebulaBackground = null;

  // Camera settings
  const CAMERA_DISTANCE = 40;
  const CAMERA_HEIGHT = 25;
  const CAMERA_LOOK_AHEAD = 15;
  const CAMERA_SMOOTHING = 0.08;

  // Materials cache
  const materials = {};

  // Ship geometry cache
  const shipGeometries = {};

  // Lighting
  let ambientLight, directionalLight, pointLights = [];

  // Configuration
  const CONFIG = {
    quality: 'high',
    shadows: true,
    particles: true,
    bloom: true,
    antialias: true
  };

  /**
   * Initialize the 3D renderer
   */
  function init(container, options = {}) {
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded! Add Three.js script before game-renderer-3d.js');
      return false;
    }

    Object.assign(CONFIG, options);

    clock = new THREE.Clock();

    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.0008);

    // Create camera (perspective for third-person view)
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.antialias,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = CONFIG.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Clear container and add canvas
    const gameContainer = container || document.getElementById('gameContainer');
    const existingCanvas = gameContainer.querySelector('canvas#gameCanvas');
    if (existingCanvas) {
      existingCanvas.style.display = 'none';
    }

    renderer.domElement.id = 'game3DCanvas';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    gameContainer.insertBefore(renderer.domElement, gameContainer.firstChild);

    // Setup lighting
    setupLighting();

    // Create starfield background
    createStarfield();

    // Create nebula background
    createNebula();

    // Initialize materials
    initMaterials();

    // Setup post-processing if available
    if (CONFIG.bloom && typeof THREE.EffectComposer !== 'undefined') {
      setupPostProcessing();
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    console.log('🚀 3D Renderer initialized');
    return true;
  }

  /**
   * Setup scene lighting
   */
  function setupLighting() {
    // Ambient light for base illumination
    ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
    scene.add(ambientLight);

    // Main directional light (sun)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = CONFIG.shadows;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0x4a90d9, 0.3);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.4);
    rimLight.position.set(0, -20, -50);
    scene.add(rimLight);
  }

  /**
   * Create starfield background
   */
  function createStarfield() {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      const colorTint = Math.random();
      if (colorTint < 0.7) {
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
      } else if (colorTint < 0.85) {
        colors[i3] = brightness;
        colors[i3 + 1] = brightness * 0.8;
        colors[i3 + 2] = brightness * 0.6;
      } else {
        colors[i3] = brightness * 0.6;
        colors[i3 + 1] = brightness * 0.8;
        colors[i3 + 2] = brightness;
      }

      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
  }

  /**
   * Create nebula background effect
   */
  function createNebula() {
    const geometry = new THREE.SphereGeometry(800, 32, 32);

    const vertexShader = `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vPosition;
      uniform float time;

      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
      }

      void main() {
        vec3 pos = normalize(vPosition);
        float n = noise(pos * 3.0 + time * 0.02);
        float n2 = noise(pos * 5.0 - time * 0.01);

        vec3 color1 = vec3(0.1, 0.0, 0.2);
        vec3 color2 = vec3(0.0, 0.1, 0.3);
        vec3 color3 = vec3(0.2, 0.0, 0.1);

        vec3 finalColor = mix(color1, color2, n);
        finalColor = mix(finalColor, color3, n2 * 0.5);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 }
      },
      side: THREE.BackSide
    });

    nebulaBackground = new THREE.Mesh(geometry, material);
    scene.add(nebulaBackground);
  }

  /**
   * Initialize reusable materials
   */
  function initMaterials() {
    materials.shipHull = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1.0
    });

    materials.shipAccent = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.3
    });

    materials.shipCanopy = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.5,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.2
    });

    materials.thruster = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9
    });

    materials.thrusterGlow = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.6
    });

    materials.bullet = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.9
    });

    materials.enemyHull = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xef4444,
      emissiveIntensity: 0.2
    });

    materials.asteroid = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      metalness: 0.2,
      roughness: 0.9
    });
  }

  /**
   * Create player spaceship 3D model
   */
  function createPlayerShip(shipTemplate) {
    const group = new THREE.Group();
    const colors = shipTemplate?.colors || {
      primary: '#0ea5e9',
      trim: '#f8fafc',
      canopy: '#7dd3fc',
      accent: '#38bdf8',
      thruster: '#f97316'
    };

    const primaryColor = new THREE.Color(colors.primary);
    const accentColor = new THREE.Color(colors.accent);
    const canopyColor = new THREE.Color(colors.canopy);
    const thrusterColor = new THREE.Color(colors.thruster);

    // Main fuselage
    const fuselageGeom = new THREE.ConeGeometry(1.5, 6, 8);
    fuselageGeom.rotateZ(-Math.PI / 2);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.8,
      roughness: 0.2
    });
    const fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.position.x = 1;
    fuselage.castShadow = true;
    group.add(fuselage);

    // Cockpit
    const cockpitGeom = new THREE.SphereGeometry(0.8, 16, 16);
    cockpitGeom.scale(1.2, 0.6, 0.8);
    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: canopyColor,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.5,
      thickness: 0.3,
      emissive: canopyColor,
      emissiveIntensity: 0.3
    });
    const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
    cockpit.position.set(1.5, 0.5, 0);
    group.add(cockpit);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(-2, -3);
    wingShape.lineTo(-3, -2.5);
    wingShape.lineTo(-1, 0);
    wingShape.lineTo(-3, 2.5);
    wingShape.lineTo(-2, 3);
    wingShape.lineTo(0, 0);

    const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05
    });
    wingGeom.rotateX(Math.PI / 2);
    const wingMat = new THREE.MeshStandardMaterial({
      color: primaryColor.clone().multiplyScalar(0.8),
      metalness: 0.7,
      roughness: 0.3
    });
    const wings = new THREE.Mesh(wingGeom, wingMat);
    wings.position.set(-0.5, 0, 0);
    wings.castShadow = true;
    group.add(wings);

    // Engine pods
    const engineGeom = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
    engineGeom.rotateZ(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2
    });

    const leftEngine = new THREE.Mesh(engineGeom, engineMat);
    leftEngine.position.set(-2, 0, 2);
    leftEngine.castShadow = true;
    group.add(leftEngine);

    const rightEngine = leftEngine.clone();
    rightEngine.position.set(-2, 0, -2);
    group.add(rightEngine);

    // Thruster flames
    const flameGeom = new THREE.ConeGeometry(0.35, 1.5, 8);
    flameGeom.rotateZ(Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: thrusterColor,
      transparent: true,
      opacity: 0.8
    });

    const leftFlame = new THREE.Mesh(flameGeom, flameMat);
    leftFlame.position.set(-3.2, 0, 2);
    leftFlame.name = 'thrusterFlame';
    group.add(leftFlame);

    const rightFlame = leftFlame.clone();
    rightFlame.position.set(-3.2, 0, -2);
    rightFlame.name = 'thrusterFlame';
    group.add(rightFlame);

    // Center thruster
    const centerFlame = new THREE.Mesh(flameGeom, flameMat);
    centerFlame.position.set(-2.5, 0, 0);
    centerFlame.scale.set(0.8, 0.8, 0.8);
    centerFlame.name = 'thrusterFlame';
    group.add(centerFlame);

    // Point light for thruster glow
    const thrusterLight = new THREE.PointLight(thrusterColor, 2, 10);
    thrusterLight.position.set(-3, 0, 0);
    thrusterLight.name = 'thrusterLight';
    group.add(thrusterLight);

    // Ship details - panel lines
    const panelMat = new THREE.LineBasicMaterial({ color: 0x1e293b });
    const panelPoints1 = [
      new THREE.Vector3(2, 0.2, 0.5),
      new THREE.Vector3(-0.5, 0.2, 0.5)
    ];
    const panelGeom1 = new THREE.BufferGeometry().setFromPoints(panelPoints1);
    const panelLine1 = new THREE.Line(panelGeom1, panelMat);
    group.add(panelLine1);

    // Weapon mounts
    const weaponGeom = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6);
    weaponGeom.rotateZ(-Math.PI / 2);
    const weaponMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.1
    });

    const leftWeapon = new THREE.Mesh(weaponGeom, weaponMat);
    leftWeapon.position.set(2.5, -0.2, 1.2);
    group.add(leftWeapon);

    const rightWeapon = leftWeapon.clone();
    rightWeapon.position.set(2.5, -0.2, -1.2);
    group.add(rightWeapon);

    // Shield effect (hidden by default)
    const shieldGeom = new THREE.SphereGeometry(4, 32, 32);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.name = 'shield';
    group.add(shield);

    return group;
  }

  /**
   * Create enemy ship 3D model
   */
  function createEnemyShip(type = 'basic', size = 1) {
    const group = new THREE.Group();

    let geometry, material;

    switch (type) {
      case 'elite':
        geometry = new THREE.OctahedronGeometry(size * 1.5, 1);
        material = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0xfbbf24,
          emissiveIntensity: 0.4
        });
        break;

      case 'boss':
        geometry = new THREE.DodecahedronGeometry(size * 3, 1);
        material = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xa855f7,
          emissiveIntensity: 0.5
        });
        break;

      case 'fast':
        geometry = new THREE.ConeGeometry(size * 0.6, size * 2, 6);
        geometry.rotateZ(-Math.PI / 2);
        material = new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x22d3ee,
          emissiveIntensity: 0.3
        });
        break;

      default:
        geometry = new THREE.TetrahedronGeometry(size, 0);
        geometry.rotateZ(-Math.PI / 4);
        material = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          metalness: 0.6,
          roughness: 0.4,
          emissive: 0xef4444,
          emissiveIntensity: 0.3
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);

    // Enemy glow
    const glowLight = new THREE.PointLight(material.color, 1, size * 5);
    group.add(glowLight);

    return group;
  }

  /**
   * Create bullet/projectile
   */
  function createBullet(color = 0x4ade80, size = 0.3) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    geometry.scale(2, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    });

    const bullet = new THREE.Mesh(geometry, material);

    // Bullet trail
    const trailGeom = new THREE.ConeGeometry(size * 0.5, size * 3, 8);
    trailGeom.rotateZ(Math.PI / 2);
    const trailMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4
    });
    const trail = new THREE.Mesh(trailGeom, trailMat);
    trail.position.x = -size * 2;
    bullet.add(trail);

    return bullet;
  }

  /**
   * Create asteroid
   */
  function createAsteroid(size = 3) {
    const geometry = new THREE.DodecahedronGeometry(size, 1);

    // Deform vertices for natural look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = (Math.random() - 0.5) * size * 0.3;
      positions.setXYZ(i, x + noise, y + noise, z + noise);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      metalness: 0.3,
      roughness: 0.9,
      flatShading: true
    });

    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;

    return asteroid;
  }

  /**
   * Create particle explosion
   */
  function createExplosion(position, color = 0xfbbf24, count = 30) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.5,
      transparent: true,
      opacity: 1
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = {
      velocities,
      life: 1.0,
      decay: 0.02
    };

    scene.add(particles);
    particleSystems.push(particles);

    return particles;
  }

  /**
   * Update player ship position and rotation
   */
  function updatePlayer(playerData, shipTemplate) {
    if (!playerShip) {
      playerShip = createPlayerShip(shipTemplate);
      scene.add(playerShip);
    }

    // Convert 2D coordinates to 3D (Y becomes Z in 3D space)
    const targetX = playerData.x / 10;
    const targetZ = playerData.y / 10;

    // Smooth position interpolation
    playerShip.position.x += (targetX - playerShip.position.x) * 0.15;
    playerShip.position.z += (targetZ - playerShip.position.z) * 0.15;
    playerShip.position.y = 0;

    // Rotation based on look angle
    const targetRotation = -playerData.lookAngle + Math.PI / 2;
    playerShip.rotation.y = targetRotation;

    // Banking effect based on movement
    const moveX = playerData.vel?.x || 0;
    const moveZ = playerData.vel?.y || 0;
    playerShip.rotation.z = -moveX * 0.3;
    playerShip.rotation.x = moveZ * 0.15;

    // Update thruster intensity
    const isBoosting = playerData.isBoosting;
    playerShip.traverse((child) => {
      if (child.name === 'thrusterFlame') {
        const scale = isBoosting ? 1.5 + Math.sin(Date.now() / 50) * 0.3 : 0.8 + Math.sin(Date.now() / 100) * 0.1;
        child.scale.x = scale;
        child.visible = true;
      }
      if (child.name === 'thrusterLight') {
        child.intensity = isBoosting ? 4 : 2;
      }
      if (child.name === 'shield') {
        const showShield = playerData.invEnd > Date.now();
        child.material.opacity = showShield ? 0.3 + Math.sin(Date.now() / 100) * 0.1 : 0;
      }
    });

    // Update camera to follow player
    updateCamera(playerShip.position, targetRotation);
  }

  /**
   * Update third-person camera
   */
  function updateCamera(targetPos, targetRotation) {
    const offset = new THREE.Vector3(
      -Math.cos(targetRotation - Math.PI / 2) * CAMERA_DISTANCE,
      CAMERA_HEIGHT,
      -Math.sin(targetRotation - Math.PI / 2) * CAMERA_DISTANCE
    );

    const lookAhead = new THREE.Vector3(
      Math.cos(targetRotation - Math.PI / 2) * CAMERA_LOOK_AHEAD,
      0,
      Math.sin(targetRotation - Math.PI / 2) * CAMERA_LOOK_AHEAD
    );

    const targetCameraPos = targetPos.clone().add(offset);
    const targetLookAt = targetPos.clone().add(lookAhead);

    // Smooth camera movement
    camera.position.lerp(targetCameraPos, CAMERA_SMOOTHING);

    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(camera.position);
    currentLookAt.lerp(targetLookAt, CAMERA_SMOOTHING * 2);
    camera.lookAt(targetLookAt);
  }

  /**
   * Update enemies
   */
  function updateEnemies(enemies) {
    const currentIds = new Set();

    enemies.forEach(enemy => {
      currentIds.add(enemy.id || enemy.idx);

      let mesh = enemyMeshes.get(enemy.id || enemy.idx);
      if (!mesh) {
        mesh = createEnemyShip(enemy.type, enemy.size / 10 || 1);
        scene.add(mesh);
        enemyMeshes.set(enemy.id || enemy.idx, mesh);
      }

      // Update position
      const targetX = enemy.x / 10;
      const targetZ = enemy.y / 10;
      mesh.position.x += (targetX - mesh.position.x) * 0.2;
      mesh.position.z += (targetZ - mesh.position.z) * 0.2;
      mesh.position.y = 0;

      // Rotation towards player or movement direction
      if (enemy.angle !== undefined) {
        mesh.rotation.y = -enemy.angle + Math.PI / 2;
      }

      // Pulsing effect
      const pulse = 1 + Math.sin(Date.now() / 200 + (enemy.id || 0)) * 0.05;
      mesh.scale.setScalar(pulse);
    });

    // Remove dead enemies
    enemyMeshes.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        createExplosion(mesh.position, 0xef4444, 20);
        scene.remove(mesh);
        enemyMeshes.delete(id);
      }
    });
  }

  /**
   * Update bullets
   */
  function updateBullets(bullets) {
    // Remove old bullets
    bulletMeshes.forEach(mesh => {
      scene.remove(mesh);
    });
    bulletMeshes = [];

    // Create new bullet meshes
    bullets.forEach(bullet => {
      const color = bullet.isEnemy ? 0xef4444 : 0x4ade80;
      const mesh = createBullet(color, 0.2);
      mesh.position.set(bullet.x / 10, 0, bullet.y / 10);
      mesh.rotation.y = -bullet.angle + Math.PI / 2;
      scene.add(mesh);
      bulletMeshes.push(mesh);
    });
  }

  /**
   * Update asteroids
   */
  function updateAsteroids(asteroids) {
    // Sync asteroid count
    while (asteroidMeshes.length < asteroids.length) {
      const asteroid = createAsteroid(3);
      scene.add(asteroid);
      asteroidMeshes.push(asteroid);
    }
    while (asteroidMeshes.length > asteroids.length) {
      const mesh = asteroidMeshes.pop();
      scene.remove(mesh);
    }

    // Update positions
    asteroids.forEach((asteroid, i) => {
      const mesh = asteroidMeshes[i];
      mesh.position.set(asteroid.x / 10, 0, asteroid.y / 10);
      mesh.rotation.x += 0.002;
      mesh.rotation.y += 0.003;
      mesh.scale.setScalar(asteroid.size / 30 || 1);
    });
  }

  /**
   * Update particle systems
   */
  function updateParticles(dt) {
    for (let i = particleSystems.length - 1; i >= 0; i--) {
      const particles = particleSystems[i];
      const data = particles.userData;

      data.life -= data.decay;
      particles.material.opacity = data.life;

      const positions = particles.geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        positions.setX(j, positions.getX(j) + data.velocities[j].x * dt);
        positions.setY(j, positions.getY(j) + data.velocities[j].y * dt);
        positions.setZ(j, positions.getZ(j) + data.velocities[j].z * dt);

        data.velocities[j].y -= 0.5 * dt; // gravity
      }
      positions.needsUpdate = true;

      if (data.life <= 0) {
        scene.remove(particles);
        particleSystems.splice(i, 1);
      }
    }
  }

  /**
   * Main render loop
   */
  function render(gameState) {
    if (!renderer) return;

    deltaTime = clock.getDelta();

    // Update nebula time uniform
    if (nebulaBackground?.material.uniforms) {
      nebulaBackground.material.uniforms.time.value += deltaTime;
    }

    // Rotate starfield slowly
    if (starField) {
      starField.rotation.y += deltaTime * 0.01;
    }

    // Update game objects
    if (gameState) {
      if (gameState.player) {
        updatePlayer(gameState.player, gameState.shipTemplate);
      }
      if (gameState.enemies) {
        updateEnemies(gameState.enemies);
      }
      if (gameState.bullets) {
        updateBullets(gameState.bullets);
      }
      if (gameState.asteroids) {
        updateAsteroids(gameState.asteroids);
      }
    }

    // Update particles
    updateParticles(deltaTime);

    // Render
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  /**
   * Setup post-processing effects
   */
  function setupPostProcessing() {
    if (typeof THREE.EffectComposer === 'undefined') return;

    composer = new THREE.EffectComposer(renderer);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    if (typeof THREE.UnrealBloomPass !== 'undefined') {
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
      );
      composer.addPass(bloomPass);
    }
  }

  /**
   * Handle window resize
   */
  function onWindowResize() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Clean up resources
   */
  function dispose() {
    window.removeEventListener('resize', onWindowResize);

    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }

    scene?.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    scene = null;
    camera = null;
    renderer = null;
    composer = null;
    playerShip = null;
    enemyMeshes.clear();
    bulletMeshes = [];
    asteroidMeshes = [];
    particleSystems = [];
  }

  /**
   * Toggle between 2D and 3D rendering
   */
  function setEnabled(enabled) {
    if (renderer) {
      renderer.domElement.style.display = enabled ? 'block' : 'none';
    }
    const canvas2D = document.getElementById('gameCanvas');
    if (canvas2D) {
      canvas2D.style.display = enabled ? 'none' : 'block';
    }
  }

  /**
   * Check if 3D is available
   */
  function isAvailable() {
    return typeof THREE !== 'undefined';
  }

  // Public API
  return {
    init,
    render,
    dispose,
    setEnabled,
    isAvailable,
    createExplosion,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer
  };
})();

// Make globally available
if (typeof window !== 'undefined') {
  window.GameRenderer3D = GameRenderer3D;
}
