import { useState } from "react";

/* ──────────────────────────────────────────────────────────────
   Control Panel — HTML overlay above the 3D glass canvas.

   Current state: UI layout placeholder.
   TODO (Phase 2): connect real audio meters + lyrics info.
   ───────────────────────────────────────────────────────────── */

type PanelTab = "audio" | "lyrics" | "info";

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1000,
  fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  userSelect: "none",
};

const PANEL_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "14px 22px",
  background: "rgba(8, 12, 24, 0.78)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 14,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  color: "rgba(255, 255, 255, 0.65)",
  fontSize: 12,
  minWidth: 280,
  transition: "all 0.3s",
};

const TABS_STYLE: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginBottom: 2,
};

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "4px 12px",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: active ? "rgba(255,255,255,0.14)" : "transparent",
  color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
  transition: "all 0.2s",
});

const SECTION_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.4)",
  lineHeight: 1.6,
};

const EMPTY_SLOT_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px dashed rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  fontSize: 11,
  color: "rgba(255,255,255,0.3)",
  fontStyle: "italic",
};

const TOGGLE_STYLE: React.CSSProperties = {
  position: "fixed" as const,
  bottom: 16,
  right: 16,
  zIndex: 1001,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(8,12,24,0.7)",
  color: "rgba(255,255,255,0.5)",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(10px)",
};

export default function ControlPanel() {
  const [tab, setTab] = useState<PanelTab>("audio");
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        style={TOGGLE_STYLE}
        onClick={() => setVisible(true)}
        title="Show panel"
      >
        +
      </button>
    );
  }

  return (
    <>
      <button
        style={{ ...TOGGLE_STYLE, right: 16, bottom: 16 }}
        onClick={() => setVisible(false)}
        title="Hide panel"
      >
        ×
      </button>

      <div style={OVERLAY_STYLE}>
        <div style={PANEL_STYLE}>
          {/* Tabs */}
          <div style={TABS_STYLE}>
            {(["audio", "lyrics", "info"] as PanelTab[]).map((t) => (
              <button key={t} style={TAB_STYLE(tab === t)} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Audio tab */}
          {tab === "audio" && (
            <div style={SECTION_STYLE}>
              <div style={EMPTY_SLOT_STYLE}>
                <span>🎵</span>
                <span>
                  Audio interface stub — connect Spotify or system audio
                </span>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
                <span>Bass: —</span>
                <span>Energy: —</span>
                <span>Treble: —</span>
              </div>
            </div>
          )}

          {/* Lyrics tab */}
          {tab === "lyrics" && (
            <div style={SECTION_STYLE}>
              <div style={EMPTY_SLOT_STYLE}>
                <span>📝</span>
                <span>
                  Lyrics interface stub — connect Spotify / Musixmatch
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                No track loaded
              </div>
            </div>
          )}

          {/* Info tab */}
          {tab === "info" && (
            <div style={SECTION_STYLE}>
              <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                Liquid Glass Lyrics
              </div>
              <div>Render: FBO + SDF screen-space refraction</div>
              <div>Glass: Schlick Fresnel + 7-layer dispersion</div>
              <div>Fluid: 5-wave Gerstner summation</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.25)" }}>
                v2.0 — Electron + R3F + Three.js
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
