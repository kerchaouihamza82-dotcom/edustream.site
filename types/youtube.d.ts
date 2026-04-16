interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(id: string): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, opts: object) => YTPlayerInstance;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

