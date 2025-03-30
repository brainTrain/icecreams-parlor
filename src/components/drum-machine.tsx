import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

type DrumSound = 'kick' | 'snare' | 'hihat' | 'clap';

interface DrumPadProps {
  $isActive: boolean;
}

const DrumMachineContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const DrumPads = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 400px;
`;

const DrumPad = styled.button<DrumPadProps>`
  aspect-ratio: 1;
  background: ${props => (props.$isActive ? '#4a4a4a' : '#2a2a2a')};
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  box-shadow: ${props => (props.$isActive ? '0 0 10px rgba(255,255,255,0.2)' : 'none')};
  touch-action: none;

  &:active {
    transform: scale(0.95);
  }
`;

const SequencerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SequencerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SoundLabel = styled.div`
  color: white;
  font-size: 0.8rem;
  text-transform: uppercase;
  min-width: 4rem;
  text-align: right;
`;

const StepsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Step = styled.button<{ $isActive: boolean; $isCurrent: boolean }>`
  width: 30px;
  height: 30px;
  background: ${props => {
    if (props.$isCurrent) return '#2a6f97';
    return props.$isActive ? '#48cae4' : '#3a3a3a';
  }};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.1s ease;
  touch-action: none;
  position: relative;

  &:active {
    transform: scale(0.95);
  }

  &:hover {
    background: ${props => {
      if (props.$isCurrent) return '#3a8fb7';
      return props.$isActive ? '#58daf4' : '#4a4a4a';
    }};
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ControlButton = styled.button`
  background: #3a3a3a;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: #4a4a4a;
  }
`;

const TempoControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
`;

const TempoValue = styled.span`
  min-width: 3rem;
  text-align: center;
`;

export default function DrumMachine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<{ [key in DrumSound]: boolean[] }>({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    clap: Array(16).fill(false),
  });
  const [activePads, setActivePads] = useState<Set<DrumSound>>(new Set());
  const audioContext = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize audio context
  useEffect(() => {
    try {
      audioContext.current = new AudioContext();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Playback logic
  useEffect(() => {
    if (!isPlaying || !audioContext.current) return;

    const stepInterval = (60 * 1000) / tempo / 2; // 16th note
    intervalRef.current = window.setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 16);
    }, stepInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, tempo]);

  // Play sounds on step
  useEffect(() => {
    if (!isPlaying || !audioContext.current) return;

    const playStep = () => {
      Object.entries(steps).forEach(([sound, pattern]) => {
        if (pattern[currentStep]) {
          playSound(sound as DrumSound);
        }
      });
    };

    playStep();
  }, [currentStep, isPlaying, steps]);

  const createKick = () => {
    if (!audioContext.current) return;

    const now = audioContext.current.currentTime;
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    oscillator.connect(gainNode);

    gainNode.gain.setValueAtTime(1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    gainNode.connect(audioContext.current.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  };

  const createSnare = () => {
    if (!audioContext.current) return;

    const now = audioContext.current.currentTime;
    const noise = audioContext.current.createBufferSource();
    const noiseGain = audioContext.current.createGain();
    const oscillator = audioContext.current.createOscillator();
    const oscillatorGain = audioContext.current.createGain();

    // Create noise
    const bufferSize = audioContext.current.sampleRate * 0.1;
    const buffer = audioContext.current.createBuffer(
      1,
      bufferSize,
      audioContext.current.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Noise envelope
    noise.connect(noiseGain);
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noiseGain.connect(audioContext.current.destination);

    // Oscillator
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
    oscillator.connect(oscillatorGain);
    oscillatorGain.gain.setValueAtTime(0.7, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    oscillatorGain.connect(audioContext.current.destination);

    noise.start(now);
    noise.stop(now + 0.2);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  const createHihat = () => {
    if (!audioContext.current) return;

    const now = audioContext.current.currentTime;
    const noise = audioContext.current.createBufferSource();
    const noiseGain = audioContext.current.createGain();
    const filter = audioContext.current.createBiquadFilter();

    // Create noise
    const bufferSize = audioContext.current.sampleRate * 0.1;
    const buffer = audioContext.current.createBuffer(
      1,
      bufferSize,
      audioContext.current.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Filter
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    // Envelope
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noiseGain.connect(audioContext.current.destination);

    noise.start(now);
    noise.stop(now + 0.1);
  };

  const createClap = () => {
    if (!audioContext.current) return;

    const now = audioContext.current.currentTime;
    const noise = audioContext.current.createBufferSource();
    const noiseGain = audioContext.current.createGain();
    const filter = audioContext.current.createBiquadFilter();

    // Create noise
    const bufferSize = audioContext.current.sampleRate * 0.1;
    const buffer = audioContext.current.createBuffer(
      1,
      bufferSize,
      audioContext.current.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Filter
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 10;

    // Envelope
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noiseGain.connect(audioContext.current.destination);

    noise.start(now);
    noise.stop(now + 0.2);
  };

  const playSound = (sound: DrumSound) => {
    switch (sound) {
      case 'kick':
        createKick();
        break;
      case 'snare':
        createSnare();
        break;
      case 'hihat':
        createHihat();
        break;
      case 'clap':
        createClap();
        break;
    }

    setActivePads(prev => new Set([...prev, sound]));
    setTimeout(() => {
      setActivePads(prev => {
        const newSet = new Set(prev);
        newSet.delete(sound);
        return newSet;
      });
    }, 100);
  };

  const toggleStep = (sound: DrumSound, step: number) => {
    setSteps(prev => ({
      ...prev,
      [sound]: prev[sound].map((active, i) => (i === step ? !active : active)),
    }));
  };

  const resetPlayback = () => {
    setCurrentStep(0);
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 0);
    }
  };

  return (
    <DrumMachineContainer>
      <Controls>
        <ControlButton onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Stop' : 'Play'}
        </ControlButton>
        <ControlButton onClick={resetPlayback}>Reset</ControlButton>
        <TempoControl>
          <ControlButton onClick={() => setTempo(prev => Math.max(60, prev - 5))}>-</ControlButton>
          <TempoValue>{tempo} BPM</TempoValue>
          <ControlButton onClick={() => setTempo(prev => Math.min(200, prev + 5))}>+</ControlButton>
        </TempoControl>
      </Controls>

      <DrumPads>
        {(['kick', 'snare', 'hihat', 'clap'] as DrumSound[]).map(sound => (
          <DrumPad
            key={sound}
            $isActive={activePads.has(sound)}
            onTouchStart={e => {
              e.preventDefault();
              playSound(sound);
            }}
            onTouchEnd={e => {
              e.preventDefault();
            }}
            onClick={() => playSound(sound)}
          >
            {sound}
          </DrumPad>
        ))}
      </DrumPads>

      <SequencerContainer>
        {(['kick', 'snare', 'hihat', 'clap'] as DrumSound[]).map(sound => (
          <SequencerRow key={sound}>
            <SoundLabel>{sound}</SoundLabel>
            <StepsContainer>
              {Array.from({ length: 16 }, (_, i) => (
                <Step
                  key={i}
                  $isActive={steps[sound][i]}
                  $isCurrent={currentStep === i}
                  onClick={() => toggleStep(sound, i)}
                  onTouchStart={e => {
                    e.preventDefault();
                    toggleStep(sound, i);
                  }}
                />
              ))}
            </StepsContainer>
          </SequencerRow>
        ))}
      </SequencerContainer>
    </DrumMachineContainer>
  );
}
