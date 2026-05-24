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

  // Camera state for dynamic effects
  let cameraShake = { x: 0, y: 0, z: 0, intensity: 0 };
  let cameraFOV = 60;
  let targetFOV = 60;

  // Visual effects
  let speedLines = null;
  let gridFloor = null;
  let muzzleFlashes = [];
  let trailParticles = [];

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

    // Create grid floor for spatial awareness
    createGridFloor();

    // Create speed lines for boost effect
    createSpeedLines();

    // Initialize materials
    initMaterials();

    // Setup post-processing if available
    if (CONFIG.bloom && typeof THREE.EffectComposer !== 'undefined') {
      setupPostProcessing();
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    console.log('🚀 3D Renderer initialized - Press V to toggle view');
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
   * Create grid floor for spatial reference
   */
  function createGridFloor() {
    const gridSize = 200;
    const divisions = 40;

    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x1a365d, 0x0f172a);
    gridHelper.position.y = -5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);
    gridFloor = gridHelper;

    // Add subtle ground plane with glow
    const planeGeom = new THREE.PlaneGeometry(gridSize, gridSize);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x0a1628,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -5.1;
    scene.add(plane);
  }

  /**
   * Create speed lines effect for boost
   */
  function createSpeedLines() {
    const lineCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);
    const colors = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = Math.random() * -50 - 10;

      positions[i6] = x;
      positions[i6 + 1] = y;
      positions[i6 + 2] = z;
      positions[i6 + 3] = x;
      positions[i6 + 4] = y;
      positions[i6 + 5] = z - 5;

      const c = 0.3 + Math.random() * 0.7;
      colors[i6] = c * 0.3;
      colors[i6 + 1] = c * 0.8;
      colors[i6 + 2] = c;
      colors[i6 + 3] = 0;
      colors[i6 + 4] = 0;
      colors[i6 + 5] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    speedLines = new THREE.LineSegments(geometry, material);
    speedLines.frustumCulled = false;
    scene.add(speedLines);
  }

  /**
   * Create muzzle flash effect
   */
  function createMuzzleFlash(position, direction, color = 0x4ade80) {
    const flashGeom = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    const flash = new THREE.Mesh(flashGeom, flashMat);
    flash.position.copy(position);
    flash.scale.set(1, 1, 2);

    const light = new THREE.PointLight(color, 3, 8);
    light.position.copy(position);

    scene.add(flash);
    scene.add(light);

    muzzleFlashes.push({
      mesh: flash,
      light: light,
      life: 1.0,
      decay: 0.15
    });

    return flash;
  }

  /**
   * Add camera shake effect
   */
  function addCameraShake(intensity = 0.5, duration = 0.2) {
    cameraShake.intensity = Math.max(cameraShake.intensity, intensity);
  }

  /**
   * Update camera shake
   */
  function updateCameraShake(dt) {
    if (cameraShake.intensity > 0.01) {
      cameraShake.x = (Math.random() - 0.5) * cameraShake.intensity * 2;
      cameraShake.y = (Math.random() - 0.5) * cameraShake.intensity * 2;
      cameraShake.z = (Math.random() - 0.5) * cameraShake.intensity;
      cameraShake.intensity *= 0.9;
    } else {
      cameraShake.x = 0;
      cameraShake.y = 0;
      cameraShake.z = 0;
      cameraShake.intensity = 0;
    }
  }

  /**
   * Update speed lines visibility
   */
  function updateSpeedLines(isBoosting, playerVel) {
    if (!speedLines) return;

    const targetOpacity = isBoosting ? 0.6 : 0;
    speedLines.material.opacity += (targetOpacity - speedLines.material.opacity) * 0.1;

    if (isBoosting && playerShip) {
      speedLines.position.copy(playerShip.position);
      speedLines.rotation.y = playerShip.rotation.y;
    }
  }

  /**
   * Update muzzle flashes
   */
  function updateMuzzleFlashes(dt) {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = muzzleFlashes[i];
      flash.life -= flash.decay;

      if (flash.life <= 0) {
        scene.remove(flash.mesh);
        scene.remove(flash.light);
        muzzleFlashes.splice(i, 1);
      } else {
        flash.mesh.material.opacity = flash.life;
        flash.mesh.scale.multiplyScalar(1.1);
        flash.light.intensity = flash.life * 3;
      }
    }
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

  // Targeting reticle
  let targetingReticle = null;
  let targetingLine = null;

  /**
   * Create 3D targeting reticle
   */
  function createTargetingReticle() {
    const group = new THREE.Group();

    // Outer ring
    const outerRingGeom = new THREE.RingGeometry(1.8, 2, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    group.add(outerRing);

    // Inner crosshair
    const crossMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.8
    });

    // Horizontal line
    const hLineGeom = new THREE.PlaneGeometry(3, 0.1);
    const hLine = new THREE.Mesh(hLineGeom, crossMat);
    hLine.rotation.x = -Math.PI / 2;
    group.add(hLine);

    // Vertical line
    const vLineGeom = new THREE.PlaneGeometry(0.1, 3);
    const vLine = new THREE.Mesh(vLineGeom, crossMat);
    vLine.rotation.x = -Math.PI / 2;
    group.add(vLine);

    // Center dot
    const dotGeom = new THREE.CircleGeometry(0.15, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 1.0
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.rotation.x = -Math.PI / 2;
    group.add(dot);

    // Corner brackets
    const bracketMat = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.7 });
    const corners = [
      [[-1.5, 0, -1.5], [-1.5, 0, -1], [-1.5, 0, -1.5], [-1, 0, -1.5]],
      [[1.5, 0, -1.5], [1.5, 0, -1], [1.5, 0, -1.5], [1, 0, -1.5]],
      [[-1.5, 0, 1.5], [-1.5, 0, 1], [-1.5, 0, 1.5], [-1, 0, 1.5]],
      [[1.5, 0, 1.5], [1.5, 0, 1], [1.5, 0, 1.5], [1, 0, 1.5]]
    ];

    corners.forEach(corner => {
      const points1 = [new THREE.Vector3(...corner[0]), new THREE.Vector3(...corner[1])];
      const points2 = [new THREE.Vector3(...corner[2]), new THREE.Vector3(...corner[3])];
      const geom1 = new THREE.BufferGeometry().setFromPoints(points1);
      const geom2 = new THREE.BufferGeometry().setFromPoints(points2);
      group.add(new THREE.Line(geom1, bracketMat));
      group.add(new THREE.Line(geom2, bracketMat));
    });

    group.position.y = 0.1;
    return group;
  }

  /**
   * Create targeting line from ship to reticle
   */
  function createTargetingLine() {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 30)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
      dashSize: 1,
      gapSize: 0.5
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }

  /**
   * Create player spaceship 3D model - ENHANCED
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
    const trimColor = new THREE.Color(colors.trim);

    // === MAIN BODY ===
    // Central fuselage - sleek shape
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(4, 0);
    bodyShape.quadraticCurveTo(3, 0.8, 1, 1);
    bodyShape.lineTo(-2, 0.8);
    bodyShape.lineTo(-2.5, 0.4);
    bodyShape.lineTo(-2.5, -0.4);
    bodyShape.lineTo(-2, -0.8);
    bodyShape.lineTo(1, -1);
    bodyShape.quadraticCurveTo(3, -0.8, 4, 0);

    const bodyExtrudeSettings = {
      steps: 1,
      depth: 1.6,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeom.center();
    bodyGeom.rotateY(Math.PI / 2);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.85,
      roughness: 0.15,
      envMapIntensity: 1.2
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cockpit canopy - bubble style
    const canopyGeom = new THREE.SphereGeometry(0.7, 24, 24);
    canopyGeom.scale(1.4, 0.5, 0.7);
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: canopyColor,
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.7,
      thickness: 0.4,
      emissive: canopyColor,
      emissiveIntensity: 0.4,
      clearcoat: 1.0
    });
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(1.2, 0.55, 0);
    group.add(canopy);

    // Cockpit frame/rim
    const frameGeom = new THREE.TorusGeometry(0.65, 0.05, 8, 24);
    frameGeom.rotateZ(Math.PI / 2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      metalness: 0.9,
      roughness: 0.1
    });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(1.2, 0.55, 0);
    frame.scale.set(1.4, 1, 0.7);
    group.add(frame);

    // === WINGS - Swept-back aggressive design ===
    // Main wings - more detailed swept design
    const wingShape = new THREE.Shape();
    wingShape.moveTo(1, 0);
    wingShape.lineTo(0.5, -0.3);
    wingShape.lineTo(-1.5, -2.8);
    wingShape.lineTo(-2.5, -2.5);
    wingShape.lineTo(-2.8, -2.2);
    wingShape.lineTo(-1.2, -0.2);
    wingShape.lineTo(-1.2, 0.2);
    wingShape.lineTo(-2.8, 2.2);
    wingShape.lineTo(-2.5, 2.5);
    wingShape.lineTo(-1.5, 2.8);
    wingShape.lineTo(0.5, 0.3);
    wingShape.lineTo(1, 0);

    const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 2
    });
    wingGeom.rotateX(Math.PI / 2);
    const wingMat = new THREE.MeshStandardMaterial({
      color: primaryColor.clone().multiplyScalar(0.85),
      metalness: 0.8,
      roughness: 0.2
    });
    const wings = new THREE.Mesh(wingGeom, wingMat);
    wings.position.set(-0.3, 0, 0);
    wings.castShadow = true;
    wings.receiveShadow = true;
    group.add(wings);

    // Wing tip accents (weapon pods)
    const wingTipGeom = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
    wingTipGeom.rotateZ(Math.PI / 2);
    const wingTipMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.9,
      roughness: 0.1,
      emissive: accentColor,
      emissiveIntensity: 0.2
    });
    const leftWingTip = new THREE.Mesh(wingTipGeom, wingTipMat);
    leftWingTip.position.set(-2, 0, 2.6);
    group.add(leftWingTip);

    const rightWingTip = leftWingTip.clone();
    rightWingTip.position.set(-2, 0, -2.6);
    group.add(rightWingTip);

    // Wing stripes (accent detail)
    const stripeMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.8
    });
    const stripeGeom = new THREE.PlaneGeometry(2, 0.08);
    const leftStripe = new THREE.Mesh(stripeGeom, stripeMat);
    leftStripe.position.set(-1, 0.14, 1.5);
    leftStripe.rotation.x = -Math.PI / 2;
    leftStripe.rotation.z = 0.4;
    group.add(leftStripe);

    const rightStripe = leftStripe.clone();
    rightStripe.position.z = -1.5;
    rightStripe.rotation.z = -0.4;
    group.add(rightStripe);

    // === ENGINE PODS - Twin nacelles ===
    const engineGeom = new THREE.CylinderGeometry(0.35, 0.5, 2, 12);
    engineGeom.rotateZ(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.95,
      roughness: 0.15
    });

    const leftEngine = new THREE.Mesh(engineGeom, engineMat);
    leftEngine.position.set(-1.8, 0, 1.8);
    leftEngine.castShadow = true;
    group.add(leftEngine);

    const rightEngine = leftEngine.clone();
    rightEngine.position.set(-1.8, 0, -1.8);
    group.add(rightEngine);

    // Engine intake rings
    const intakeGeom = new THREE.TorusGeometry(0.45, 0.06, 8, 24);
    intakeGeom.rotateZ(Math.PI / 2);
    const intakeMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.9,
      roughness: 0.1,
      emissive: accentColor,
      emissiveIntensity: 0.15
    });

    const leftIntake = new THREE.Mesh(intakeGeom, intakeMat);
    leftIntake.position.set(-0.8, 0, 1.8);
    group.add(leftIntake);

    const rightIntake = leftIntake.clone();
    rightIntake.position.set(-0.8, 0, -1.8);
    group.add(rightIntake);

    // Engine exhaust nozzles
    const nozzleGeom = new THREE.CylinderGeometry(0.3, 0.42, 0.4, 12);
    nozzleGeom.rotateZ(Math.PI / 2);
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.95,
      roughness: 0.1
    });

    const leftNozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    leftNozzle.position.set(-2.9, 0, 1.8);
    group.add(leftNozzle);

    const rightNozzle = leftNozzle.clone();
    rightNozzle.position.set(-2.9, 0, -1.8);
    group.add(rightNozzle);

    // === THRUSTER FLAMES - Multi-layer for depth ===
    // Inner white-hot core
    const flameCoreGeom = new THREE.ConeGeometry(0.2, 1.2, 8);
    flameCoreGeom.rotateZ(Math.PI / 2);
    const flameCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });

    // Outer flame
    const flameGeom = new THREE.ConeGeometry(0.32, 1.8, 8);
    flameGeom.rotateZ(Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: thrusterColor,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    // Outer glow
    const glowGeom = new THREE.ConeGeometry(0.45, 2.2, 8);
    glowGeom.rotateZ(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: thrusterColor,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    // Left thruster assembly
    const leftFlameCore = new THREE.Mesh(flameCoreGeom, flameCoreMat);
    leftFlameCore.position.set(-3.5, 0, 1.8);
    leftFlameCore.name = 'thrusterFlame';
    group.add(leftFlameCore);

    const leftFlame = new THREE.Mesh(flameGeom, flameMat);
    leftFlame.position.set(-3.6, 0, 1.8);
    leftFlame.name = 'thrusterFlame';
    group.add(leftFlame);

    const leftGlow = new THREE.Mesh(glowGeom, glowMat);
    leftGlow.position.set(-3.7, 0, 1.8);
    leftGlow.name = 'thrusterFlame';
    group.add(leftGlow);

    // Right thruster assembly
    const rightFlameCore = leftFlameCore.clone();
    rightFlameCore.position.z = -1.8;
    rightFlameCore.name = 'thrusterFlame';
    group.add(rightFlameCore);

    const rightFlame = leftFlame.clone();
    rightFlame.position.z = -1.8;
    rightFlame.name = 'thrusterFlame';
    group.add(rightFlame);

    const rightGlow = leftGlow.clone();
    rightGlow.position.z = -1.8;
    rightGlow.name = 'thrusterFlame';
    group.add(rightGlow);

    // Central main thruster (smaller)
    const centerFlame = new THREE.Mesh(flameGeom, flameMat);
    centerFlame.position.set(-2.3, 0, 0);
    centerFlame.scale.set(0.6, 0.6, 0.6);
    centerFlame.name = 'thrusterFlame';
    group.add(centerFlame);

    // Thruster point lights
    const leftThrusterLight = new THREE.PointLight(thrusterColor, 3, 12);
    leftThrusterLight.position.set(-3.5, 0, 1.8);
    leftThrusterLight.name = 'thrusterLight';
    group.add(leftThrusterLight);

    const rightThrusterLight = new THREE.PointLight(thrusterColor, 3, 12);
    rightThrusterLight.position.set(-3.5, 0, -1.8);
    rightThrusterLight.name = 'thrusterLight';
    group.add(rightThrusterLight);

    // === WEAPON SYSTEMS ===
    // Twin forward cannons
    const cannonGeom = new THREE.CylinderGeometry(0.08, 0.12, 1.8, 8);
    cannonGeom.rotateZ(-Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      metalness: 0.95,
      roughness: 0.1
    });

    const leftCannon = new THREE.Mesh(cannonGeom, cannonMat);
    leftCannon.position.set(3, -0.15, 0.8);
    group.add(leftCannon);

    const rightCannon = leftCannon.clone();
    rightCannon.position.set(3, -0.15, -0.8);
    group.add(rightCannon);

    // Cannon tips (emissive)
    const cannonTipGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8);
    cannonTipGeom.rotateZ(-Math.PI / 2);
    const cannonTipMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.8
    });

    const leftCannonTip = new THREE.Mesh(cannonTipGeom, cannonTipMat);
    leftCannonTip.position.set(3.9, -0.15, 0.8);
    leftCannonTip.name = 'cannonTip';
    group.add(leftCannonTip);

    const rightCannonTip = leftCannonTip.clone();
    rightCannonTip.position.z = -0.8;
    rightCannonTip.name = 'cannonTip';
    group.add(rightCannonTip);

    // === SHIELD EFFECT ===
    // Hexagonal shield pattern
    const shieldGeom = new THREE.IcosahedronGeometry(4.5, 1);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.name = 'shield';
    group.add(shield);

    // Shield glow sphere
    const shieldGlowGeom = new THREE.SphereGeometry(4.2, 32, 32);
    const shieldGlowMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const shieldGlow = new THREE.Mesh(shieldGlowGeom, shieldGlowMat);
    shieldGlow.name = 'shieldGlow';
    group.add(shieldGlow);

    // === TARGETING RETICLE ===
    targetingReticle = createTargetingReticle();
    targetingReticle.position.set(25, 0, 0);
    targetingReticle.name = 'targetingReticle';
    group.add(targetingReticle);

    // Targeting line
    targetingLine = createTargetingLine();
    targetingLine.position.set(4, 0, 0);
    targetingLine.name = 'targetingLine';
    group.add(targetingLine);

    // Ship scale
    group.scale.setScalar(0.8);

    return group;
  }

  /**
   * Create enemy ship 3D model - ENHANCED
   */
  function createEnemyShip(type = 'basic', size = 1) {
    const group = new THREE.Group();

    let mainColor, emissiveColor, geometry;

    switch (type) {
      case 'elite': {
        // Elite - Golden crystalline structure
        mainColor = 0xfbbf24;
        emissiveColor = 0xfbbf24;

        // Core octahedron
        geometry = new THREE.OctahedronGeometry(size * 1.4, 0);
        const material = new THREE.MeshStandardMaterial({
          color: mainColor,
          metalness: 0.95,
          roughness: 0.05,
          emissive: emissiveColor,
          emissiveIntensity: 0.5
        });
        const core = new THREE.Mesh(geometry, material);
        core.castShadow = true;
        group.add(core);

        // Rotating ring
        const ringGeom = new THREE.TorusGeometry(size * 1.8, 0.1, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: mainColor,
          transparent: true,
          opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.name = 'enemyRing';
        group.add(ring);

        // Orbiting particles
        for (let i = 0; i < 4; i++) {
          const particleGeom = new THREE.SphereGeometry(0.15, 8, 8);
          const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const particle = new THREE.Mesh(particleGeom, particleMat);
          particle.name = 'orbitParticle';
          particle.userData.orbitIndex = i;
          group.add(particle);
        }
        break;
      }

      case 'boss': {
        // Boss - Massive purple menace
        mainColor = 0xa855f7;
        emissiveColor = 0xa855f7;

        // Main body - irregular dodecahedron
        geometry = new THREE.DodecahedronGeometry(size * 2.5, 1);
        const material = new THREE.MeshStandardMaterial({
          color: mainColor,
          metalness: 0.9,
          roughness: 0.1,
          emissive: emissiveColor,
          emissiveIntensity: 0.6
        });
        const core = new THREE.Mesh(geometry, material);
        core.castShadow = true;
        group.add(core);

        // Spikes
        const spikeGeom = new THREE.ConeGeometry(0.3, 1.5, 6);
        const spikeMat = new THREE.MeshStandardMaterial({
          color: 0x7c3aed,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x7c3aed,
          emissiveIntensity: 0.4
        });

        const spikePositions = [
          [size * 2.5, 0, 0], [-size * 2.5, 0, 0],
          [0, size * 2.5, 0], [0, -size * 2.5, 0],
          [0, 0, size * 2.5], [0, 0, -size * 2.5]
        ];

        spikePositions.forEach((pos, i) => {
          const spike = new THREE.Mesh(spikeGeom, spikeMat);
          spike.position.set(...pos);
          spike.lookAt(0, 0, 0);
          spike.rotateX(Math.PI / 2);
          group.add(spike);
        });

        // Eye/core glow
        const eyeGeom = new THREE.SphereGeometry(size * 0.8, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.9
        });
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.name = 'bossEye';
        group.add(eye);

        // Boss aura
        const auraGeom = new THREE.SphereGeometry(size * 3.5, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
          color: mainColor,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide
        });
        const aura = new THREE.Mesh(auraGeom, auraMat);
        aura.name = 'bossAura';
        group.add(aura);
        break;
      }

      case 'fast': {
        // Fast - Sleek cyan dart
        mainColor = 0x22d3ee;
        emissiveColor = 0x22d3ee;

        // Aerodynamic body
        geometry = new THREE.ConeGeometry(size * 0.5, size * 2.2, 6);
        geometry.rotateZ(-Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({
          color: mainColor,
          metalness: 0.8,
          roughness: 0.2,
          emissive: emissiveColor,
          emissiveIntensity: 0.4
        });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        group.add(body);

        // Fins
        const finGeom = new THREE.BoxGeometry(0.8, 0.05, 0.5);
        const finMat = new THREE.MeshStandardMaterial({
          color: 0x0891b2,
          metalness: 0.9,
          roughness: 0.1
        });
        const topFin = new THREE.Mesh(finGeom, finMat);
        topFin.position.set(-0.5, 0.4, 0);
        topFin.rotation.z = 0.2;
        group.add(topFin);

        const bottomFin = topFin.clone();
        bottomFin.position.y = -0.4;
        bottomFin.rotation.z = -0.2;
        group.add(bottomFin);

        // Trail effect
        const trailGeom = new THREE.ConeGeometry(0.2, 1.2, 6);
        trailGeom.rotateZ(Math.PI / 2);
        const trailMat = new THREE.MeshBasicMaterial({
          color: mainColor,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Mesh(trailGeom, trailMat);
        trail.position.x = -1.5;
        trail.name = 'speedTrail';
        group.add(trail);
        break;
      }

      default: {
        // Basic - Red aggressive shape
        mainColor = 0xef4444;
        emissiveColor = 0xef4444;

        // Spiky tetrahedron body
        geometry = new THREE.TetrahedronGeometry(size * 1.1, 0);
        geometry.rotateZ(-Math.PI / 4);
        const material = new THREE.MeshStandardMaterial({
          color: mainColor,
          metalness: 0.7,
          roughness: 0.3,
          emissive: emissiveColor,
          emissiveIntensity: 0.35
        });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        group.add(body);

        // Inner glow core
        const coreGeom = new THREE.SphereGeometry(size * 0.3, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0xff6b6b,
          transparent: true,
          opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        core.name = 'enemyCore';
        group.add(core);
      }
    }

    // Point light for glow effect
    const glowLight = new THREE.PointLight(mainColor, 1.5, size * 6);
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

    // Update visual effects based on state
    const isBoosting = playerData.isBoosting;
    const now = Date.now();
    const showShield = playerData.invEnd > now || playerData.isDefenseActive;
    const healthPct = (playerData.health || 100) / (playerData.hpMax || 100);

    playerShip.traverse((child) => {
      // Thruster flames - pulsing based on boost state
      if (child.name === 'thrusterFlame') {
        const baseScale = isBoosting ? 1.8 : 0.7;
        const pulse = isBoosting ? Math.sin(now / 40) * 0.4 : Math.sin(now / 120) * 0.15;
        child.scale.x = baseScale + pulse;
        child.scale.y = 1 + pulse * 0.5;
        child.scale.z = 1 + pulse * 0.5;
        child.visible = true;
      }

      // Thruster lights
      if (child.name === 'thrusterLight') {
        child.intensity = isBoosting ? 5 + Math.sin(now / 30) : 2;
      }

      // Shield wireframe
      if (child.name === 'shield') {
        const targetOpacity = showShield ? 0.4 + Math.sin(now / 80) * 0.15 : 0;
        child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
        child.rotation.y += 0.01;
        child.rotation.z += 0.005;
      }

      // Shield glow
      if (child.name === 'shieldGlow') {
        const targetOpacity = showShield ? 0.15 + Math.sin(now / 100) * 0.05 : 0;
        child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
      }

      // Cannon tips pulse when firing
      if (child.name === 'cannonTip') {
        child.material.opacity = 0.5 + Math.sin(now / 60) * 0.3;
      }

      // Targeting reticle animation
      if (child.name === 'targetingReticle') {
        child.rotation.y += 0.02;
        child.scale.setScalar(1 + Math.sin(now / 200) * 0.05);
      }
    });

    // Damage indication - tint ship red when low health
    if (healthPct < 0.3) {
      const flash = Math.sin(now / 100) * 0.5 + 0.5;
      // Could tint materials here if we tracked them
    }

    // Update speed lines for boost effect
    updateSpeedLines(isBoosting, playerData.vel);

    // Update camera to follow player with dynamic effects
    updateCamera(playerShip.position, targetRotation, isBoosting);
  }

  // Track last bullet count for muzzle flash triggers
  let lastBulletCount = 0;

  /**
   * Update third-person camera with dynamic effects
   */
  function updateCamera(targetPos, targetRotation, isBoosting = false) {
    // Dynamic FOV - widen during boost for speed sensation
    targetFOV = isBoosting ? 75 : 60;
    cameraFOV += (targetFOV - cameraFOV) * 0.05;
    camera.fov = cameraFOV;
    camera.updateProjectionMatrix();

    // Dynamic distance - pull back slightly during boost
    const dynamicDistance = isBoosting ? CAMERA_DISTANCE * 1.15 : CAMERA_DISTANCE;

    const offset = new THREE.Vector3(
      -Math.cos(targetRotation - Math.PI / 2) * dynamicDistance,
      CAMERA_HEIGHT,
      -Math.sin(targetRotation - Math.PI / 2) * dynamicDistance
    );

    const lookAhead = new THREE.Vector3(
      Math.cos(targetRotation - Math.PI / 2) * CAMERA_LOOK_AHEAD,
      0,
      Math.sin(targetRotation - Math.PI / 2) * CAMERA_LOOK_AHEAD
    );

    const targetCameraPos = targetPos.clone().add(offset);
    const targetLookAt = targetPos.clone().add(lookAhead);

    // Apply camera shake
    targetCameraPos.x += cameraShake.x;
    targetCameraPos.y += cameraShake.y;
    targetCameraPos.z += cameraShake.z;

    // Smooth camera movement
    camera.position.lerp(targetCameraPos, CAMERA_SMOOTHING);

    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(camera.position);
    currentLookAt.lerp(targetLookAt, CAMERA_SMOOTHING * 2);
    camera.lookAt(targetLookAt);
  }

  /**
   * Update enemies with animations
   */
  function updateEnemies(enemies) {
    const currentIds = new Set();
    const now = Date.now();

    enemies.forEach((enemy, idx) => {
      const enemyId = enemy.id ?? idx;
      currentIds.add(enemyId);

      let mesh = enemyMeshes.get(enemyId);
      if (!mesh) {
        mesh = createEnemyShip(enemy.type, enemy.size / 10 || 1);
        scene.add(mesh);
        enemyMeshes.set(enemyId, mesh);
      }

      // Smooth position interpolation
      const targetX = enemy.x / 10;
      const targetZ = enemy.y / 10;
      mesh.position.x += (targetX - mesh.position.x) * 0.18;
      mesh.position.z += (targetZ - mesh.position.z) * 0.18;
      mesh.position.y = 0;

      // Rotation towards player
      if (enemy.angle !== undefined) {
        mesh.rotation.y = -enemy.angle + Math.PI / 2;
      }

      // Animate enemy sub-components
      mesh.traverse((child) => {
        // Rotating rings (elite enemies)
        if (child.name === 'enemyRing') {
          child.rotation.z += 0.03;
        }

        // Orbiting particles (elite enemies)
        if (child.name === 'orbitParticle') {
          const orbitRadius = 2;
          const orbitSpeed = 0.004;
          const angle = now * orbitSpeed + (child.userData.orbitIndex || 0) * Math.PI / 2;
          child.position.x = Math.cos(angle) * orbitRadius;
          child.position.z = Math.sin(angle) * orbitRadius;
          child.position.y = Math.sin(angle * 2) * 0.5;
        }

        // Boss eye pulsing
        if (child.name === 'bossEye') {
          const pulse = 0.7 + Math.sin(now / 150) * 0.3;
          child.scale.setScalar(pulse);
        }

        // Boss aura
        if (child.name === 'bossAura') {
          child.rotation.y += 0.005;
          child.material.opacity = 0.08 + Math.sin(now / 300) * 0.04;
        }

        // Speed trail (fast enemies)
        if (child.name === 'speedTrail') {
          const trailScale = 0.8 + Math.sin(now / 80) * 0.3;
          child.scale.x = trailScale;
        }

        // Enemy core glow
        if (child.name === 'enemyCore') {
          const glow = 0.6 + Math.sin(now / 120 + enemyId) * 0.4;
          child.material.opacity = glow;
        }
      });

      // Overall pulsing/breathing effect
      const pulse = 1 + Math.sin(now / 200 + enemyId * 0.5) * 0.04;
      mesh.scale.setScalar(pulse);
    });

    // Remove dead enemies with explosion
    enemyMeshes.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        // Determine explosion color based on enemy type
        let explosionColor = 0xef4444;
        mesh.traverse((child) => {
          if (child.isMesh && child.material?.color) {
            explosionColor = child.material.color.getHex();
          }
        });
        createExplosion(mesh.position, explosionColor, 30);
        addCameraShake(0.2);
        scene.remove(mesh);
        enemyMeshes.delete(id);
      }
    });
  }

  /**
   * Update bullets with muzzle flash effects
   */
  function updateBullets(bullets) {
    // Check for new player bullets to trigger muzzle flash
    const playerBullets = bullets.filter(b => !b.isEnemy);
    if (playerBullets.length > lastBulletCount && playerShip) {
      // New bullet fired - create muzzle flash
      const flashPos = new THREE.Vector3(
        playerShip.position.x + Math.cos(playerShip.rotation.y - Math.PI / 2) * 3,
        playerShip.position.y,
        playerShip.position.z + Math.sin(playerShip.rotation.y - Math.PI / 2) * 3
      );
      createMuzzleFlash(flashPos, null, 0x4ade80);
      addCameraShake(0.1);
    }
    lastBulletCount = playerBullets.length;

    // Remove old bullets
    bulletMeshes.forEach(mesh => {
      scene.remove(mesh);
    });
    bulletMeshes = [];

    // Create new bullet meshes with glow
    bullets.forEach(bullet => {
      const color = bullet.isEnemy ? 0xef4444 : 0x4ade80;
      const mesh = createBullet(color, 0.25);
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

    // Update visual effects
    updateParticles(deltaTime);
    updateMuzzleFlashes(deltaTime);
    updateCameraShake(deltaTime);

    // Update grid floor position to follow player roughly
    if (gridFloor && playerShip) {
      gridFloor.position.x = Math.round(playerShip.position.x / 50) * 50;
      gridFloor.position.z = Math.round(playerShip.position.z / 50) * 50;
    }

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
