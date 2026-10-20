import { PlanetId, computeInterplanetaryDistance } from '../astronomy/ephemeris';
import {
  MinecraftModule,
  ManagedService,
  ActivityEvent,
  OperatorAccount,
  INITIAL_MODULES,
  INITIAL_SERVICES,
  INITIAL_ACTIVITIES,
  INITIAL_ACCOUNT
} from '../data/mockData';

export type AssistantStyle = 'smooth' | 'pixel';
export type AssistantMood =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'love'
  | 'sad'
  | 'sleepy'
  | 'scared'
  | 'surprised'
  | 'angry'
  | 'thinking'
  | 'confused'
  | 'wink'
  | 'dizzy'
  | 'shy'
  | 'cool'
  | 'listening'
  | 'talking'
  | 'error'
  | 'annoyed';

export type TravelPhase = 'idle' | 'departing' | 'cruising' | 'arriving';

export interface TravelState {
  active: boolean;
  phase: TravelPhase;
  fromPlanet: PlanetId;
  toPlanet: PlanetId;
  distanceAU: number;
  distanceKm: number;
  durationMs: number;
  progress: number;
}

export interface AppState {
  authenticated: boolean;
  introPlaying: boolean;
  currentPlanet: PlanetId;
  travel: TravelState;
  sidebarCollapsed: boolean;
  mobileSheetExpanded: boolean;
  exploreModeOverlayHidden: boolean;
  reducedMotion: boolean;
  assistantStyle: AssistantStyle;
  assistantMood: AssistantMood;
  assistantMessage: string;
  greetedInSession: boolean;
  modules: MinecraftModule[];
  services: ManagedService[];
  activities: ActivityEvent[];
  account: OperatorAccount;
  liveNotification: string;
}

type Listener = (state: AppState) => void;

const STORAGE_KEYS = {
  STYLE: 'mc-orbit-assistant-style',
  MOTION: 'mc-orbit-reduced-motion',
  SIDEBAR: 'mc-orbit-sidebar-collapsed'
};

function getInitialReducedMotion(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MOTION);
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function getInitialAssistantStyle(): AssistantStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STYLE);
    if (saved === 'pixel' || saved === 'smooth') return saved;
  } catch {
    // ignore
  }
  return 'smooth';
}

function getInitialSidebarCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR);
    if (saved !== null) return saved === 'true';
  } catch {
    // ignore
  }
  return window.innerWidth <= 1024;
}

class Store {
  private state: AppState = {
    authenticated: false,
    introPlaying: false,
    currentPlanet: 'earth',
    travel: {
      active: false,
      phase: 'idle',
      fromPlanet: 'earth',
      toPlanet: 'earth',
      distanceAU: 0,
      distanceKm: 0,
      durationMs: 1100,
      progress: 1
    },
    sidebarCollapsed: getInitialSidebarCollapsed(),
    mobileSheetExpanded: false,
    exploreModeOverlayHidden: false,
    reducedMotion: getInitialReducedMotion(),
    assistantStyle: getInitialAssistantStyle(),
    assistantMood: 'neutral',
    assistantMessage: 'Awaiting operator authentication key.',
    greetedInSession: false,
    modules: [...INITIAL_MODULES],
    services: [...INITIAL_SERVICES],
    activities: [...INITIAL_ACTIVITIES],
    account: { ...INITIAL_ACCOUNT },
    liveNotification: ''
  };

  private listeners: Set<Listener> = new Set();

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public update(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }

  public setAssistantStyle(style: AssistantStyle): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STYLE, style);
    } catch {
      // ignore
    }
    this.update({
      assistantStyle: style,
      liveNotification: `Assistant rendering switched to ${style} mode.`
    });
  }

  public setReducedMotion(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MOTION, String(enabled));
    } catch {
      // ignore
    }
    this.update({
      reducedMotion: enabled,
      liveNotification: `Reduced motion ${enabled ? 'enabled' : 'disabled'}.`
    });
  }

  public setSidebarCollapsed(collapsed: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, String(collapsed));
    } catch {
      // ignore
    }
    this.update({ sidebarCollapsed: collapsed });
  }

  public logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    const newEvt: ActivityEvent = {
      ...event,
      id: `act-${Date.now().toString(36)}`,
      timestamp: `${hh}:${mm}:${ss} UTC`
    };
    this.update({
      activities: [newEvt, ...this.state.activities]
    });
  }

  public startPlanetTransition(target: PlanetId): {
    distanceAU: number;
    distanceKm: number;
    durationMs: number;
  } {
    const current = this.state.travel.active ? this.state.travel.toPlanet : this.state.currentPlanet;
    const dist = computeInterplanetaryDistance(current, target);
    const durationMs = this.state.reducedMotion ? 320 : dist.travelDurationMs;

    this.update({
      exploreModeOverlayHidden: target === 'saturn',
      travel: {
        active: true,
        phase: 'departing',
        fromPlanet: current,
        toPlanet: target,
        distanceAU: dist.distanceAU,
        distanceKm: dist.distanceKm,
        durationMs,
        progress: 0
      },
      liveNotification: `Transit initiated from ${current.toUpperCase()} to ${target.toUpperCase()} (${dist.distanceAU.toFixed(2)} AU).`
    });

    return {
      distanceAU: dist.distanceAU,
      distanceKm: dist.distanceKm,
      durationMs
    };
  }
}

export const appStore = new Store();
