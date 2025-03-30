import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const BASE_FREQUENCIES = {
  a: 261.63, // C4
  s: 293.66, // D4
  d: 329.63, // E4
  f: 349.23, // F4
  g: 392.0, // G4
  h: 440.0, // A4
  j: 493.88, // B4
  k: 523.25, // C5
};

type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface SynthParams {
  waveform: WaveformType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const SynthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  width: 100%;
  justify-content: center;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
`;

const KnobContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const KnobValue = styled.div`
  color: #ffffff;
  font-size: 0.8rem;
  text-align: center;
  min-width: 40px;
`;

const Knob = styled.div<{ $value: number; $isDragging?: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => (props.$isDragging ? '#4a4a4a' : '#3a3a3a')};
  position: relative;
  cursor: pointer;
  box-shadow: ${props => (props.$isDragging ? '0 0 10px rgba(255,255,255,0.2)' : 'none')};
  transition: background 0.2s ease;
  touch-action: none;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 25px;
    background: #fff;
    transform-origin: bottom center;
    transform: translate(-50%, -100%) rotate(${props => props.$value * 270}deg);
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 45px;
    height: 45px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
`;

const KnobLabel = styled.div`
  color: #ffffff;
  font-size: 0.8rem;
  text-align: center;
`;

const OctaveControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ffffff;
`;

const OctaveButton = styled.button`
  background: #3a3a3a;
  border: none;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;

  &:hover {
    background: #4a4a4a;
  }
`;

const Keyboard = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 2rem;
  width: 100%;
  overflow-x: auto;
  padding: 0.5rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Key = styled.button<{ $isActive?: boolean }>`
  width: 45px;
  height: 150px;
  background: ${props =>
    props.$isActive
      ? 'linear-gradient(to bottom, #e0e0e0, #d0d0d0)'
      : 'linear-gradient(to bottom, #ffffff, #f0f0f0)'};
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.5rem;
  transform: ${props => (props.$isActive ? 'translateY(2px)' : 'none')};
  touch-action: none;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
  }

  &:active {
    transform: translateY(2px);
    background: linear-gradient(to bottom, #e0e0e0, #d0d0d0);
  }
`;

const Instructions = styled.div`
  color: #ffffff;
  text-align: center;
  font-size: 1.1rem;
  opacity: 0.8;
`;

export default function BrowserSynth() {
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<{ [key: string]: OscillatorNode }>({});
  const gainNodes = useRef<{ [key: string]: GainNode }>({});
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [octave, setOctave] = useState(4);
  const [synthParams, setSynthParams] = useState<SynthParams>({
    waveform: 'sine',
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.2,
  });
  const [isAudioReady, setIsAudioReady] = useState(false);

  const [draggingKnob, setDraggingKnob] = useState<keyof SynthParams | null>(null);
  const knobRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const startY = useRef(0);
  const startValue = useRef(0);

  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
      setIsAudioReady(true);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(oscillators.current).forEach(osc => osc.stop());
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const getFrequency = (baseFreq: number) => {
    const octaveDiff = octave - 4;
    return baseFreq * Math.pow(2, octaveDiff);
  };

  const startNote = (key: string, frequency: number) => {
    if (!audioContext.current) {
      initializeAudio();
    }

    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.type = synthParams.waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

    // Apply ADSR envelope
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.current.currentTime + synthParams.attack);
    gainNode.gain.linearRampToValueAtTime(
      synthParams.sustain,
      audioContext.current.currentTime + synthParams.attack + synthParams.decay
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.start();
    oscillators.current[key] = oscillator;
    gainNodes.current[key] = gainNode;
    setActiveKeys(prev => new Set([...prev, key]));
  };

  const stopNote = (key: string) => {
    if (oscillators.current[key] && gainNodes.current[key] && audioContext.current) {
      const gainNode = gainNodes.current[key];
      gainNode.gain.cancelScheduledValues(audioContext.current.currentTime);
      gainNode.gain.setTargetAtTime(0, audioContext.current.currentTime, synthParams.release);

      setTimeout(() => {
        oscillators.current[key].stop();
        delete oscillators.current[key];
        delete gainNodes.current[key];
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, synthParams.release * 1000);
    }
  };

  const handleKnobChange = (param: keyof SynthParams, value: number | WaveformType) => {
    setSynthParams(prev => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleWaveformChange = () => {
    const waveforms: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];
    const currentIndex = waveforms.indexOf(synthParams.waveform);
    const nextIndex = (currentIndex + 1) % waveforms.length;
    handleKnobChange('waveform', waveforms[nextIndex]);
  };

  const handleKnobStart = (param: keyof SynthParams, e: React.MouseEvent | React.TouchEvent) => {
    if (param === 'waveform') {
      handleWaveformChange();
      return;
    }
    setDraggingKnob(param);
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startValue.current = synthParams[param] as number;
  };

  const handleKnobMove = (e: MouseEvent | TouchEvent) => {
    if (!draggingKnob || draggingKnob === 'waveform') return;

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = (startY.current - currentY) / 200; // Adjust sensitivity here
    const newValue = Math.max(0, Math.min(1, startValue.current + delta));

    handleKnobChange(draggingKnob, newValue);
  };

  const handleKnobEnd = () => {
    setDraggingKnob(null);
  };

  useEffect(() => {
    if (draggingKnob) {
      window.addEventListener('mousemove', handleKnobMove);
      window.addEventListener('mouseup', handleKnobEnd);
      window.addEventListener('touchmove', handleKnobMove);
      window.addEventListener('touchend', handleKnobEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleKnobMove);
      window.removeEventListener('mouseup', handleKnobEnd);
      window.removeEventListener('touchmove', handleKnobMove);
      window.removeEventListener('touchend', handleKnobEnd);
    };
  }, [draggingKnob]);

  const formatValue = (param: keyof SynthParams, value: number | WaveformType) => {
    if (param === 'waveform') return value as string;
    return (value as number).toFixed(1);
  };

  const getWaveformValue = (waveform: WaveformType) => {
    const waveforms: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];
    return waveforms.indexOf(waveform) / (waveforms.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const baseFreq = BASE_FREQUENCIES[key as keyof typeof BASE_FREQUENCIES];
      if (baseFreq && !activeKeys.has(key)) {
        startNote(key, getFrequency(baseFreq));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in BASE_FREQUENCIES) {
        stopNote(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, octave, synthParams]);

  const handleKnobRef = (param: keyof SynthParams) => (el: HTMLDivElement | null) => {
    if (el) {
      knobRefs.current[param] = el;
    }
  };

  return (
    <SynthContainer>
      {!isAudioReady && (
        <Instructions>
          <p>Tap anywhere to start the synthesizer</p>
        </Instructions>
      )}
      <Controls>
        <ControlGroup>
          <KnobLabel>Waveform</KnobLabel>
          <KnobContainer>
            <Knob
              ref={handleKnobRef('waveform')}
              $value={getWaveformValue(synthParams.waveform)}
              $isDragging={false}
              onClick={handleWaveformChange}
            />
            <KnobValue>{synthParams.waveform}</KnobValue>
          </KnobContainer>
        </ControlGroup>
        <ControlGroup>
          <KnobLabel>Attack</KnobLabel>
          <KnobContainer>
            <Knob
              ref={handleKnobRef('attack')}
              $value={synthParams.attack}
              $isDragging={draggingKnob === 'attack'}
              onMouseDown={e => handleKnobStart('attack', e)}
              onTouchStart={e => handleKnobStart('attack', e)}
            />
            <KnobValue>{formatValue('attack', synthParams.attack)}</KnobValue>
          </KnobContainer>
        </ControlGroup>
        <ControlGroup>
          <KnobLabel>Decay</KnobLabel>
          <KnobContainer>
            <Knob
              ref={handleKnobRef('decay')}
              $value={synthParams.decay}
              $isDragging={draggingKnob === 'decay'}
              onMouseDown={e => handleKnobStart('decay', e)}
              onTouchStart={e => handleKnobStart('decay', e)}
            />
            <KnobValue>{formatValue('decay', synthParams.decay)}</KnobValue>
          </KnobContainer>
        </ControlGroup>
        <ControlGroup>
          <KnobLabel>Sustain</KnobLabel>
          <KnobContainer>
            <Knob
              ref={handleKnobRef('sustain')}
              $value={synthParams.sustain}
              $isDragging={draggingKnob === 'sustain'}
              onMouseDown={e => handleKnobStart('sustain', e)}
              onTouchStart={e => handleKnobStart('sustain', e)}
            />
            <KnobValue>{formatValue('sustain', synthParams.sustain)}</KnobValue>
          </KnobContainer>
        </ControlGroup>
        <ControlGroup>
          <KnobLabel>Release</KnobLabel>
          <KnobContainer>
            <Knob
              ref={handleKnobRef('release')}
              $value={synthParams.release}
              $isDragging={draggingKnob === 'release'}
              onMouseDown={e => handleKnobStart('release', e)}
              onTouchStart={e => handleKnobStart('release', e)}
            />
            <KnobValue>{formatValue('release', synthParams.release)}</KnobValue>
          </KnobContainer>
        </ControlGroup>
        <OctaveControl>
          <OctaveButton onClick={() => setOctave(prev => Math.max(0, prev - 1))}>-</OctaveButton>
          <span>Octave {octave}</span>
          <OctaveButton onClick={() => setOctave(prev => Math.min(8, prev + 1))}>+</OctaveButton>
        </OctaveControl>
      </Controls>
      <Keyboard>
        {Object.entries(BASE_FREQUENCIES).map(([key, baseFreq]) => (
          <Key
            key={key}
            $isActive={activeKeys.has(key)}
            onTouchStart={() => startNote(key, getFrequency(baseFreq))}
            onTouchEnd={() => stopNote(key)}
            onMouseDown={() => startNote(key, getFrequency(baseFreq))}
            onMouseUp={() => stopNote(key)}
            onMouseLeave={() => stopNote(key)}
          >
            {key.toUpperCase()}
          </Key>
        ))}
      </Keyboard>
      {isAudioReady && (
        <Instructions>
          <p>Tap the keys or use your keyboard (A-K) to play notes!</p>
          <p>Use the knobs to adjust the synth parameters</p>
          <p>Change octave with + and - buttons</p>
        </Instructions>
      )}
    </SynthContainer>
  );
}
