import { useState } from "react";

interface ControlPanelProps {
  bass: number;
  energy: number;
  treble: number;
  volume: number;
  beat: boolean;
  onSourceChange?: (source: "demo" | "mic" | "system") => void;
}

const PANEL_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: 16,
  padding: "12px 20px",
  background: "rgba(8, 12, 24, 0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 14,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  zIndex: 1000,
  fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  fontSize: 12,
  color: "rgba(255, 255, 255, 0.7)",
  userSelect: "none",
  transition: "opacity 0.4s",
};

const SLIDER_GROUP_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(255, 255, 255, 0.5)",
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.85)",
  minWidth: 32,
  textAlign: "center",
};

const SLIDER_STYLE: React.CSSProperties = {
  width: 80,
  height: 4,
  appearance: "none",
  WebkitAppearance: "none",
  background: "rgba(255, 255, 255, 0.15)",
  borderRadius: 2,
  outline: "none",
  cursor: "pointer",
};

const BEAT_INDICATOR_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.3)",
  transition: "background 0.08s, box-shadow 0.08s",
  marginTop: 4,
};

const BUTTON_GROUP_STYLE: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 10,
  borderRadius: 8,
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "rgba(255, 255, 255, 0.08)",
  color: "rgba(255, 255, 255, 0.6)",
  cursor: "pointer",
  transition: "all 0.2s",
};

/**
 * HTML overlay control panel.
 * Shows real-time audio band values as non-interactive meters.
 * Demo-only: sliders are display-only (audio comes from engine).
 */
export default function ControlPanel({
  bass,
  energy,
  treble,
  volume,
  beat,
  onSourceChange,
}: ControlPanelProps) {
  const [source, setSource] = useState<"demo" | "mic" | "system">("demo");
  const [visible, setVisible] = useState(true);

  const handleSourceChange = (s: "demo" | "mic" | "system") => {
    setSource(s);
    onSourceChange?.(s);
  };

  if (!visible) return null;

  return (
    <>
      {/* Toggle visibility button */}
      <button
        onClick={() => setVisible(false)}
        style={{
          position: "fixed",
          bottom: 100,
          right: 16,
          zIndex: 1001,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          cursor: "pointer",
          padding: "3px 8px",
        }}
      >
        Hide Panel
      </button>

      <div style={PANEL_STYLE}>
        {/* Volume meter */}
        <div style={SLIDER_GROUP_STYLE}>
          <span style={LABEL_STYLE}>Vol</span>
          <span style={VALUE_STYLE}>{(volume * 100).toFixed(0)}%</span>
          <div
            style={{
              ...BEAT_INDICATOR_STYLE,
              background: beat ? "rgba(100, 200, 255, 0.9)" : "rgba(255,255,255,0.2)",
              boxShadow: beat ? "0 0 12px rgba(100, 180, 255, 0.6)" : "none",
            }}
          />
        </div>

        {/* Bass meter */}
        <div style={SLIDER_GROUP_STYLE}>
          <span style={LABEL_STYLE}>Bass</span>
          <span style={VALUE_STYLE}>{(bass * 100).toFixed(0)}%</span>
          <div
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}>
            <div
              style={{
                width: `${bass * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ff6b6b, #ff8e53)",
                borderRadius: 2,
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* Energy meter */}
        <div style={SLIDER_GROUP_STYLE}>
          <span style={LABEL_STYLE}>Energy</span>
          <span style={VALUE_STYLE}>{(energy * 100).toFixed(0)}%</span>
          <div
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}>
            <div
              style={{
                width: `${energy * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ffd93d, #6bcb77)",
                borderRadius: 2,
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* Treble meter */}
        <div style={SLIDER_GROUP_STYLE}>
          <span style={LABEL_STYLE}>Treble</span>
          <span style={VALUE_STYLE}>{(treble * 100).toFixed(0)}%</span>
          <div
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}>
            <div
              style={{
                width: `${treble * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4d96ff, #9b59b6)",
                borderRadius: 2,
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* Source selector */}
        <div style={BUTTON_GROUP_STYLE}>
          {(["demo", "mic", "system"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleSourceChange(s)}
              style={{
                ...BUTTON_STYLE,
                background:
                  source === s
                    ? "rgba(255, 255, 255, 0.18)"
                    : "rgba(255, 255, 255, 0.05)",
                color:
                  source === s
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(255, 255, 255, 0.4)",
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
