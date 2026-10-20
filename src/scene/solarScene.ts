import * as THREE from 'three';
import {
  PlanetId,
  PLANET_DESTINATIONS,
  PLANET_ORDER,
  computePlanetEphemeris
} from '../astronomy/ephemeris';
import { getPlanetTextures } from './proceduralTextures';
import { appStore } from '../state/store';

interface PlanetRig {
  id: PlanetId;
  rootGroup: THREE.Group;
  tiltGroup: THREE.Group;
  surfaceMesh: THREE.Mesh;
  cloudMesh?: THREE.Mesh;
  nightMesh?: THREE.Mesh;
  atmosphereMesh: THREE.Mesh;
  ringMesh?: THREE.Mesh;
}

const WORLD_POSITIONS: Record<PlanetId, THREE.Vector3> = {
  earth: new THREE.Vector3(0, 0, 0),
  mars: new THREE.Vector3(65, 6, -48),
  jupiter: new THREE.Vector3(-92, -10, -86),
  saturn: new THREE.Vector3(128, 14, -125),
  uranus: new THREE.Vector3(-155, 18, -170),
  neptune: new THREE.Vector3(185, -16, -215)
};

export class SolarSystemRenderer {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private rigs: Map<PlanetId, PlanetRig> = new Map();

  private starPoints!: THREE.Points;
  private streakLines!: THREE.LineSegments;
  private streakBasePositions!: Float32Array;
  private streakCurrentPositions!: Float32Array;

  private activePlanet: PlanetId = 'earth';
  private transitionFrom: PlanetId = 'earth';
  private transitionTo: PlanetId = 'earth';
  private transitionStartMs = 0;
  private transitionDurationMs = 1400;
  private isTransitioning = false;
  private introZoomProgress = 1;

  private orbitAzimuth = 0.35;
  private orbitElevation = 0.24;
  private targetAzimuth = 0.35;
  private targetElevation = 0.24;
  private userZoomMultiplier = 1.0;
  private targetZoomMultiplier = 1.0;

  private currentScreenOffsetX = 0;
  private targetScreenOffsetX = 0;
  private currentScreenOffsetY = 0;
  private targetScreenOffsetY = 0;

  private isPointerDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private animationFrameId = 0;
  private lastFrameTime = performance.now();
  public webglAvailable = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      2000
    );

    this.sunLight = new THREE.DirectionalLight(0xfff8ed, 2.75);
    this.sunLight.position.set(25, 8, 22);
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x1b2436, 0.26);
    this.scene.add(this.ambientLight);

    this.initRenderer();
    if (this.webglAvailable) {
      this.createStarfieldAndStreaks();
      this.createAllPlanets();
      this.applySolarLightingForPlanet('earth');
      this.updateFramingOffsets();
      this.bindInteractionEvents();
      this.startLoop();
    }
  }

  private initRenderer(): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.className = 'solar-webgl-canvas';
      canvas.setAttribute('aria-label', 'Interactive 3D Solar System viewport');
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.container.appendChild(canvas);
    } catch {
      this.webglAvailable = false;
      this.renderer = null;
    }

  private createStarfieldAndStreaks(): void {
    const starCount = 2400;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 280 + Math.random() * 520;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const temp = Math.random();
      if (temp > 0.82) {
        colors[i * 3] = 0.82;
        colors[i * 3 + 1] = 0.89;
        colors[i * 3 + 2] = 1.0;
      } else if (temp < 0.16) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 0.76;
      } else {
        colors[i * 3] = 0.94;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.98;
      }
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);

    const streakCount = 260;
    this.streakBasePositions = new Float32Array(streakCount * 3);
    this.streakCurrentPositions = new Float32Array(streakCount * 6);

    for (let i = 0; i < streakCount; i++) {
      const spread = 24;
      const bx = (Math.random() - 0.5) * spread;
      const by = (Math.random() - 0.5) * spread;
      const bz = (Math.random() - 0.5) * spread;
      this.streakBasePositions[i * 3] = bx;
      this.streakBasePositions[i * 3 + 1] = by;
      this.streakBasePositions[i * 3 + 2] = bz;

      const idx6 = i * 6;
      this.streakCurrentPositions[idx6] = bx;
      this.streakCurrentPositions[idx6 + 1] = by;
      this.streakCurrentPositions[idx6 + 2] = bz;
      this.streakCurrentPositions[idx6 + 3] = bx;
      this.streakCurrentPositions[idx6 + 4] = by;
      this.streakCurrentPositions[idx6 + 5] = bz;
    }

    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.streakCurrentPositions, 3)
    );
    const streakMat = new THREE.LineBasicMaterial({
      color: 0xdce4f2,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    this.streakLines = new THREE.LineSegments(streakGeo, streakMat);

  private createAllPlanets(): void {
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const atmosphereFragmentShader = `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
        float fresnel = pow(rim, 3.2) * intensity;
        gl_FragColor = vec4(glowColor, fresnel);
      }
    `;

    const atmoColors: Record<PlanetId, number> = {
      earth: 0x4e84dc,
      mars: 0xc86d48,
      jupiter: 0xc9a882,
      saturn: 0xd8c398,
      uranus: 0x7ec4cf,
      neptune: 0x456cc9
    };

    for (const pid of PLANET_ORDER) {
      const meta = PLANET_DESTINATIONS[pid];
      const tex = getPlanetTextures(pid);
      const rootGroup = new THREE.Group();
      rootGroup.position.copy(WORLD_POSITIONS[pid]);

      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = THREE.MathUtils.degToRad(meta.axialTiltDeg);
      rootGroup.add(tiltGroup);

      const sphereGeo = new THREE.SphereGeometry(meta.sceneRadius, 64, 48);
      const surfaceMat = new THREE.MeshStandardMaterial({
        map: tex.surfaceMap,
        roughnessMap: tex.roughnessMap,
        bumpMap: tex.bumpMap,
        bumpScale: tex.bumpMap ? 0.035 : 0,
        roughness: pid === 'earth' ? 0.78 : 0.86,
        metalness: 0.04
      });

      const surfaceMesh = new THREE.Mesh(sphereGeo, surfaceMat);
      tiltGroup.add(surfaceMesh);

      let nightMesh: THREE.Mesh | undefined;
      let cloudMesh: THREE.Mesh | undefined;

      if (pid === 'earth' && tex.nightLightsMap && tex.cloudsMap) {
        const nightGeo = new THREE.SphereGeometry(meta.sceneRadius * 1.001, 64, 48);
        const nightMat = new THREE.ShaderMaterial({
          uniforms: {
            nightTexture: { value: tex.nightLightsMap },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
              vUv = uv;
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D nightTexture;
            uniform vec3 sunDirection;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
              float ndotl = dot(vWorldNormal, normalize(sunDirection));
              float nightMask = smoothstep(0.12, -0.28, ndotl);
              vec4 lights = texture2D(nightTexture, vUv);
              gl_FragColor = vec4(lights.rgb * nightMask * 1.15, lights.r * nightMask);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        nightMesh = new THREE.Mesh(nightGeo, nightMat);
        tiltGroup.add(nightMesh);

        const cloudGeo = new THREE.SphereGeometry(meta.sceneRadius * 1.012, 64, 48);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: tex.cloudsMap,
          transparent: true,
          opacity: 0.86,
          roughness: 0.95,
          depthWrite: false
        });
        cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        tiltGroup.add(cloudMesh);
      }

      const atmoGeo = new THREE.SphereGeometry(meta.sceneRadius * 1.045, 64, 48);
      const atmoMat = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(atmoColors[pid]) },
          intensity: { value: pid === 'earth' ? 0.65 : 0.36 }
        },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      const atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
      rootGroup.add(atmosphereMesh);

      let ringMesh: THREE.Mesh | undefined;
      if (meta.hasRings && meta.ringInnerRadius && meta.ringOuterRadius && tex.ringAlphaMap) {
        const ringGeo = new THREE.RingGeometry(meta.ringInnerRadius, meta.ringOuterRadius, 128);
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v3.fromBufferAttribute(pos, i);
          const u = (v3.length() - meta.ringInnerRadius) / (meta.ringOuterRadius - meta.ringInnerRadius);
          uv.setXY(i, u, 0.5);
        }
        ringGeo.rotateX(Math.PI / 2);

        const ringMat = new THREE.MeshStandardMaterial({
          map: tex.ringAlphaMap,
          side: THREE.DoubleSide,
          transparent: true,
          roughness: 0.85,
          metalness: 0.05,
          depthWrite: false
        });
        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        tiltGroup.add(ringMesh);
      }

      this.scene.add(rootGroup);
      this.rigs.set(pid, {
        id: pid,
        rootGroup,
        tiltGroup,
        surfaceMesh,
        cloudMesh,
        nightMesh,
        atmosphereMesh,
        ringMesh
      });
    }

  public applySolarLightingForPlanet(planetId: PlanetId): void {
    const ephem = computePlanetEphemeris(planetId);
    const [sx, sy, sz] = ephem.sunDirectionWorld;
    const targetPos = WORLD_POSITIONS[planetId];

    // Ensure the Sun directional light illuminates the planet with a realistic day/night terminator
    const dir = new THREE.Vector3(sx, sy + 0.18, sz + 0.35).normalize();
    this.sunLight.position.copy(targetPos).addScaledVector(dir, 50);
    this.sunLight.target.position.copy(targetPos);
    this.sunLight.target.updateMatrixWorld();

    const earthRig = this.rigs.get('earth');
    if (earthRig && earthRig.nightMesh) {
      const mat = earthRig.nightMesh.material as THREE.ShaderMaterial;
      mat.uniforms.sunDirection.value.copy(dir);
    }
  }

  /**
   * Computes ideal camera distance so the planet (and Saturn's rings) fits comfortably
   * within the unobstructed viewport area.
   */
  private getIdealCameraDistance(planetId: PlanetId): number {
    const meta = PLANET_DESTINATIONS[planetId];
    const effectiveRadius =
      meta.hasRings && meta.ringOuterRadius ? meta.ringOuterRadius * 0.94 : meta.sceneRadius * 1.15;

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const minFov = aspect < 1 ? fovRad * aspect : fovRad;

    const baseDist = (effectiveRadius / Math.sin(minFov * 0.5)) * 1.28;
    return baseDist * this.userZoomMultiplier;
  }

  /**
   * Updates target screen framing offset so the planet is centered in the unobstructed region
   * (left of the desktop content panel, or above the mobile bottom sheet).
   */
  public updateFramingOffsets(): void {
    const state = appStore.getState();
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (!state.authenticated || state.exploreModeOverlayHidden) {
      this.targetScreenOffsetX = 0;
      this.targetScreenOffsetY = 0;
      return;
    }

    if (w >= 768) {
      const sidebarW = w > 1024 ? (state.sidebarCollapsed ? 68 : 232) : 68;
      const panelW = Math.min(520, Math.max(380, w * 0.36));
      const freeCenterPx = sidebarW + (w - sidebarW - panelW) * 0.5;
      const normalizedShiftX = (w * 0.5 - freeCenterPx) / w;
      this.targetScreenOffsetX = normalizedShiftX * 3.4;
      this.targetScreenOffsetY = 0;
    } else {
      const sheetFraction = state.mobileSheetExpanded ? 0.52 : 0.24;
      this.targetScreenOffsetX = 0;
      this.targetScreenOffsetY = -sheetFraction * 2.5;
    }
  }

  public triggerAuthIntroZoom(): void {
    const state = appStore.getState();
    this.introZoomProgress = state.reducedMotion ? 1 : 0;
    this.updateFramingOffsets();
  }

  public navigateToPlanet(targetId: PlanetId): void {
    if (this.activePlanet === targetId && !this.isTransitioning) {
      this.updateFramingOffsets();
      return;
    }

    const travelInfo = appStore.startPlanetTransition(targetId);
    this.transitionFrom = this.activePlanet;
    this.transitionTo = targetId;
    this.transitionStartMs = performance.now();
    this.transitionDurationMs = travelInfo.durationMs;
    this.isTransitioning = true;
    this.userZoomMultiplier = 1.0;
    this.targetZoomMultiplier = 1.0;

    if (targetId === 'saturn') {
      this.targetElevation = 0.38;
      this.targetAzimuth = 0.48;
    } else {
      this.targetElevation = 0.22;
      this.targetAzimuth = 0.35;
    }

    this.applySolarLightingForPlanet(targetId);
    this.updateFramingOffsets();
  }

  public skipActiveTransition(): void {
    if (!this.isTransitioning) return;
    this.isTransitioning = false;
    this.activePlanet = this.transitionTo;

    const streakMat = this.streakLines.material as THREE.LineBasicMaterial;
    streakMat.opacity = 0;

    const st = appStore.getState();
    appStore.update({
      currentPlanet: this.activePlanet,
      travel: {
        ...st.travel,
        active: false,
        phase: 'idle',
        progress: 1
      },
      liveNotification: `Arrived at ${PLANET_DESTINATIONS[this.activePlanet].name}.`
    });
    this.updateFramingOffsets();
  }

  public resetExploreCamera(): void {
    this.targetAzimuth = 0.48;

  private bindInteractionEvents(): void {
    const onResize = (): void => {
      if (!this.renderer) return;
      this.camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.updateFramingOffsets();
    };
    window.addEventListener('resize', onResize);

    const dom = this.renderer?.domElement;
    if (!dom) return;

    dom.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.isPointerDragging = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPointerDragging) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      this.targetAzimuth -= dx * 0.0055;
      this.targetElevation = Math.max(
        -1.05,
        Math.min(1.05, this.targetElevation + dy * 0.0055)
      );
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDragging = false;
    });

    dom.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        const st = appStore.getState();
        if (!st.authenticated) return;
        e.preventDefault();
        const delta = e.deltaY * 0.0008;
        this.targetZoomMultiplier = Math.max(0.68, Math.min(1.85, this.targetZoomMultiplier + delta));
      },
      { passive: false }
    );
  }

  private updateStarStreaks(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    camPos: THREE.Vector3,
    intensity: number
  ): void {
    const streakMat = this.streakLines.material as THREE.LineBasicMaterial;
    if (intensity <= 0.01) {
      streakMat.opacity = 0;
      return;
    }

    streakMat.opacity = Math.min(0.68, intensity * 0.68);
    const dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
    const streakLength = 0.4 + intensity * 4.8;

    this.streakLines.position.copy(camPos);
    const count = this.streakBasePositions.length / 3;

    for (let i = 0; i < count; i++) {
      const bx = this.streakBasePositions[i * 3];
      const by = this.streakBasePositions[i * 3 + 1];
      const bz = this.streakBasePositions[i * 3 + 2];

      const idx6 = i * 6;
      this.streakCurrentPositions[idx6] = bx;
      this.streakCurrentPositions[idx6 + 1] = by;
      this.streakCurrentPositions[idx6 + 2] = bz;
      this.streakCurrentPositions[idx6 + 3] = bx - dir.x * streakLength;
      this.streakCurrentPositions[idx6 + 4] = by - dir.y * streakLength;

  private startLoop(): void {
    const tick = (now: number): void => {
      this.animationFrameId = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;

      const state = appStore.getState();
      const rotScale = state.reducedMotion ? 0.15 : 1.0;

      this.rigs.forEach((rig) => {
        const meta = PLANET_DESTINATIONS[rig.id];
        const dirSign = meta.rotationPeriodHours < 0 ? -1 : 1;
        const speed = (24 / Math.abs(meta.rotationPeriodHours)) * 0.075 * dirSign * rotScale;
        rig.surfaceMesh.rotation.y += speed * dt;
        if (rig.nightMesh) rig.nightMesh.rotation.y = rig.surfaceMesh.rotation.y;
        if (rig.cloudMesh) rig.cloudMesh.rotation.y += speed * 1.18 * dt;
      });

      this.orbitAzimuth += (this.targetAzimuth - this.orbitAzimuth) * 0.09;
      this.orbitElevation += (this.targetElevation - this.orbitElevation) * 0.09;
      this.userZoomMultiplier += (this.targetZoomMultiplier - this.userZoomMultiplier) * 0.1;
      this.currentScreenOffsetX += (this.targetScreenOffsetX - this.currentScreenOffsetX) * 0.08;
      this.currentScreenOffsetY += (this.targetScreenOffsetY - this.currentScreenOffsetY) * 0.08;

      if (this.introZoomProgress < 1) {
        this.introZoomProgress = Math.min(1, this.introZoomProgress + dt * 0.85);
      }
      const introEase = 1 - Math.pow(1 - this.introZoomProgress, 3);
      const introDistAdd = (1 - introEase) * 5.2;

      if (this.isTransitioning) {
        const elapsed = now - this.transitionStartMs;
        const rawT = Math.min(1, elapsed / Math.max(1, this.transitionDurationMs));

        const easeT = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        const phase =
          rawT < 0.22 ? 'departing' : rawT < 0.78 ? 'cruising' : 'arriving';
        if (state.travel.phase !== phase) {
          appStore.update({
            travel: {
              ...state.travel,
              phase,
              progress: rawT
            }
          });
        }

        const fromPos = WORLD_POSITIONS[this.transitionFrom];
        const toPos = WORLD_POSITIONS[this.transitionTo];
        const focusPos = new THREE.Vector3().lerpVectors(fromPos, toPos, easeT);

        const fromDist = this.getIdealCameraDistance(this.transitionFrom);
        const toDist = this.getIdealCameraDistance(this.transitionTo);
        const midPullback = Math.sin(rawT * Math.PI) * (state.reducedMotion ? 0.5 : 4.2);
        const currentDist = THREE.MathUtils.lerp(fromDist, toDist, easeT) + midPullback;

        const camOffset = new THREE.Vector3(
          currentDist * Math.cos(this.orbitElevation) * Math.sin(this.orbitAzimuth),
          currentDist * Math.sin(this.orbitElevation),
          currentDist * Math.cos(this.orbitElevation) * Math.cos(this.orbitAzimuth)
        );

        this.camera.position.copy(focusPos).add(camOffset);

        const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const lookTarget = focusPos
          .clone()
          .addScaledVector(rightVec, this.currentScreenOffsetX)
          .addScaledVector(upVec, this.currentScreenOffsetY);

        this.camera.lookAt(lookTarget);

        const streakIntensity = state.reducedMotion ? 0 : Math.sin(rawT * Math.PI);
        this.updateStarStreaks(fromPos, toPos, this.camera.position, streakIntensity);

        if (rawT >= 1) {
          this.skipActiveTransition();
        }
      } else {
        const focusPos = WORLD_POSITIONS[this.activePlanet];
        const dist = this.getIdealCameraDistance(this.activePlanet) + introDistAdd;

        const camOffset = new THREE.Vector3(
          dist * Math.cos(this.orbitElevation) * Math.sin(this.orbitAzimuth),
          dist * Math.sin(this.orbitElevation),
          dist * Math.cos(this.orbitElevation) * Math.cos(this.orbitAzimuth)
        );

        this.camera.position.copy(focusPos).add(camOffset);

        const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const lookTarget = focusPos
          .clone()
          .addScaledVector(rightVec, this.currentScreenOffsetX)
          .addScaledVector(upVec, this.currentScreenOffsetY);

        this.camera.lookAt(lookTarget);
      }

      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }
}

      this.streakCurrentPositions[idx6 + 5] = bz - dir.z * streakLength;
    }

    this.streakLines.geometry.attributes.position.needsUpdate = true;
  }

    this.targetElevation = 0.38;
    this.targetZoomMultiplier = 1.0;
  }

  }

    this.scene.add(this.streakLines);
  }

  }
