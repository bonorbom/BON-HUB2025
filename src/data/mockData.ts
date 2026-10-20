import { PlanetId } from '../astronomy/ephemeris';

export const DEMO_ACCESS_KEY = 'MC-ORBIT-2025';

export interface MinecraftModule {
  id: string;
  name: string;
  category: 'Performance' | 'Security' | 'WorldGen' | 'Economy' | 'Telemetry';
  description: string;
  version: string;
  enabled: boolean;
  status: 'active' | 'idle' | 'warning';
  memoryMb: number;
  tickImpactMs: number;
  configSummary: string;
  lastModified: string;
}

export interface ManagedService {
  id: string;
  name: string;
  region: string;
  nodeAddress: string;
  status: 'online' | 'degraded' | 'offline';
  playersOnline: number;
  playersMax: number;
  tps: number;
  latencyMs: number;
  uptimePct: number;
  version: string;
  notes: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'module' | 'service' | 'security' | 'navigation';
  severity: 'ok' | 'warn' | 'danger';
  title: string;
  detail: string;
  actor: string;
}

export interface OperatorAccount {
  operatorHandle: string;
  organization: string;
  clusterTier: string;
  alertEmail: string;
  webhookEndpoint: string;
  autoFailover: boolean;
  telemetryRetentionDays: number;
  sessionKeyMasked: string;
}

export const INITIAL_MODULES: MinecraftModule[] = [
  {
    id: 'mod-lithium-tick',
    name: 'Lithium Tick Optimizer',
    category: 'Performance',
    description: 'General-purpose server physics, mob AI, and block-tick optimization without vanilla behavior changes.',
    version: '0.14.2-mc1.21.4',
    enabled: true,
    status: 'active',
    memoryMb: 142,
    tickImpactMs: 1.8,
    configSummary: 'entity.collisions=fast, hopper.transfer=batched, poi.lookup=indexed',
    lastModified: '14m ago'
  },
  {
    id: 'mod-starlight-chunk',
    name: 'Starlight Chunk Engine',
    category: 'WorldGen',
    description: 'Asynchronous light propagation and region file pre-fetcher for high-velocity elytra travel.',
    version: '2.3.1-mc1.21.4',
    enabled: true,
    status: 'active',
    memoryMb: 318,
    tickImpactMs: 2.4,
    configSummary: 'io.threads=6, skylight.queue=4096, async.chunk.load=true',
    lastModified: '2h ago'
  },
  {
    id: 'mod-sentinel-packet',
    name: 'Sentinel Packet Guard',
    category: 'Security',
    description: 'Zero-trust netty packet inspection, book-ban mitigation, and movement envelope validation.',
    version: '4.8.0-release',
    enabled: true,
    status: 'active',
    memoryMb: 96,
    tickImpactMs: 0.9,
    configSummary: 'max.nbt.depth=32, pps.limit=450, movement.rubberband=strict',
    lastModified: '1d ago'
  },
  {
    id: 'mod-ledger-audit',
    name: 'Prism Block Ledger',
    category: 'Telemetry',
    description: 'Append-only block diff journal and inventory transaction snapshots with instant rollback.',
    version: '3.1.9-stable',
    enabled: true,
    status: 'warning',
    memoryMb: 512,
    tickImpactMs: 4.1,
    configSummary: 'storage=zstd-local, flush.interval=5s, retention=30d (disk 82%)',
    lastModified: '3h ago'
  },
  {
    id: 'mod-vault-sync',
    name: 'Redis Cross-Shard Economy',
    category: 'Economy',
    description: 'Distributed atomic currency locks and auction house orderbook synchronization across proxy nodes.',
    version: '1.9.4-release',
    enabled: false,
    status: 'idle',
    memoryMb: 64,
    tickImpactMs: 0.0,
    configSummary: 'redis.pool=8, lock.timeout=250ms, journal.mode=strict',
    lastModified: '4d ago'
  },
  {
    id: 'mod-voice-proximity',
    name: 'Opus Spatial Voice Bridge',
    category: 'Performance',
    description: 'UDP WebRTC spatial audio relay bound to entity coordinates and cave occlusion raycasts.',

export const INITIAL_SERVICES: ManagedService[] = [
  {
    id: 'srv-eu-velocity',
    name: 'Velocity Edge Proxy — EU Central',
    region: 'eu-central-1 (Frankfurt)',
    nodeAddress: 'edge-fra-01.orbit.mc:25565',
    status: 'online',
    playersOnline: 412,
    playersMax: 1000,
    tps: 20.0,
    latencyMs: 18,
    uptimePct: 99.98,
    version: 'Velocity 3.4.0-SNAPSHOT',
    notes: 'BGP Anycast primary ingress. TLS session resumption active.'
  },
  {
    id: 'srv-survival-alpha',
    name: 'Survival Shard 01 — Overworld',
    region: 'eu-central-1 (Frankfurt)',
    nodeAddress: 'shard-ow-01.internal:25570',
    status: 'online',
    playersOnline: 184,
    playersMax: 250,
    tps: 19.9,
    latencyMs: 22,
    uptimePct: 99.94,
    version: 'Folia 1.21.4-R0.1',
    notes: '16-core EPYC dedicated thread-per-region scheduler.'
  },
  {
    id: 'srv-nether-hub',
    name: 'Nether Ice-Highway & Hub Shard',
    region: 'us-east-1 (Virginia)',
    nodeAddress: 'shard-nt-02.internal:25571',
    status: 'degraded',
    playersOnline: 96,
    playersMax: 150,
    tps: 17.8,
    latencyMs: 64,
    uptimePct: 99.41,
    version: 'Paper 1.21.4-b219',
    notes: 'Elevated chunk generation load near X:+12,400 Z:-8,100.'
  },
  {
    id: 'srv-archive-snap',
    name: 'ZFS Incremental World Snapshot Worker',
    region: 'eu-north-1 (Stockholm)',
    nodeAddress: 'backup-sto-01.internal:9090',
    status: 'online',
    playersOnline: 0,
    playersMax: 0,
    tps: 20.0,
    latencyMs: 31,
    uptimePct: 100.0,
    version: 'OrbitSnap 1.6.2',
    notes: 'Hourly deduplicated snapshots to cold NVMe array (4.2 TB free).'
  },
  {
    id: 'srv-test-staging',
    name: 'Redstone & Protocol Sandbox',
    region: 'ap-northeast-1 (Tokyo)',
    nodeAddress: 'stage-tyo-01.orbit.mc:25580',
    status: 'offline',
    playersOnline: 0,
    playersMax: 50,
    tps: 0.0,
    latencyMs: 0,
    uptimePct: 94.12,
    version: 'Purpur 1.21.4-dev',
    notes: 'Stopped after scheduled protocol stress suite.'
  }
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-101',
    timestamp: '10:42:18 UTC',
    type: 'service',
    severity: 'ok',
    title: 'Snapshot completed on Survival Shard 01',
    detail: 'Incremental delta (1.48 GB) verified and replicated to Stockholm vault in 3.8s.',
    actor: 'system/orbitsnap'
  },
  {
    id: 'act-102',
    timestamp: '10:36:04 UTC',
    type: 'service',
    severity: 'warn',
    title: 'Tick duration spike on Nether Hub Shard',
    detail: 'MSPT reached 54.2ms (17.8 TPS) during concurrent portal chunk ticket burst.',
    actor: 'watchdog/folia'
  },
  {
    id: 'act-103',
    timestamp: '10:19:50 UTC',
    type: 'security',
    severity: 'ok',
    title: 'Sentinel blocked malformed payload burst',
    detail: 'Dropped 1,420 oversized creative-slot packets from 198.51.100.44.',
    actor: 'sentinel/edge-fra-01'
  },
  {
    id: 'act-104',
    timestamp: '09:58:12 UTC',
    type: 'module',
    severity: 'ok',
    title: 'Lithium Tick Optimizer hot-reloaded',
    detail: 'Applied hopper batching threshold update without disconnecting active players.',
    actor: 'operator/bon-admin'
  },
  {
    id: 'act-105',
    timestamp: '09:15:33 UTC',
    type: 'service',
    severity: 'danger',
    title: 'Redstone Sandbox node entered offline state',
    detail: 'Graceful shutdown triggered after automated 1.21.4 protocol regression run.',
    actor: 'ci/runner-04'
  }
];

export const INITIAL_ACCOUNT: OperatorAccount = {
  operatorHandle: 'bon-operator',
  organization: 'BON-HUB Orbital Infrastructure',
  clusterTier: 'Dedicated Bare-Metal Mesh (EU + US)',
  alertEmail: 'ops@bonhub-mc.internal',
  webhookEndpoint: 'https://hooks.bonhub-mc.internal/v2/alerts',
  autoFailover: true,
  telemetryRetentionDays: 30,
  sessionKeyMasked: 'MC-ORBIT-2025 •••• 9F4A'
};

export const ASSISTANT_GREETINGS: Record<PlanetId, string> = {
  earth: 'Welcome back, Operator. Earth telemetry is nominal at 19.9 TPS across primary shards.',
  mars: 'Mars Modules bay ready. 4 of 6 runtime modules are active on the cluster.',
  jupiter: 'Jupiter Services array in view. 1 shard reports elevated MSPT in the Nether.',
  saturn: 'Saturn orbital inspection unlocked. Drag to inspect the ring plane or switch bodies.',
  uranus: 'Uranus audit stream synced. All recent module and node transitions are logged here.',
  neptune: 'Neptune operator profile loaded. Session key and motion preferences are active.'
};

    version: '2.5.0-mc1.21.4',
    enabled: false,
    status: 'idle',
    memoryMb: 88,
    tickImpactMs: 0.0,
    configSummary: 'codec=opus-48k, distance.max=48m, udp.port=24454',
    lastModified: '6d ago'
  }
];
