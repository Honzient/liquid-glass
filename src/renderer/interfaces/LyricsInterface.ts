/* ──────────────────────────────────────────────────────────────
   Lyrics Interface — stub for future Spotify lyrics integration.

   When implemented:
     - Connect to Spotify Web API / Web Playback SDK
     - Fetch synced lyrics for currently playing track
     - Feed lyric lines into the typewriter animation
     - Handle lyric timing (word-level or line-level sync)
   ───────────────────────────────────────────────────────────── */

/** A single lyric line with optional timing */
export interface LyricLine {
  /** The lyric text for this line */
  text: string;
  /** Start time in milliseconds (from song beginning) */
  startMs: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Optional word-level tokens for karaoke-style highlighting */
  words?: LyricWord[];
}

/** A single word token with timing */
export interface LyricWord {
  text: string;
  startMs: number;
  durationMs: number;
}

/** The full lyrics track with metadata */
export interface LyricsTrack {
  /** Song title */
  title: string;
  /** Artist name */
  artist: string;
  /** Synced lyric lines */
  lines: LyricLine[];
  /** Whether the lyrics are word-level synced */
  wordSynced: boolean;
  /** Source: "spotify" | "musixmatch" | "local" */
  source: string;
}

/** Callbacks for lyrics events */
export interface LyricsCallbacks {
  /** Fired when a new line becomes active */
  onLineChange: (line: LyricLine, index: number) => void;
  /** Fired when lyrics track is fully loaded */
  onReady: (track: LyricsTrack) => void;
  /** Fired on error */
  onError: (error: Error) => void;
}

/**
 * Stub: LyricsProvider interface.
 *
 * Implementations:
 *   - SpotifyLyricsProvider  — Spotify Web API + lyrics endpoint
 *   - MusixmatchProvider     — Musixmatch API
 *   - LocalLyricsProvider    — local .lrc file parser
 *   - DemoLyricsProvider     — hardcoded demo lyrics for testing
 */
export interface ILyricsProvider {
  /** Load lyrics for a track (Spotify track ID or search query) */
  load(trackId: string): Promise<LyricsTrack>;
  /** Get the lyric line at a given timestamp (ms) */
  getLineAt(ms: number): LyricLine | null;
  /** Subscribe to lyric line changes */
  on(event: "lineChange", cb: (line: LyricLine, index: number) => void): void;
  on(event: "ready", cb: (track: LyricsTrack) => void): void;
  on(event: "error", cb: (error: Error) => void): void;
  /** Clean up */
  dispose(): void;
}
