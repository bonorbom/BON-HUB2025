import { Body, HelioVector, GeoVector, Equator, Illumination, AstroTime } from 'astronomy-engine';

export type PlanetId = 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export interface PlanetDestinationMeta {
  id: PlanetId;
  name: string;
  sectionTitle: string;
  navLabel: string;
  subtitle: string;
  radiusRelativeEarth: number;
  sceneRadius: number;
  axialTiltDeg: number;
  rotationPeriodHours: number;
  meanOrbitalVelocityKmS: number;
  semiMajorAxisAU: number;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
}

export interface PlanetaryEphemState {
  id: PlanetId;
  helioPositionAU: [number, number, number];
  distanceFromEarthAU: number;
  distanceFromEarthKm: number;
  distanceFromSunAU: number;
  sunDirectionWorld: [number, number, number];
  phaseAngleDeg: number;
  illuminationFraction: number;
  rightAscensionHours: number;
  declinationDeg: number;
  elongationDeg: number;
  timestampISO: string;
  usingFallbackApproximation: boolean;
}

const AU_IN_KM = 149597870.7;

export const PLANET_DESTINATIONS: Record<PlanetId, PlanetDestinationMeta> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    sectionTitle: 'Overview & Assistant',
    navLabel: 'Overview',
    subtitle: 'Primary cluster telemetry, node health & Cat-Orb assistant',
    radiusRelativeEarth: 1.0,
    sceneRadius: 2.2,
    axialTiltDeg: 23.44,
    rotationPeriodHours: 23.93,
    meanOrbitalVelocityKmS: 29.78,
    semiMajorAxisAU: 1.0
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    sectionTitle: 'Modules',
    navLabel: 'Modules',
    subtitle: 'Runtime gameplay & infrastructure modules',
    radiusRelativeEarth: 0.532,
    sceneRadius: 1.9,
    axialTiltDeg: 25.19,
    rotationPeriodHours: 24.62,
    meanOrbitalVelocityKmS: 24.07,
    semiMajorAxisAU: 1.524
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    sectionTitle: 'Services',
    navLabel: 'Services',
    subtitle: 'Managed proxy, region nodes & backup services',
    radiusRelativeEarth: 11.21,
    sceneRadius: 2.85,
    axialTiltDeg: 3.13,
    rotationPeriodHours: 9.93,
    meanOrbitalVelocityKmS: 13.07,
    semiMajorAxisAU: 5.204
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    sectionTitle: 'Explore',
    navLabel: 'Explore',
    subtitle: 'Free orbital inspection & real-time ephemeris',
    radiusRelativeEarth: 9.45,
    sceneRadius: 2.35,
    axialTiltDeg: 26.73,
    rotationPeriodHours: 10.7,
    meanOrbitalVelocityKmS: 9.68,
    semiMajorAxisAU: 9.582,
    hasRings: true,
    ringInnerRadius: 3.05,
    ringOuterRadius: 5.45
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    sectionTitle: 'Activity',
    navLabel: 'Activity',
    subtitle: 'Audit stream, module toggles & node events',
    radiusRelativeEarth: 4.01,
    sceneRadius: 2.15,
    axialTiltDeg: 97.77,
    rotationPeriodHours: -17.24,
    meanOrbitalVelocityKmS: 6.8,
    semiMajorAxisAU: 19.201
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    sectionTitle: 'Account',
    navLabel: 'Account',
    subtitle: 'Operator profile, display preferences & session keys',
    radiusRelativeEarth: 3.88,
    sceneRadius: 2.15,
    axialTiltDeg: 28.32,
    rotationPeriodHours: 16.11,
    meanOrbitalVelocityKmS: 5.43,
    semiMajorAxisAU: 30.047
  }
};

export const PLANET_ORDER: PlanetId[] = ['earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

const BODY_MAP: Record<PlanetId, Body> = {
  earth: Body.Earth,
  mars: Body.Mars,

/**
 * Computes real-time heliocentric coordinates, interplanetary distances, and solar lighting vectors
 * using `astronomy-engine` (with documented analytical Keplerian fallback if ever needed).
 */
export function computePlanetEphemeris(planetId: PlanetId, date: Date = new Date()): PlanetaryEphemState {
  try {
    const time = new AstroTime(date);
    const body = BODY_MAP[planetId];
    const helio = HelioVector(body, time);
    const earthHelio = HelioVector(Body.Earth, time);

    const dx = helio.x - earthHelio.x;
    const dy = helio.y - earthHelio.y;
    const dz = helio.z - earthHelio.z;
    const distFromEarthAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const distFromSunAU = Math.sqrt(helio.x * helio.x + helio.y * helio.y + helio.z * helio.z);

    // Direction from planet toward the Sun (at origin 0,0,0)
    // Map astronomy ecliptic (x, y, z) to Three.js world (x, z, -y)
    const sx = -helio.x;
    const sy = helio.z;
    const sz = -helio.y;
    const sLen = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    const sunDirectionWorld: [number, number, number] = [sx / sLen, sy / sLen, sz / sLen];

    let phaseAngleDeg = 0;
    let illuminationFraction = 1;
    let rightAscensionHours = 0;
    let declinationDeg = 0;
    let elongationDeg = 0;

    if (planetId !== 'earth') {
      const illum = Illumination(body, time);
      phaseAngleDeg = illum.phase_angle;
      illuminationFraction = illum.phase_fraction;

      const geo = GeoVector(body, time, true);
      const eq = Equator(body, time, { latitude: 0, longitude: 0, height: 0 }, true, true);
      rightAscensionHours = eq.ra;
      declinationDeg = eq.dec;

      const gLen = Math.sqrt(geo.x * geo.x + geo.y * geo.y + geo.z * geo.z) || 1;
      const eLen = Math.sqrt(earthHelio.x * earthHelio.x + earthHelio.y * earthHelio.y + earthHelio.z * earthHelio.z) || 1;
      const cosElong = -(geo.x * earthHelio.x + geo.y * earthHelio.y + geo.z * earthHelio.z) / (gLen * eLen);
      elongationDeg = (Math.acos(Math.max(-1, Math.min(1, cosElong))) * 180) / Math.PI;
    }

    return {
      id: planetId,
      helioPositionAU: [helio.x, helio.y, helio.z],
      distanceFromEarthAU: distFromEarthAU,
      distanceFromEarthKm: distFromEarthAU * AU_IN_KM,
      distanceFromSunAU: distFromSunAU,
      sunDirectionWorld,
      phaseAngleDeg,
      illuminationFraction,
      rightAscensionHours,
      declinationDeg,
      elongationDeg,
      timestampISO: date.toISOString(),
      usingFallbackApproximation: false
    };
  } catch {
    const meta = PLANET_DESTINATIONS[planetId];
    const daysSinceJ2000 = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
    const meanMotion = 0.9856076686 / Math.pow(meta.semiMajorAxisAU, 1.5);
    const angleRad = ((daysSinceJ2000 * meanMotion) % 360) * (Math.PI / 180);
    const x = meta.semiMajorAxisAU * Math.cos(angleRad);
    const y = meta.semiMajorAxisAU * Math.sin(angleRad);
    const distFromEarthAU = Math.abs(meta.semiMajorAxisAU - 1.0);

    return {
      id: planetId,
      helioPositionAU: [x, y, 0],
      distanceFromEarthAU: distFromEarthAU,
      distanceFromEarthKm: distFromEarthAU * AU_IN_KM,
      distanceFromSunAU: meta.semiMajorAxisAU,
      sunDirectionWorld: [-Math.cos(angleRad), 0.12, -Math.sin(angleRad)],
      phaseAngleDeg: 18.5,
      illuminationFraction: 0.96,
      rightAscensionHours: 12.4,
      declinationDeg: -4.2,
      elongationDeg: 112.0,
      timestampISO: date.toISOString(),
      usingFallbackApproximation: true
    };
  }
}

/**
 * Computes the true 3D Euclidean distance in AU and km between any two planets at the given date.
 */
export function computeInterplanetaryDistance(fromId: PlanetId, toId: PlanetId, date: Date = new Date()): {
  distanceAU: number;
  distanceKm: number;
  travelDurationMs: number;
} {
  if (fromId === toId) {
    return { distanceAU: 0, distanceKm: 0, travelDurationMs: 1100 };
  }
  const fromEphem = computePlanetEphemeris(fromId, date);
  const toEphem = computePlanetEphemeris(toId, date);

  const dx = toEphem.helioPositionAU[0] - fromEphem.helioPositionAU[0];
  const dy = toEphem.helioPositionAU[1] - fromEphem.helioPositionAU[1];
  const dz = toEphem.helioPositionAU[2] - fromEphem.helioPositionAU[2];
  const distanceAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distanceKm = distanceAU * AU_IN_KM;

  // Section 6.2: Travel duration scales gently with interplanetary distance, clamped to 1.1s - 2.4s
  const normalized = Math.min(1, Math.max(0, Math.log1p(distanceAU) / Math.log1p(31)));
  const travelDurationMs = Math.round(1100 + normalized * (2400 - 1100));

  return {
    distanceAU,
    distanceKm,
    travelDurationMs
  };
}

  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune
};
