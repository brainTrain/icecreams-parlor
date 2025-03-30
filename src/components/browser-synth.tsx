import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const NOTES = {
  a: 261.63, // C4
  s: 293.66, // D4
  d: 329.63, // E4
  f: 349.23, // F4
  g: 392.0, // G4
  h: 440.0, // A4
  j: 493.88, // B4
  k: 523.25, // C5
};

const SynthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Keyboard = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const Key = styled.button`
  width: 60px;
  height: 200px;
  background: linear-gradient(to bottom, #ffffff, #f0f0f0);
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.2rem;
  color: #333;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1rem;

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
  const oscillator = useRef<OscillatorNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize audio context
    audioContext.current = new AudioContext();
    gainNode.current = audioContext.current.createGain();
    gainNode.current.gain.value = 0.3;
    gainNode.current.connect(audioContext.current.destination);

    // Cleanup
    return () => {
      if (oscillator.current) {
        oscillator.current.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const startNote = (frequency: number) => {
    if (!audioContext.current || !gainNode.current) return;

    oscillator.current = audioContext.current.createOscillator();
    oscillator.current.type = 'sine';
    oscillator.current.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    oscillator.current.connect(gainNode.current);
    oscillator.current.start();
    setIsPlaying(true);
  };

  const stopNote = () => {
    if (oscillator.current) {
      oscillator.current.stop();
      oscillator.current = null;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const note = NOTES[e.key.toLowerCase() as keyof typeof NOTES];
      if (note && !isPlaying) {
        startNote(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in NOTES) {
        stopNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  return (
    <SynthContainer>
      <Keyboard>
        {Object.entries(NOTES).map(([key, frequency]) => (
          <Key
            key={key}
            onMouseDown={() => startNote(frequency)}
            onMouseUp={stopNote}
            onMouseLeave={stopNote}
          >
            {key.toUpperCase()}
          </Key>
        ))}
      </Keyboard>
      <Instructions>
        <p>Click the keys or use your keyboard (A-K) to play notes!</p>
      </Instructions>
    </SynthContainer>
  );
}
