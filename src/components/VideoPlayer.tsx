import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, PictureInPicture2, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer = ({
  src,
  title,
  poster,
  onProgress,
  onComplete,
  initialTime = 0,
  className,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiP, setIsPiP] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const completedRef = useRef(false);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialTime > 0 && initialTime < video.duration) {
        video.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgress?.(progress, video.currentTime);
      if (progress >= 90 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((buffEnd / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [initialTime, onProgress, onComplete, isSeeking]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
    else resetControlsTimer();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying, resetControlsTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // PiP change listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePiPEnter = () => setIsPiP(true);
    const handlePiPLeave = () => setIsPiP(false);
    video.addEventListener('enterpictureinpicture', handlePiPEnter);
    video.addEventListener('leavepictureinpicture', handlePiPLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPEnter);
      video.removeEventListener('leavepictureinpicture', handlePiPLeave);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'p':
          if (e.shiftKey) {
            e.preventDefault();
            togglePiP();
          }
          break;
        case ',':
          e.preventDefault();
          cycleSpeed(-1);
          break;
        case '.':
          e.preventDefault();
          cycleSpeed(1);
          break;
      }
      resetControlsTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, playbackSpeed, isPlaying, resetControlsTimer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const time = (value[0] / 100) * duration;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (val: number) => {
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const handleVolumeChange = (value: number[]) => changeVolume(value[0] / 100);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const setSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const cycleSpeed = (direction: number) => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const next = Math.max(0, Math.min(PLAYBACK_SPEEDS.length - 1, idx + direction));
    setSpeed(PLAYBACK_SPEEDS[next]);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (e) {
      console.warn('PiP not supported', e);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black rounded-lg overflow-hidden group select-none", className)}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Center play overlay when paused */}
      {!isPlaying && !showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer" onClick={togglePlay}>
          <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-10 w-10 text-primary-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Tap to play center icon (always visible when paused) */}
      {!isPlaying && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-primary/80 flex items-center justify-center shadow-2xl backdrop-blur-sm">
            <Play className="h-10 w-10 text-primary-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Resume indicator */}
      {initialTime > 0 && currentTime < 2 && !isPlaying && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          Resuming from {formatTime(initialTime)}
        </div>
      )}

      {/* Speed indicator (briefly shown) */}
      {playbackSpeed !== 1 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          {playbackSpeed}x
        </div>
      )}

      {/* PiP badge */}
      {isPiP && (
        <div className="absolute top-4 left-4 bg-primary/80 text-primary-foreground text-xs px-3 py-1.5 rounded-full">
          Picture-in-Picture
        </div>
      )}

      {/* Controls overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-4 transition-all duration-300",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        {/* Progress bar */}
        <div className="relative mb-3 group/progress">
          <div className="absolute h-1 bg-white/20 rounded-full w-full" />
          <div className="absolute h-1 bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            onPointerDown={() => setIsSeeking(true)}
            onPointerUp={() => setIsSeeking(false)}
            max={100}
            step={0.1}
            className="cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg"
          />
          {/* Time tooltip on hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20 h-9 w-9">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 h-10 w-10">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20 h-9 w-9">
              <SkipForward className="h-5 w-5" />
            </Button>
            <span className="text-white/90 text-sm ml-2 font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Volume */}
            <div className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20 h-9 w-9">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                showVolumeSlider ? "w-20 opacity-100 ml-1" : "w-0 opacity-0"
              )}>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>
            </div>

            {/* Speed selector */}
            <DropdownMenu open={showSpeedMenu} onOpenChange={setShowSpeedMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-9 px-2 text-xs font-mono">
                  <Gauge className="h-4 w-4 mr-1" />
                  {playbackSpeed}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[100px]">
                {PLAYBACK_SPEEDS.map(speed => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => setSpeed(speed)}
                    className={cn("text-sm justify-center font-mono", playbackSpeed === speed && "bg-primary/10 text-primary font-bold")}
                  >
                    {speed}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PiP */}
            {'pictureInPictureEnabled' in document && (
              <Button variant="ghost" size="icon" onClick={togglePiP} className={cn("text-white hover:bg-white/20 h-9 w-9", isPiP && "text-primary")}>
                <PictureInPicture2 className="h-5 w-5" />
              </Button>
            )}

            {/* Fullscreen */}
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 h-9 w-9">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Title */}
        <p className="text-white/70 text-xs mt-2 truncate">{title}</p>
      </div>
    </div>
  );
};
