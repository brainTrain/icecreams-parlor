import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Peer, { DataConnection } from 'peerjs';

const ChorusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
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

const NoteButton = styled.button<{ $isActive: boolean }>`
  width: 60px;
  height: 60px;
  background: ${props => (props.$isActive ? '#4a4a4a' : '#3a3a3a')};
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

  &:hover {
    background: #4a4a4a;
  }
`;

const ToneControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: white;
`;

const ToneLabel = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
`;

const ToneSelect = styled.select`
  background: #3a3a3a;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #4a4a4a;
  }
`;

const ConnectionStatus = styled.div<{ $isConnected: boolean }>`
  color: ${props => (props.$isConnected ? '#4CAF50' : '#FF5252')};
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const PowerSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const SwitchContainer = styled.div`
  position: relative;
  width: 60px;
  height: 30px;
  background: #2a2a2a;
  border-radius: 15px;
  cursor: pointer;
  transition: background 0.2s ease;
`;

const SwitchButton = styled.div<{ $isOn: boolean }>`
  position: absolute;
  top: 2px;
  left: ${props => (props.$isOn ? '32px' : '2px')};
  width: 26px;
  height: 26px;
  background: #ffffff;
  border-radius: 50%;
  transition: left 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const LED = styled.div<{ $isOn: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => (props.$isOn ? '#4CAF50' : '#333333')};
  box-shadow: ${props =>
    props.$isOn ? '0 0 10px #4CAF50, 0 0 20px #4CAF50, 0 0 30px #4CAF50' : 'none'};
  transition: all 0.2s ease;
`;

const PowerLabel = styled.div`
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
`;

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TONES = ['sine', 'square', 'triangle', 'sawtooth'];

export default function Chorus() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('sine');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [peerId, setPeerId] = useState<string>('');
  const [connections, setConnections] = useState<DataConnection[]>([]);

  const peer = useRef<Peer | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const activeOscillator = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    // Initialize PeerJS
    peer.current = new Peer();

    peer.current.on('open', id => {
      console.log('My peer ID:', id);
      setPeerId(id);
    });

    peer.current.on('connection', conn => {
      console.log('Received connection from:', conn.peer);
      setIsConnected(true);
      setConnections(prev => [...prev, conn]);

      conn.on('data', (data: any) => {
        console.log('Received:', data);
        if (data.type === 'note' && isSoundEnabled) {
          if (data.isActive) {
            playNote(data.note, data.tone);
          } else {
            stopNote();
          }
        } else if (data.type === 'tone' && isSoundEnabled) {
          console.log('Received tone change:', data.tone);
          if (selectedNote) {
            playNote(selectedNote, data.tone);
          }
        }
      });

      conn.on('close', () => {
        console.log('Connection closed');
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
        if (connections.length === 0) {
          setIsConnected(false);
        }
      });
    });

    return () => {
      if (peer.current) {
        peer.current.destroy();
      }
      if (activeOscillator.current) {
        activeOscillator.current.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const toggleSound = async () => {
    if (!isSoundEnabled) {
      try {
        audioContext.current = new AudioContext();
        gainNode.current = audioContext.current.createGain();
        gainNode.current.gain.value = 0.3;
        gainNode.current.connect(audioContext.current.destination);
        await audioContext.current.resume();
        setIsSoundEnabled(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    } else {
      stopNote();
      if (audioContext.current) {
        await audioContext.current.close();
        audioContext.current = null;
      }
      setIsSoundEnabled(false);
    }
  };

  const connectToPeer = (targetPeerId: string) => {
    if (!peer.current) return;

    console.log('Connecting to:', targetPeerId);
    const conn = peer.current.connect(targetPeerId);

    conn.on('open', () => {
      console.log('Connected to peer');
      setIsConnected(true);
      setConnections(prev => [...prev, conn]);
    });

    conn.on('error', error => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });
  };

  const playNote = (note: string, tone: string) => {
    if (!audioContext.current || !gainNode.current || !isSoundEnabled) return;

    stopNote();

    const oscillator = audioContext.current.createOscillator();
    oscillator.type = tone as OscillatorType;

    const noteIndex = NOTES.indexOf(note);
    const frequency = 440 * Math.pow(2, noteIndex / 12);
    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

    oscillator.connect(gainNode.current);
    oscillator.start();

    activeOscillator.current = oscillator;
  };

  const stopNote = () => {
    if (activeOscillator.current) {
      activeOscillator.current.stop();
      activeOscillator.current = null;
    }
  };

  const handleNoteClick = (note: string) => {
    console.log('Note clicked:', note);
    const isActive = selectedNote === note;
    setSelectedNote(isActive ? null : note);

    if (connections.length > 0) {
      const message = {
        type: 'note',
        note,
        tone: selectedTone,
        isActive: !isActive,
      };
      console.log('connections', connections);
      // Send to all connections
      connections.forEach(conn => {
        if (conn.open) {
          console.log('Sending message to:', conn.peer);
          conn.send(message);
        }
      });
    }
  };

  const handleToneChange = (tone: string) => {
    console.log('Local tone change:', tone);
    setSelectedTone(tone);

    if (connections.length > 0) {
      const message = {
        type: 'tone',
        tone,
      };

      // Send to all connections
      connections.forEach(conn => {
        if (conn.open) {
          conn.send(message);
        }
      });
    }
  };

  return (
    <ChorusContainer>
      <PowerSwitch>
        <PowerLabel>SOUND</PowerLabel>
        <SwitchContainer
          onClick={toggleSound}
          onTouchStart={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleSound();
          }}
        >
          <SwitchButton $isOn={isSoundEnabled} />
        </SwitchContainer>
        <LED $isOn={isSoundEnabled} />
      </PowerSwitch>
      <ConnectionStatus $isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>
      {!isConnected && (
        <div style={{ marginBottom: '1rem', color: 'white' }}>
          <input
            type="text"
            placeholder="Enter peer ID to connect"
            style={{
              padding: '0.5rem',
              marginRight: '0.5rem',
              background: '#3a3a3a',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
            }}
            onChange={e => {
              const targetPeerId = e.target.value.trim();
              if (targetPeerId) {
                connectToPeer(targetPeerId);
              }
            }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Your ID: {peerId}</div>
        </div>
      )}
      <Controls>
        {NOTES.map(note => (
          <NoteButton
            key={note}
            $isActive={selectedNote === note}
            onClick={() => handleNoteClick(note)}
          >
            {note}
          </NoteButton>
        ))}
      </Controls>
      <ToneControl>
        <ToneLabel>Tone</ToneLabel>
        <ToneSelect
          value={selectedTone}
          onChange={e => {
            console.log('Tone changed to:', e.target.value);
            handleToneChange(e.target.value);
          }}
        >
          {TONES.map(tone => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </ToneSelect>
      </ToneControl>
    </ChorusContainer>
  );
}
