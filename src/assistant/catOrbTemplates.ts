import { AssistantStyle, AssistantMood } from '../state/store';

export const PIXEL_ORB_SVG = `
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Pixel Cat Orb Assistant">
  <g class="orb-core">
    <g class="ears-group">
      <g class="ear-left">
        <path fill="var(--text-primary)" d="M6,5 h2 v1 h1 v1 h1 v2 h-4 v-4 z"></path>
        <path fill="var(--text-secondary)" d="M7,6 h1 v2 h-1 v-2 z"></path>
      </g>
      <g class="ear-right">
        <path fill="var(--text-primary)" d="M24,5 h2 v4 h-4 v-2 h1 v-1 h1 v-1 z"></path>
        <path fill="var(--text-secondary)" d="M24,6 h1 v2 h-1 v-2 z"></path>
      </g>
    </g>
    <path fill="var(--text-muted)" d="M11,6 h10 v1 h3 v1 h2 v2 h1 v2 h1 v9 h-1 v2 h-1 v2 h-2 v1 h-3 v1 h-10 v-1 h-3 v-1 h-2 v-2 h-1 v-2 h-1 v-9 h1 v-2 h1 v-2 h2 v-1 h3 v-1 z"></path>
    <path fill="var(--accent-fg)" d="M11,7 h10 v1 h3 v1 h1 v2 h1 v9 h-1 v2 h-1 v1 h-3 v1 h-10 v-1 h-3 v-1 h-1 v-2 h-1 v-9 h1 v-2 h1 v-1 h3 v-1 z"></path>
    <path fill="var(--text-secondary)" opacity="0.35" d="M9,9 h2 v1 h-2 v1 h-1 v-1 h1 v-1 z"></path>
    <g class="fx-item fx-blush">
      <rect x="7" y="18" width="3" height="1" fill="var(--status-danger)"></rect>
      <rect x="22" y="18" width="3" height="1" fill="var(--status-danger)"></rect>
    </g>
    <g class="eye-tracker">
      <g class="eye-default">
        <g class="eye-left" style="transform-origin: 12px 16px;">
          <path fill="var(--text-primary)" d="M11,14 h2 v4 h-2 v-4 z M10,15 h4 v2 h-4 v-2 z"></path>
        </g>
        <g class="eye-right" style="transform-origin: 20px 16px;">
          <path fill="var(--text-primary)" d="M19,14 h2 v4 h-2 v-4 z M18,15 h4 v2 h-4 v-2 z"></path>
        </g>
      </g>
      <g class="fx-item eye-heart">
        <path fill="var(--status-danger)" d="M10,14 h2 v1 h2 v-1 h2 v2 h-1 v1 h-1 v1 h-2 v-1 h-1 v-1 h-1 v-2 z"></path>
        <path fill="var(--status-danger)" d="M18,14 h2 v1 h2 v-1 h2 v2 h-1 v1 h-1 v1 h-2 v-1 h-1 v-1 h-1 v-2 z"></path>
      </g>
      <g class="fx-item eye-cross">
        <path d="M10,14 h1 v1 h2 v-1 h1 v1 h-1 v2 h1 v1 h-1 v-1 h-2 v1 h-1 v-1 h1 v-2 h-1 v-1 z"></path>
        <path d="M18,14 h1 v1 h2 v-1 h1 v1 h-1 v2 h1 v1 h-1 v-1 h-2 v1 h-1 v-1 h1 v-2 h-1 v-1 z"></path>
      </g>
      <g class="fx-item fx-glasses">
        <path fill="var(--text-primary)" d="M6,14 h20 v1 h-1 v3 h-6 v-2 h-2 v2 h-6 v-3 h-5 v-1 z"></path>
        <rect x="9" y="15" width="4" height="2" fill="var(--accent-fg)"></rect>
        <rect x="19" y="15" width="4" height="2" fill="var(--accent-fg)"></rect>
        <rect x="9" y="15" width="2" height="1" fill="var(--text-primary)"></rect>
        <rect x="19" y="15" width="2" height="1" fill="var(--text-primary)"></rect>
      </g>
    </g>
    <g class="fx-item fx-tears">
      <rect x="10" y="19" width="2" height="3" fill="var(--text-secondary)"></rect>
      <rect x="20" y="19" width="2" height="3" fill="var(--text-secondary)"></rect>
    </g>
    <g class="fx-item fx-sweat">
      <path fill="var(--text-secondary)" d="M26,10 h1 v2 h-2 v-1 h1 v-1 z"></path>
    </g>
    <g class="fx-item fx-anger-vein">
      <path fill="var(--status-danger)" d="M23,8 h1 v1 h1 v1 h-2 v-2 z M21,10 h2 v2 h-1 v-1 h-1 v-1 z"></path>
    </g>
    <g class="fx-item fx-annoyed-lines">
      <rect x="24" y="8" width="1" height="4" fill="var(--text-muted)"></rect>
      <rect x="26" y="8" width="1" height="5" fill="var(--text-muted)"></rect>
      <rect x="28" y="9" width="1" height="4" fill="var(--text-muted)"></rect>
    </g>
  </g>
  <g class="fx-item fx-sparkles">
    <path fill="var(--status-warn)" d="M3,8 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 v-1 z"></path>
    <path fill="var(--status-warn)" d="M27,6 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 v-1 z"></path>
  </g>
  <g class="fx-item fx-zzz">
    <path fill="var(--text-secondary)" d="M24,6 h3 v1 h-2 v1 h2 v1 h-3 v-1 h2 v-1 h-2 v-1 z"></path>
    <path fill="var(--text-primary)" d="M28,2 h3 v1 h-2 v1 h2 v1 h-3 v-1 h2 v-1 h-2 v-1 z"></path>
  </g>
  <g class="fx-item fx-exclaim">
    <rect x="15" y="1" width="2" height="3" fill="var(--status-warn)"></rect>
    <rect x="15" y="5" width="2" height="1" fill="var(--status-warn)"></rect>
  </g>
  <g class="fx-item fx-question">
    <path fill="var(--text-primary)" d="M24,2 h3 v2 h-1 v1 h-1 v-1 h1 v-1 h-2 v-1 z M25,6 h1 v1 h-1 v-1 z"></path>
  </g>
  <g class="fx-item fx-thought">
    <rect x="23" y="6" width="1" height="1" fill="var(--text-secondary)"></rect>
    <rect x="25" y="4" width="2" height="2" fill="var(--text-primary)"></rect>
    <rect x="28" y="1" width="3" height="3" fill="var(--text-primary)"></rect>
  </g>
  <g class="fx-item fx-sound-waves">
    <path fill="var(--status-ok)" d="M2,14 h1 v4 h-1 v-4 z M4,15 h1 v2 h-1 v-2 z"></path>
    <path fill="var(--status-ok)" d="M29,14 h1 v4 h-1 v-4 z M27,15 h1 v2 h-1 v-2 z"></path>
  </g>
  <g class="fx-item fx-warning">
    <path fill="var(--status-danger)" d="M15,1 h2 v1 h1 v2 h-4 v-2 h1 v-1 z"></path>
    <rect x="15" y="2" width="2" height="1" fill="var(--accent-fg)"></rect>
  </g>
</svg>
`;
