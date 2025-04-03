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
  flex-direction: column;
  gap: 0;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  width: 100%;
  justify-content: center;
  position: relative;
`;

const KeyboardContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 130px;
  margin: 0 auto;

  /* Enhanced text selection prevention for all browsers including iOS */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
`;

const WhiteKey = styled.button<{ $isActive: boolean }>`
  position: relative;
  background: ${props => (props.$isActive ? '#4CAF50' : '#ffffff')};
  color: ${props => (props.$isActive ? '#ffffff' : '#000000')};
  height: 130px;
  min-width: 45px;
  flex: 1;
  border: 1px solid #555;
  border-radius: 0 0 4px 4px;
  box-shadow: ${props =>
    props.$isActive ? '0 0 15px rgba(76, 175, 80, 0.8)' : '0 2px 5px rgba(0, 0, 0, 0.2)'};
  transform: ${props => (props.$isActive ? 'translateY(2px)' : 'none')};
  z-index: 1;
  transition: all 0.2s ease;
  padding: 0;

  /* Enhanced text selection prevention for all browsers including iOS */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${props => (props.$isActive ? '#4CAF50' : '#f0f0f0')};
  }
`;

const BlackKey = styled.button<{ $isActive: boolean; $leftOffset: number }>`
  position: absolute;
  top: 0;
  left: ${props => props.$leftOffset}%;
  width: 30px;
  height: 80px;
  background: ${props => (props.$isActive ? '#4CAF50' : '#222222')};
  border: 1px solid #000;
  border-radius: 0 0 4px 4px;
  color: white;
  z-index: 10;
  box-shadow: ${props =>
    props.$isActive ? '0 0 15px rgba(76, 175, 80, 0.8)' : '0 2px 8px rgba(0, 0, 0, 0.5)'};
  transform: ${props => (props.$isActive ? 'translateY(2px)' : 'none')};
  transition: all 0.2s ease;
  padding: 0;

  /* Enhanced text selection prevention for all browsers including iOS */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${props => (props.$isActive ? '#4CAF50' : '#333333')};
  }
`;

const NoteLabel = styled.div`
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;

  /* Enhanced text selection prevention for all browsers including iOS */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
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

const SoundCheckbox = styled.input`
  width: 24px;
  height: 24px;
  cursor: pointer;
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

const PowerLabel = styled.label`
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
`;

const StatusMessage = styled.div`
  color: #ffffff;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const ConnectionBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: white;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  gap: 0.5rem;
  font-weight: bold;
`;

const ConnectionCount = styled.span<{ $count: number }>`
  background-color: ${props => (props.$count > 1 ? '#4CAF50' : '#ffaa00')};
  color: #000;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => (props.$count > 9 ? '0.8rem' : '1rem')};
  transition: all 0.2s ease;
`;

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const TONES = ['sine', 'square', 'triangle', 'sawtooth'];
const ROOM_ID = 'CHORUS'; // Hardcoded peer ID that everyone will connect to

// Create a mapping for displaying flats as an alternative to sharps
const FLAT_EQUIVALENT = {
  'C♯': 'D♭',
  'D♯': 'E♭',
  'F♯': 'G♭',
  'G♯': 'A♭',
  'A♯': 'B♭',
};

// Add styling for octave controls
const OctaveControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  background-color: #2a2a2a;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: white;
`;

const OctaveButton = styled.button`
  width: 36px;
  height: 36px;
  background-color: #3a3a3a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: #4a4a4a;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const OctaveDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  min-width: 80px;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #1a1a1a;
`;

interface ToneMessage {
  type: 'tone';
  note: string;
  oscillatorType: string;
  peerId: string;
  octave?: number;
  action: 'press' | 'release';
  noteId?: string;
}

// Create a single PeerJS instance outside the component
let peerInstance: Peer | null = null;

// Update chat components to show note history
const ChatContainer = styled.div`
  margin-top: 1rem;
  width: 100%;
  border-radius: 8px;
  background-color: #1f1f1f;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 0.5rem 1rem;
  background-color: #2a2a2a;
  color: white;
  font-weight: bold;
`;

const ChatMessagesContainer = styled.div`
  height: 200px;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const NoteEvent = styled.div<{ $isOwn: boolean }>`
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background-color: ${props => (props.$isOwn ? '#303f9f' : '#3a3a3a')};
  color: white;
  align-self: ${props => (props.$isOwn ? 'flex-end' : 'flex-start')};
  max-width: 80%;
`;

// Define note event interface
interface NoteEventData {
  type: 'noteEvent';
  action: 'play' | 'stop' | 'system';
  note: string | null;
  oscillatorType: string;
  peerId: string;
  timestamp: number;
  message?: string; // Optional message for system events
  octave?: number; // Add octave to the interface
}

// Add a component for displaying note accidentals
const SharpFlatToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  background-color: #2a2a2a;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: white;
`;

const ToggleLabel = styled.label`
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
`;

const ToggleSwitch = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

// Define the positions of black keys relative to white keys
const BLACK_KEY_POSITIONS = {
  'C♯': 10, // relative position between C and D
  'D♯': 26.5, // relative position between D and E
  'F♯': 60, // relative position between F and G
  'G♯': 76.5, // relative position between G and A
  'A♯': 93, // relative position between A and B
};

// Separate white and black keys for piano layout
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'];

// Define keyboard mappings for the piano keys
const KEY_MAPPINGS = {
  // White keys - bottom row for white keys
  a: 'C',
  s: 'D',
  d: 'E',
  f: 'F',
  g: 'G',
  h: 'A',
  j: 'B',
  // Extended octave
  k: 'C', // Higher C
  l: 'D', // Higher D
  ';': 'E', // Higher E
  "'": 'F', // Higher F

  // Black keys - top row for black keys
  w: 'C♯',
  e: 'D♯',
  t: 'F♯',
  y: 'G♯',
  u: 'A♯',
  // Extended octave
  o: 'C♯', // Higher C#
  p: 'D♯', // Higher D#
};

// Update KeyLabel with better positioning
const KeyLabel = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.9rem;
  color: #444;
  background-color: rgba(255, 255, 255, 0.7);
  margin: 0 auto;
  padding: 2px 0;
  width: 80%;
  border-radius: 3px;
  font-weight: bold;
  user-select: none;
  -webkit-user-select: none;
`;

// Create specialized versions for black keys
const BlackKeyNoteLabel = styled(NoteLabel)`
  top: 5px;
  font-size: 1rem;
  color: white;
`;

const BlackKeyLabel = styled(KeyLabel)`
  bottom: 5px;
  color: white;
  background-color: rgba(0, 0, 0, 0.6);
  width: 90%;
`;

export default function Chorus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Map<string, string>>(new Map());
  const [selectedTone, setSelectedTone] = useState<string>('sine');
  const [activeTones, setActiveTones] = useState<Map<string, ToneMessage>>(new Map());
  const [status, setStatus] = useState<string>('Initializing...');
  const [noteEvents, setNoteEvents] = useState<NoteEventData[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [audioContextState, setAudioContextState] = useState<string>('not created');
  const soundEnabledRef = useRef<boolean>(false);
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [currentOctave, setCurrentOctave] = useState<number>(4);
  const [showFlats, setShowFlats] = useState<boolean>(false);

  const peerRef = useRef<Peer | null>(null);
  const connections = useRef<Map<string, DataConnection>>(new Map());
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodes = useRef<Map<string, GainNode>>(new Map());

  // Add state to track if mouse/touch is down
  const [isPointerDown, setIsPointerDown] = useState(false);

  // Remove the focus state - always enable keyboard
  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  // Initialize PeerJS and handle connections
  useEffect(() => {
    console.log('Chorus component mounted');

    // Clean up function to ensure we destroy the peer on unmount
    const cleanup = () => {
      console.log('Cleaning up Chorus component');

      // Clean up all oscillators
      oscillators.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          console.error('Error stopping oscillator:', e);
        }
      });
      oscillators.current.clear();

      // Clean up all connections
      connections.current.forEach(conn => {
        conn.close();
      });
      connections.current.clear();

      // Close audio context
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }

      // Clean up PeerJS - only destroy if we created it
      if (peerRef.current === peerInstance) {
        console.log('Destroying peer instance');
        peerInstance?.destroy();
        peerInstance = null;
      }

      peerRef.current = null;
    };

    // Create audio context
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    // Initialize PeerJS - first try to become the CHORUS
    if (!peerInstance) {
      console.log('Trying to become the CHORUS room first');

      // Try to create a peer with ID "CHORUS" first
      peerInstance = new Peer(ROOM_ID, {
        debug: 2, // Set debug level to see what's happening
      });

      peerInstance.on('open', id => {
        console.log('Successfully became the CHORUS room with ID:', id);
        setStatus('I am the CHORUS room - others can join');
        peerRef.current = peerInstance;

        // Since we're the CHORUS room, we need to accept incoming connections
        console.log('Setting up CHORUS room to accept connections');
      });

      peerInstance.on('error', err => {
        // If we can't become CHORUS, that means someone else is already CHORUS
        console.log('Could not become CHORUS, trying with random ID', err);

        // Destroy the failed attempt
        if (peerInstance) {
          peerInstance.destroy();
        }

        // Create a new peer with random ID
        const randomId = Math.random().toString(36).substring(2, 10);
        peerInstance = new Peer(randomId, {
          debug: 2,
        });

        peerInstance.on('open', id => {
          console.log('Connected with random ID:', id);
          setStatus(`Connected as: ${id}`);
          peerRef.current = peerInstance;

          // Now connect to CHORUS
          connectToChorus();
        });

        peerInstance.on('error', secondErr => {
          console.error('Error with random peer:', secondErr);
          setStatus(`Error: ${secondErr.type}`);
        });
      });
    }

    // Set up connection handler
    if (peerInstance) {
      peerInstance.on('connection', handleNewConnection);
    }

    return cleanup;
  }, []); // Empty dependency array - run once

  const connectToChorus = () => {
    if (!peerRef.current) {
      console.error('Cannot connect to CHORUS: peer is null');
      return;
    }

    // Don't try to connect to CHORUS if we are CHORUS
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am the CHORUS room');
      setStatus('I am the CHORUS room');
      return;
    }

    // Don't try to reconnect if we already have a connection to CHORUS
    if (connections.current.has(ROOM_ID)) {
      console.log('Already connected to CHORUS');
      return;
    }

    console.log('Connecting to CHORUS room');
    try {
      const conn = peerRef.current.connect(ROOM_ID, {
        reliable: true,
      });

      // Mark as connecting
      setStatus('Connecting to CHORUS...');

      // Set timeout for connection attempt
      const timeout = setTimeout(() => {
        if (!connections.current.has(ROOM_ID)) {
          console.log('Connection to CHORUS timed out, retrying...');
          if (conn.open) conn.close();
          connectToChorus();
        }
      }, 5000);

      conn.on('open', () => {
        clearTimeout(timeout);
        console.log('Connected to CHORUS room');
        setIsConnected(true);
        setStatus('Connected to CHORUS');

        // Store connection
        connections.current.set(ROOM_ID, conn);

        // Set up data handler
        setupConnectionHandlers(conn);
      });

      conn.on('error', err => {
        clearTimeout(timeout);
        console.error('Connection error:', err);
        setStatus('Failed to connect to CHORUS. Try again later.');
      });
    } catch (err) {
      console.error('Error connecting to CHORUS:', err);
      setStatus('Error connecting to CHORUS');
    }
  };

  const handleNewConnection = (conn: DataConnection) => {
    console.log('Received connection from:', conn.peer);

    // Only set up handlers after connection is fully open
    conn.on('open', () => {
      console.log('Connection fully opened with:', conn.peer);

      // Store the connection
      connections.current.set(conn.peer, conn);
      setIsConnected(true);

      // Update connection count
      setConnectionCount(connections.current.size + 1);

      // Send a confirmation message to the new peer
      if (peerRef.current && peerRef.current.id === ROOM_ID) {
        console.log('I am CHORUS, sending welcome message to new peer:', conn.peer);
        try {
          conn.send({
            type: 'system',
            message: 'Welcome to CHORUS',
            fromChorus: true,
          });
        } catch (err) {
          console.error('Error sending welcome message:', err);
        }
      }

      // Set up data handler
      conn.on('data', (data: any) => {
        console.log('🔴 Received data from', conn.peer, ':', data);
        // Ensure the audio context is running before processing tone messages
        if (data.type === 'tone' && isSoundEnabled && audioContext.current) {
          // Make sure audio context is running
          if (audioContext.current.state !== 'running') {
            console.log('Auto-resuming audio context to handle incoming tone');
            audioContext.current
              .resume()
              .then(() => {
                // Process the message after audio context is running
                processIncomingMessage(data);
              })
              .catch(err => {
                console.error('Failed to resume audio context:', err);
              });
          } else {
            // Audio context is already running, process normally
            processIncomingMessage(data);
          }
        } else {
          // Non-tone messages or sound disabled
          processIncomingMessage(data);
        }
      });

      // When connected, send our current state if we have a note active
      if (selectedTone && peerRef.current) {
        const initMessage: ToneMessage = {
          type: 'tone',
          note: selectedTone,
          oscillatorType: selectedTone,
          peerId: peerRef.current.id,
          octave: currentOctave,
          action: 'press',
        };

        console.log('Sending initial state to new connection:', initMessage);
        conn.send(initMessage);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);

      // Remove the connection
      connections.current.delete(conn.peer);

      // Update connection count
      setConnectionCount(connections.current.size + 1);

      // Remove any active tones from this peer
      setActiveTones(prev => {
        const newMap = new Map(prev);
        newMap.delete(conn.peer);
        return newMap;
      });

      // Stop any tones from this peer
      stopTone(conn.peer);

      // Update connected status if no connections remain
      if (connections.current.size === 0) {
        setIsConnected(false);
        setStatus('Disconnected. Trying to reconnect...');

        // Try to reconnect if we're not CHORUS
        if (peerRef.current && peerRef.current.id !== ROOM_ID) {
          setTimeout(connectToChorus, 2000);
        }
      }
    });

    conn.on('error', err => {
      console.error('Connection error with', conn.peer, ':', err);
    });
  };

  const setupConnectionHandlers = (conn: DataConnection) => {
    console.log('Setting up handlers for connection with', conn.peer);

    // Log connection state
    console.log('Connection state:', conn.open ? 'open' : 'not open');

    conn.on('open', () => {
      console.log('Connection opened with', conn.peer);

      // When connected, send our current state if we have a note active
      if (selectedTone && peerRef.current) {
        const initMessage: ToneMessage = {
          type: 'tone',
          note: selectedTone,
          oscillatorType: selectedTone,
          peerId: peerRef.current.id,
          octave: currentOctave,
          action: 'press',
        };

        console.log('Sending initial state to new connection:', initMessage);
        conn.send(initMessage);
      }
    });

    conn.on('data', (data: any) => {
      console.log('Received data from', conn.peer, ':', data);
      processIncomingMessage(data);
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);

      // Remove the connection
      connections.current.delete(conn.peer);

      // Update connection count
      setConnectionCount(connections.current.size + 1);

      // Remove any active tones from this peer
      setActiveTones(prev => {
        const newMap = new Map(prev);
        newMap.delete(conn.peer);
        return newMap;
      });

      // Stop any tones from this peer
      stopTone(conn.peer);

      // Update connected status if no connections remain
      if (connections.current.size === 0) {
        setIsConnected(false);
        setStatus('Disconnected. Trying to reconnect...');

        // Try to reconnect if we're not CHORUS
        if (peerRef.current && peerRef.current.id !== ROOM_ID) {
          setTimeout(connectToChorus, 2000);
        }
      }
    });
  };

  // Update playTone to use noteId for identification
  const playTone = (
    noteId: string,
    note: string,
    oscillatorType: string,
    octave: number = currentOctave
  ) => {
    console.log(
      `► Playing tone - ID: ${noteId}, Note: ${note}, Type: ${oscillatorType}, Octave: ${octave}`
    );

    if (!audioContext.current || !isSoundEnabled) {
      console.warn('Cannot play tone - AudioContext not initialized or sound disabled');
      return;
    }

    // Ensure audio context is running
    if (audioContext.current.state !== 'running') {
      console.warn('AudioContext not running, attempting to resume');
      audioContext.current.resume().catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
      return;
    }

    // Stop any existing tone with this noteId
    stopTone(noteId);

    try {
      console.log(
        `Creating oscillator for ${noteId}, note: ${note}, type: ${oscillatorType}, octave: ${octave}`
      );

      // Make sure we have a master gain node
      if (!gainNodes.current.has('master')) {
        console.log('Creating master gain node');
        const masterGain = audioContext.current.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioContext.current.destination);
        gainNodes.current.set('master', masterGain);
      }

      // Create note-specific gain node if needed
      if (!gainNodes.current.has(noteId)) {
        const peerGain = audioContext.current.createGain();
        peerGain.gain.value = 0.3; // Slightly lower gain when playing multiple notes
        peerGain.connect(gainNodes.current.get('master')!);
        gainNodes.current.set(noteId, peerGain);
      }

      // Create and configure oscillator
      const oscillator = audioContext.current.createOscillator();
      oscillator.type = oscillatorType as OscillatorType;

      // Calculate the frequency - ensure noteIndex is valid
      let noteIndex = NOTES.indexOf(note);
      if (noteIndex === -1) {
        // Check if it's a flat equivalent
        const sharpEquivalent = Object.entries(FLAT_EQUIVALENT).find(
          ([_, flat]) => flat === note
        )?.[0];
        if (sharpEquivalent) {
          noteIndex = NOTES.indexOf(sharpEquivalent);
        }

        if (noteIndex === -1) {
          console.error(`Invalid note: ${note}`);
          return;
        }
      }

      // Updated frequency calculation with octave and chromatic notes
      // A4 = 440Hz (A in octave 4)
      // Each semitone is 2^(1/12) ratio in frequency
      const A4_FREQ = 440;
      const A4_NOTE_INDEX = NOTES.indexOf('A');
      const A4_OCTAVE = 4;

      // Calculate semitones from A4 (note that each octave has 12 semitones)
      const semitoneDistance = (octave - A4_OCTAVE) * 12 + (noteIndex - A4_NOTE_INDEX);

      // Calculate frequency using the formula: f = 440 * 2^(n/12)
      const frequency = A4_FREQ * Math.pow(2, semitoneDistance / 12);

      console.log(`Setting frequency: ${frequency.toFixed(2)}Hz for note ${note}${octave}`);
      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

      // Connect and start the oscillator
      oscillator.connect(gainNodes.current.get(noteId)!);
      oscillator.start();
      console.log(`Started oscillator for ${noteId}`);

      // Store the oscillator
      oscillators.current.set(noteId, oscillator);
    } catch (e) {
      console.error('Error playing tone:', e);
    }
  };

  const stopTone = (peerId: string) => {
    if (oscillators.current.has(peerId)) {
      try {
        const oscillator = oscillators.current.get(peerId)!;
        oscillator.stop();
        oscillator.disconnect();
        oscillators.current.delete(peerId);
      } catch (e) {
        console.error('Error stopping tone:', e);
      }
    }
  };

  // Update effect to NOT auto-enable sound on load
  useEffect(() => {
    // Check if sound states are mismatched
    const checkSoundState = () => {
      console.log(
        `Checking initial sound state - UI: ${isSoundEnabled}, Ref: ${soundEnabledRef.current}`
      );

      // Just ensure the ref matches the state
      soundEnabledRef.current = isSoundEnabled;

      // Don't auto-enable sound - leave it off by default for iOS
      console.log('Sound is OFF by default - click ENABLE SOUND for iOS devices');
    };

    // Run the check after a short delay to allow component to fully render
    const timer = setTimeout(checkSoundState, 1000);
    return () => clearTimeout(timer);
  }, [isSoundEnabled]);

  // Update the toggleSound function to better handle state
  const toggleSound = async () => {
    console.log('🔈 Toggling sound. Current state:', isSoundEnabled);

    // Always update both state and ref together
    if (!isSoundEnabled) {
      try {
        // Set state first to avoid race conditions
        setIsSoundEnabled(true);
        soundEnabledRef.current = true;

        // Create audio context if it doesn't exist
        if (!audioContext.current) {
          console.log('Creating new AudioContext');
          audioContext.current = new AudioContext();
        }

        // Resume audio context if it's suspended
        if (audioContext.current.state === 'suspended') {
          console.log('Resuming suspended AudioContext');
          await audioContext.current.resume();
        }

        setAudioContextState(audioContext.current.state);
        console.log('AudioContext state after resume:', audioContext.current.state);

        // Create master gain node if it doesn't exist
        if (!gainNodes.current.has('master')) {
          console.log('Creating master gain node');
          const gainNode = audioContext.current.createGain();
          gainNode.gain.value = 0.8; // Increased for better audibility
          gainNode.connect(audioContext.current.destination);
          gainNodes.current.set('master', gainNode);
        }

        // Test sound to verify audio works
        const testOsc = audioContext.current.createOscillator();
        testOsc.type = 'sine';
        testOsc.frequency.setValueAtTime(440, audioContext.current.currentTime); // A4 note
        testOsc.connect(gainNodes.current.get('master')!);
        testOsc.start();
        testOsc.stop(audioContext.current.currentTime + 0.3); // Play for 300ms

        console.log('Test sound played');

        // Double check state is set
        setIsSoundEnabled(true);
        soundEnabledRef.current = true;

        // Play all active tones that were queued up
        console.log('Playing all active tones:', activeTones.size);
        activeTones.forEach((tone, peerId) => {
          if (tone.note) {
            console.log('Playing active tone for', peerId, tone.note);
            // Use a different ID for remote tones
            const remoteId = 'remote-' + peerId;
            void playRemoteTone(remoteId, tone.note, tone.oscillatorType, tone.octave || 4);
          }
        });
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setAudioContextState('error: ' + (error as Error).message);
        // Still keep state as enabled to allow for retries
        setIsSoundEnabled(true);
        soundEnabledRef.current = true;
      }
    } else {
      // Stop all tones
      oscillators.current.forEach((_, peerId) => {
        stopTone(peerId);
      });

      if (audioContext.current) {
        try {
          await audioContext.current.suspend();
          setAudioContextState(audioContext.current.state);
        } catch (e) {
          console.error('Error suspending audio context:', e);
        }
      }

      setIsSoundEnabled(false);
      soundEnabledRef.current = false; // Update the ref to match the state
    }
  };

  // Also update playRemoteTone with noteId
  const playRemoteTone = async (
    noteId: string,
    note: string,
    oscillatorType: string,
    octave: number = currentOctave
  ) => {
    console.log(
      `🔊 REMOTE TONE: Playing ${note} with ${oscillatorType} for ${noteId}, Octave: ${octave}`
    );

    // Check if sound is enabled directly
    if (!isSoundEnabled && !soundEnabledRef.current) {
      console.error(`⛔ Cannot play remote tone - Sound is not enabled`);
      return;
    }

    if (!audioContext.current) {
      console.log('Creating missing AudioContext for remote tone');
      try {
        audioContext.current = new AudioContext();
      } catch (e) {
        console.error('Failed to create AudioContext for remote tone:', e);
        return;
      }
    }

    // Double-check audio context is running
    if (audioContext.current.state !== 'running') {
      console.log('Audio context not running, retrying after forced resume...');
      try {
        await audioContext.current.resume();
        // Retry after forcing resume
        setTimeout(() => playRemoteTone(noteId, note, oscillatorType, octave), 100);
        return;
      } catch (err) {
        console.error('Failed to resume AudioContext for remote tone:', err);
        return;
      }
    }

    try {
      // Stop any existing tone with this ID
      stopTone(noteId);

      // Create a new oscillator
      const osc = audioContext.current.createOscillator();
      osc.type = oscillatorType as OscillatorType;

      // Calculate frequency
      let noteIndex = NOTES.indexOf(note);
      if (noteIndex === -1) {
        // Check if it's a flat equivalent
        const sharpEquivalent = Object.entries(FLAT_EQUIVALENT).find(
          ([_, flat]) => flat === note
        )?.[0];
        if (sharpEquivalent) {
          noteIndex = NOTES.indexOf(sharpEquivalent);
        }

        if (noteIndex === -1) {
          console.error(`Invalid note: ${note}`);
          return;
        }
      }

      // Use a more precise frequency calculation with octave
      // A4 = 440Hz, A in octave 4
      const A4_FREQ = 440;
      const A4_NOTE_INDEX = NOTES.indexOf('A');
      const A4_OCTAVE = 4;

      // Calculate semitones from A4
      const semitoneDistance = (octave - A4_OCTAVE) * 12 + (noteIndex - A4_NOTE_INDEX);

      // Calculate frequency using the formula: f = 440 * 2^(n/12)
      const frequency = A4_FREQ * Math.pow(2, semitoneDistance / 12);

      console.log(
        `💯 Setting frequency ${frequency.toFixed(2)}Hz for remote note ${note}${octave}`
      );
      osc.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

      // Make sure we have a master gain node
      if (!gainNodes.current.has('master')) {
        console.log('Creating master gain node for remote tone');
        const masterGain = audioContext.current.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(audioContext.current.destination);
        gainNodes.current.set('master', masterGain);
      }

      // Create or reuse a gain node for this note
      if (!gainNodes.current.has(noteId)) {
        const gain = audioContext.current.createGain();
        gain.gain.value = 0.6; // Slightly lower gain for multiple notes
        gain.connect(gainNodes.current.get('master')!);
        gainNodes.current.set(noteId, gain);
      }

      // Connect and start
      osc.connect(gainNodes.current.get(noteId)!);
      osc.start();
      console.log(`🎹 STARTED remote oscillator for ${noteId}`);

      // Store the oscillator
      oscillators.current.set(noteId, osc);
    } catch (e) {
      console.error('Error playing remote tone:', e);
    }
  };

  // Update touch handlers to track pointer state
  const handlePointerDown = (_: React.MouseEvent | React.TouchEvent) => {
    setIsPointerDown(true);
    // Add listeners to detect when pointer is released outside the keyboard
    document.addEventListener('mouseup', handleGlobalPointerUp, { once: true });
    document.addEventListener('touchend', handleGlobalPointerUp, { once: true });
  };

  const handleGlobalPointerUp = () => {
    setIsPointerDown(false);
  };

  // Update handleNotePress to track pointer state
  const handleNotePress = (note: string, event?: React.MouseEvent | React.TouchEvent) => {
    // Stop propagation to prevent clicks from affecting keys underneath
    if (event) {
      event.stopPropagation();
      // Set pointer down state
      setIsPointerDown(true);
    }

    console.log('Note pressed:', note);

    if (!peerRef.current) {
      console.error('Cannot send tone update: peer is null');
      return;
    }

    // Generate a unique ID for this note instance
    const noteId = `${peerRef.current.id}-${note}-${currentOctave}`;

    // If note is already active, do nothing
    if (activeNotes.has(noteId)) {
      return;
    }

    // Add to active notes
    setActiveNotes(prev => {
      const newMap = new Map(prev);
      newMap.set(noteId, note);
      return newMap;
    });

    // Create the message with action = press
    const message: ToneMessage = {
      type: 'tone',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      octave: currentOctave,
      action: 'press',
      noteId: noteId,
    };

    // Record this in our own note event history
    const noteEvent: NoteEventData = {
      type: 'noteEvent',
      action: 'play',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      timestamp: Date.now(),
      octave: currentOctave,
    };

    setNoteEvents(prev => {
      // Keep only the most recent 50 events
      const newEvents = [...prev, noteEvent].slice(-50);
      return newEvents;
    });

    console.log('Sending press message:', message);

    // IMPORTANT: Play locally regardless of role
    console.log('Playing note locally:', note);
    playTone('local-' + noteId, note, selectedTone, currentOctave);

    // If we're the CHORUS, handle the message locally through the same event flow
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am CHORUS, processing message locally');
      processIncomingMessage(message);
    }

    // Send to all connections
    sendMessageToConnections(message);
  };

  // Update handleNoteRelease to track pointer state
  const handleNoteRelease = (note: string, event?: React.MouseEvent | React.TouchEvent) => {
    // Stop propagation to prevent events from affecting keys underneath
    if (event) {
      event.stopPropagation();
    }

    console.log('Note released:', note);

    if (!peerRef.current) {
      console.error('Cannot send tone update: peer is null');
      return;
    }

    // Get the noteId for this note
    const noteId = `${peerRef.current.id}-${note}-${currentOctave}`;

    // If note is not active, do nothing
    if (!activeNotes.has(noteId)) {
      return;
    }

    // Remove from active notes
    setActiveNotes(prev => {
      const newMap = new Map(prev);
      newMap.delete(noteId);
      return newMap;
    });

    // Create the message with action = release
    const message: ToneMessage = {
      type: 'tone',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      octave: currentOctave,
      action: 'release',
      noteId: noteId,
    };

    // Record this in our own note event history
    const noteEvent: NoteEventData = {
      type: 'noteEvent',
      action: 'stop',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      timestamp: Date.now(),
      octave: currentOctave,
    };

    setNoteEvents(prev => {
      // Keep only the most recent 50 events
      const newEvents = [...prev, noteEvent].slice(-50);
      return newEvents;
    });

    console.log('Sending release message:', message);

    // IMPORTANT: Stop note locally regardless of role
    console.log('Stopping local note:', note);
    stopTone('local-' + noteId);

    // If we're the CHORUS, handle the message locally through the same event flow
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am CHORUS, processing message locally');
      processIncomingMessage(message);
    }

    // Send to all connections
    sendMessageToConnections(message);
  };

  // Add handlers for dragging across keys
  const handleNoteEnter = (note: string, event: React.MouseEvent | React.TouchEvent) => {
    // Only trigger if pointer is already down (dragging)
    if (isPointerDown) {
      // Get the current active notes that belong to this user
      const currentUserNotes = new Map();
      activeNotes.forEach((noteValue, noteId) => {
        if (noteId.startsWith(`${peerRef.current?.id}`)) {
          currentUserNotes.set(noteId, noteValue);
        }
      });

      // Release all other currently playing notes before playing the new one
      currentUserNotes.forEach((_, noteId) => {
        const noteParts = noteId.split('-');
        const noteToRelease = noteParts[1];
        if (noteToRelease !== note) {
          handleNoteRelease(noteToRelease);
        }
      });

      // Play the new note
      handleNotePress(note, event);
    }
  };

  // Add handlers for mouse/touch interactions
  const handleTouchStart = (note: string, event: React.TouchEvent) => {
    event.preventDefault(); // Prevent default to avoid double events
    handlePointerDown(event);
    handleNotePress(note, event);
  };

  const handleTouchEnd = (note: string, event: React.TouchEvent) => {
    event.preventDefault(); // Prevent default to avoid double events
    setIsPointerDown(false);
    handleNoteRelease(note, event);
  };

  // Update the touch move handler to fix the unused variable
  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isPointerDown) return;

    event.preventDefault();

    // Get the element under the touch point
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Get the current active notes that belong to this user
    const currentUserNotes = new Map();
    activeNotes.forEach((noteValue, noteId) => {
      if (noteId.startsWith(`${peerRef.current?.id}`)) {
        currentUserNotes.set(noteId, noteValue);
      }
    });

    // Check if it's a key and extract the note
    if (element && (element.closest('[data-note]') || element.hasAttribute('data-note'))) {
      const keyElement = element.closest('[data-note]') || element;
      const note = keyElement.getAttribute('data-note');

      if (note) {
        // Release all other currently playing notes before playing the new one
        currentUserNotes.forEach((_, noteId) => {
          const noteParts = noteId.split('-');
          const noteToRelease = noteParts[1];
          if (noteToRelease !== note) {
            handleNoteRelease(noteToRelease);
          }
        });

        // Play this note if it's not already playing
        if (!isNoteActive(note)) {
          handleNotePress(note, event);
        }
      }
    } else {
      // If not over any key, release all notes
      currentUserNotes.forEach((_, noteId) => {
        const noteParts = noteId.split('-');
        const noteToRelease = noteParts[1];
        handleNoteRelease(noteToRelease);
      });
    }
  };

  // Update mouseLeave to always release notes during drag
  const handleMouseLeave = (note: string, event: React.MouseEvent) => {
    if (isNoteActive(note)) {
      handleNoteRelease(note, event);
    }
  };

  // Helper function to send messages to all connections
  const sendMessageToConnections = (message: ToneMessage) => {
    console.log('Number of connections:', connections.current.size);

    if (connections.current.size === 0) {
      console.log('No active connections to send to');
      // Don't try to reconnect if we're the CHORUS room
      if (peerRef.current?.id !== ROOM_ID) {
        setStatus('No connections available. Trying to reconnect...');
        connectToChorus();
      } else {
        setStatus('I am the CHORUS room - waiting for clients to connect');
      }
      return;
    }

    let messagesSent = 0;
    connections.current.forEach((conn, id) => {
      if (conn.open) {
        console.log('Trying to send update to:', id);
        try {
          conn.send(message);
          console.log('Message sent successfully to:', id);
          messagesSent++;
        } catch (err) {
          console.error('Error sending message to', id, err);
        }
      } else {
        console.log('Connection to', id, 'not open');
        connections.current.delete(id);
      }
    });

    console.log(`Sent message to ${messagesSent} connections`);
  };

  // Update processIncomingMessage to handle press/release actions
  const processIncomingMessage = (data: any) => {
    console.log('Processing message:', data);

    if (data.type === 'tone') {
      const toneData = data as ToneMessage;
      console.log('🎵 Processing tone message:', toneData);

      // Don't process our own messages that come back to us
      if (peerRef.current && toneData.peerId === peerRef.current.id) {
        console.log('Ignoring our own message that came back to us');
        return;
      }

      // Get the octave from the message or use default
      const noteOctave = toneData.octave || 4;

      // Ensure we have a noteId
      const noteId = toneData.noteId || `remote-${toneData.peerId}-${toneData.note}-${noteOctave}`;

      // Record this note event in history
      const noteEvent: NoteEventData = {
        type: 'noteEvent',
        action: toneData.action === 'press' ? 'play' : 'stop',
        note: toneData.note,
        oscillatorType: toneData.oscillatorType,
        peerId: toneData.peerId,
        timestamp: Date.now(),
        octave: noteOctave,
      };

      setNoteEvents(prev => {
        const newEvents = [...prev, noteEvent].slice(-50);
        return newEvents;
      });

      // Update the active tones based on action
      if (toneData.action === 'press') {
        console.log('📣 Adding/updating remote tone for', toneData.peerId, toneData.note);

        // Add or update the tone
        setActiveTones(prev => {
          const newMap = new Map(prev);
          newMap.set(noteId, toneData);
          return newMap;
        });

        // Check both the state and ref for sound enabled
        console.log(
          `🔍 Sound enabled check - UI State: ${isSoundEnabled}, Ref: ${soundEnabledRef.current}, AudioContext: ${audioContext.current?.state || 'none'}`
        );

        // Force update of Sound state if conditions are mismatched
        if (!isSoundEnabled && soundEnabledRef.current) {
          console.log('State mismatch detected - fixing state');
          setIsSoundEnabled(true);
        }

        // Play the tone if either the UI state or ref indicates sound is enabled
        if (isSoundEnabled || soundEnabledRef.current) {
          console.log(
            '🔊 ATTEMPTING to play remote tone for',
            toneData.peerId,
            'with note',
            toneData.note
          );
          void playRemoteTone(noteId, toneData.note, toneData.oscillatorType, noteOctave);
        } else {
          console.log('❌ Sound disabled, not playing remote tone');
        }
      } else if (toneData.action === 'release') {
        console.log('❌ Removing tone for', toneData.peerId, toneData.note);

        // Remove the tone
        setActiveTones(prev => {
          const newMap = new Map(prev);
          newMap.delete(noteId);
          return newMap;
        });

        // Stop the tone
        stopTone(noteId);
      }
    } else if (data.type === 'system') {
      console.log('Received system message:', data);

      // Add system messages to note events for visibility
      setNoteEvents(prev => {
        const systemEvent: NoteEventData = {
          type: 'noteEvent',
          action: 'system',
          note: null,
          oscillatorType: '',
          peerId: data.fromChorus ? 'CHORUS' : 'SYSTEM',
          message: data.message,
          timestamp: Date.now(),
        };
        return [...prev, systemEvent].slice(-50);
      });
    }
  };

  const handleToneChange = (tone: string) => {
    setSelectedTone(tone);

    // If we have a note selected, update the tone
    if (selectedTone) {
      handleNotePress(selectedTone);
    }
  };

  // Add effect to update connection count
  useEffect(() => {
    // Function to update the connection count
    const updateConnectionCount = () => {
      // Add 1 to count for the current user
      const count = connections.current.size + 1;
      setConnectionCount(count);
    };

    // Set initial count
    updateConnectionCount();

    // Setup interval to periodically check connections
    const interval = setInterval(() => {
      // Clean up any closed connections first
      connections.current.forEach((conn, id) => {
        if (!conn.open) {
          console.log(`Removing closed connection to ${id}`);
          connections.current.delete(id);
        }
      });

      updateConnectionCount();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Modify changeOctave to update all currently playing notes when octave changes
  const changeOctave = (delta: number) => {
    setCurrentOctave(prev => {
      // Limit octave range between 1 and 7
      const newOctave = Math.max(1, Math.min(7, prev + delta));
      console.log(`Changing octave from ${prev} to ${newOctave}`);

      if (prev !== newOctave && peerRef.current) {
        // Store currently playing notes
        const playingNotes = new Map(activeNotes);

        // Stop all currently playing notes at the old octave
        playingNotes.forEach((note, noteId) => {
          stopTone('local-' + noteId);

          // Create a release message for each active note
          if (peerRef.current) {
            const releaseMessage: ToneMessage = {
              type: 'tone',
              note: note,
              oscillatorType: selectedTone,
              peerId: peerRef.current.id,
              octave: prev, // old octave
              action: 'release',
              noteId: noteId,
            };

            // Send release message for each note
            sendMessageToConnections(releaseMessage);
          }
        });

        // Clear active notes
        setActiveNotes(new Map());

        // Play the same notes at the new octave after a brief delay to ensure clean transition
        setTimeout(() => {
          playingNotes.forEach((note, noteId) => {
            // Generate new noteId with new octave
            const newNoteId = noteId.replace(`-${prev}`, `-${newOctave}`);

            // Play note at new octave
            if (peerRef.current) {
              // Play locally
              playTone('local-' + newNoteId, note, selectedTone, newOctave);

              // Update active notes
              setActiveNotes(prev => {
                const updatedMap = new Map(prev);
                updatedMap.set(newNoteId, note);
                return updatedMap;
              });

              // Create press message for the note at new octave
              const pressMessage: ToneMessage = {
                type: 'tone',
                note: note,
                oscillatorType: selectedTone,
                peerId: peerRef.current.id,
                octave: newOctave,
                action: 'press',
                noteId: newNoteId,
              };

              // Send press message
              sendMessageToConnections(pressMessage);

              // Record this in note event history
              const noteEvent: NoteEventData = {
                type: 'noteEvent',
                action: 'play',
                note: note,
                oscillatorType: selectedTone,
                peerId: peerRef.current.id,
                timestamp: Date.now(),
                octave: newOctave,
              };

              setNoteEvents(prev => {
                const newEvents = [...prev, noteEvent].slice(-50);
                return newEvents;
              });
            }
          });
        }, 50); // Small delay for clean transition
      }

      return newOctave;
    });
  };

  // Add a function to toggle between sharps and flats
  const toggleSharpFlat = () => {
    setShowFlats(prev => !prev);
  };

  // Helper to display the note with correct accidental
  const displayNote = (note: string): string => {
    if (showFlats && FLAT_EQUIVALENT[note as keyof typeof FLAT_EQUIVALENT]) {
      return FLAT_EQUIVALENT[note as keyof typeof FLAT_EQUIVALENT];
    }
    return note;
  };

  // Get keyboard key that is mapped to a note
  const getKeyForNote = (note: string) => {
    return Object.entries(KEY_MAPPINGS).find(([_, mappedNote]) => mappedNote === note)?.[0];
  };

  // Add different octave for higher keyboard keys
  const getNoteOctave = (_note: string, keyPressed: string) => {
    // Higher octave for keys k, l, ;, ', o, p
    const higherOctaveKeys = ['k', 'l', ';', "'", 'o', 'p'];
    if (higherOctaveKeys.includes(keyPressed)) {
      return currentOctave + 1;
    }
    return currentOctave;
  };

  // Auto-focus the keyboard when component mounts
  useEffect(() => {
    if (keyboardContainerRef.current) {
      keyboardContainerRef.current.focus();
    }
  }, []);

  // Update keyboard event handlers to always be active (not dependent on focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in an input field or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check if this key is mapped to a note
      if (KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS]) {
        const note = KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS];
        const octave = getNoteOctave(note, key);

        // Check if this key is already pressed (to prevent repeat events)
        if (e.repeat || activeNotes.has(`keyboard-${key}-${octave}`)) return;

        // Create a synthetic event
        const syntheticEvent = {
          stopPropagation: () => {},
          preventDefault: () => {},
        } as React.MouseEvent<HTMLButtonElement>;

        // Play the note with the specific octave
        handleKeyboardNotePress(note, key, octave, syntheticEvent);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in an input field or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check if this key is mapped to a note
      if (KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS]) {
        const note = KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS];
        const octave = getNoteOctave(note, key);

        // Create a synthetic event
        const syntheticEvent = {
          stopPropagation: () => {},
          preventDefault: () => {},
        } as React.MouseEvent<HTMLButtonElement>;

        // Release the note
        handleKeyboardNoteRelease(note, key, octave, syntheticEvent);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeNotes, currentOctave]);

  // Special keyboard note handlers that include the key and octave
  const handleKeyboardNotePress = (
    note: string,
    key: string,
    octave: number,
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }

    console.log(`Keyboard note pressed: ${note} (key: ${key}), octave: ${octave}`);

    if (!peerRef.current) {
      console.error('Cannot send tone update: peer is null');
      return;
    }

    // Generate a unique ID for this key-specific note
    const noteId = `keyboard-${key}-${octave}`;

    // If note is already active, do nothing
    if (activeNotes.has(noteId)) {
      return;
    }

    // Add to active notes
    setActiveNotes(prev => {
      const newMap = new Map(prev);
      newMap.set(noteId, note);
      return newMap;
    });

    // Create the message with action = press
    const message: ToneMessage = {
      type: 'tone',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      octave: octave,
      action: 'press',
      noteId: noteId,
    };

    // Record this in our own note event history
    const noteEvent: NoteEventData = {
      type: 'noteEvent',
      action: 'play',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      timestamp: Date.now(),
      octave: octave,
    };

    setNoteEvents(prev => {
      const newEvents = [...prev, noteEvent].slice(-50);
      return newEvents;
    });

    console.log('Sending keyboard press message:', message);

    // Play locally
    console.log('Playing keyboard note locally:', note);
    playTone('local-' + noteId, note, selectedTone, octave);

    // If we're the CHORUS, handle the message locally
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am CHORUS, processing keyboard message locally');
      processIncomingMessage(message);
    }

    // Send to all connections
    sendMessageToConnections(message);
  };

  const handleKeyboardNoteRelease = (
    note: string,
    key: string,
    octave: number,
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }

    console.log(`Keyboard note released: ${note} (key: ${key}), octave: ${octave}`);

    if (!peerRef.current) {
      console.error('Cannot send tone update: peer is null');
      return;
    }

    // Get the noteId for this note
    const noteId = `keyboard-${key}-${octave}`;

    // If note is not active, do nothing
    if (!activeNotes.has(noteId)) {
      return;
    }

    // Remove from active notes
    setActiveNotes(prev => {
      const newMap = new Map(prev);
      newMap.delete(noteId);
      return newMap;
    });

    // Create the message with action = release
    const message: ToneMessage = {
      type: 'tone',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      octave: octave,
      action: 'release',
      noteId: noteId,
    };

    // Record this in our own note event history
    const noteEvent: NoteEventData = {
      type: 'noteEvent',
      action: 'stop',
      note: note,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      timestamp: Date.now(),
      octave: octave,
    };

    setNoteEvents(prev => {
      const newEvents = [...prev, noteEvent].slice(-50);
      return newEvents;
    });

    console.log('Sending keyboard release message:', message);

    // Stop note locally
    console.log('Stopping keyboard note locally:', note);
    stopTone('local-' + noteId);

    // If we're the CHORUS, handle the message locally
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am CHORUS, processing keyboard message locally');
      processIncomingMessage(message);
    }

    // Send to all connections
    sendMessageToConnections(message);
  };

  // Update isNoteActive to check multiple possible active notes for the same musical note
  const isNoteActive = (note: string) => {
    // Check keyboard and touch/mouse activations
    let isActive = false;

    activeNotes.forEach((activeNote, _noteId) => {
      if (activeNote === note) {
        isActive = true;
      }
    });

    return isActive;
  };

  return (
    <ChorusContainer onTouchMove={handleTouchMove}>
      {/* Add prominent sound info message for iOS */}
      <div
        style={{
          backgroundColor: '#ff9800',
          padding: '0.5rem 1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        if you're on an iphone you need to have your ringer on to hear the sound
      </div>

      <PowerSwitch>
        <SoundCheckbox
          type="checkbox"
          id="sound-toggle"
          checked={isSoundEnabled}
          onChange={() => toggleSound()}
        />
        <PowerLabel htmlFor="sound-toggle">SOUND {isSoundEnabled ? '(ON)' : '(OFF)'}</PowerLabel>
        <LED $isOn={isSoundEnabled} />
        <div
          style={{
            marginLeft: '10px',
            fontSize: '0.8rem',
            color: isSoundEnabled ? '#4CAF50' : '#FF5252',
            fontWeight: 'bold',
          }}
        >
          {isSoundEnabled ? '✓ ENABLED' : '✗ DISABLED'} ({audioContextState})
        </div>
      </PowerSwitch>

      <ConnectionStatus $isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>

      {/* Add user count badge */}
      <ConnectionBadge>
        <span>👥 Online:</span>
        <ConnectionCount $count={connectionCount}>{connectionCount}</ConnectionCount>
        {connectionCount === 1
          ? 'Just You'
          : connectionCount === 2
            ? 'You + 1 other'
            : `You + ${connectionCount - 1} others`}
      </ConnectionBadge>

      <StatusMessage>{status}</StatusMessage>

      {/* Add octave controls */}
      <OctaveControl>
        <OctaveButton onClick={() => changeOctave(-1)}>−</OctaveButton>
        <OctaveDisplay>Octave {currentOctave}</OctaveDisplay>
        <OctaveButton onClick={() => changeOctave(1)}>+</OctaveButton>
      </OctaveControl>

      {/* Add toggle for sharps/flats */}
      <SharpFlatToggle>
        <ToggleSwitch
          type="checkbox"
          id="sharp-flat-toggle"
          checked={showFlats}
          onChange={toggleSharpFlat}
        />
        <ToggleLabel htmlFor="sharp-flat-toggle">
          Show as: {showFlats ? 'Flats (♭)' : 'Sharps (♯)'}
        </ToggleLabel>
      </SharpFlatToggle>

      <Controls>
        <KeyboardContainer ref={keyboardContainerRef} tabIndex={0}>
          {/* Render white keys first as the base layer */}
          {WHITE_KEYS.map(note => {
            const keyBinding = getKeyForNote(note);
            return (
              <WhiteKey
                key={note}
                data-note={note}
                $isActive={isNoteActive(note)}
                onMouseDown={e => {
                  handlePointerDown(e);
                  handleNotePress(note, e);
                }}
                onMouseUp={e => {
                  setIsPointerDown(false);
                  handleNoteRelease(note, e);
                }}
                onMouseEnter={e => handleNoteEnter(note, e)}
                onMouseLeave={e => handleMouseLeave(note, e)}
                onTouchStart={e => handleTouchStart(note, e)}
                onTouchEnd={e => handleTouchEnd(note, e)}
              >
                <NoteLabel>{note}</NoteLabel>
                {keyBinding && <KeyLabel>{keyBinding.toUpperCase()}</KeyLabel>}
              </WhiteKey>
            );
          })}

          {/* Render black keys on top */}
          {BLACK_KEYS.map(note => {
            const keyBinding = getKeyForNote(note);
            return (
              <BlackKey
                key={note}
                data-note={note}
                $isActive={isNoteActive(note)}
                $leftOffset={BLACK_KEY_POSITIONS[note as keyof typeof BLACK_KEY_POSITIONS]}
                onMouseDown={e => {
                  handlePointerDown(e);
                  handleNotePress(note, e);
                }}
                onMouseUp={e => {
                  setIsPointerDown(false);
                  handleNoteRelease(note, e);
                }}
                onMouseEnter={e => handleNoteEnter(note, e)}
                onMouseLeave={e => handleMouseLeave(note, e)}
                onTouchStart={e => handleTouchStart(note, e)}
                onTouchEnd={e => handleTouchEnd(note, e)}
              >
                <BlackKeyNoteLabel>{displayNote(note)}</BlackKeyNoteLabel>
                {keyBinding && <BlackKeyLabel>{keyBinding.toUpperCase()}</BlackKeyLabel>}
              </BlackKey>
            );
          })}
        </KeyboardContainer>
      </Controls>

      <ToneControl>
        <ToneLabel>Tone</ToneLabel>
        <ToneSelect value={selectedTone} onChange={e => handleToneChange(e.target.value)}>
          {TONES.map(tone => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </ToneSelect>
      </ToneControl>

      <ChatContainer>
        <ChatHeader>Note Event History</ChatHeader>
        <ChatMessagesContainer ref={chatContainerRef}>
          {noteEvents.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', margin: '1rem' }}>
              No note events yet. Click notes above to test the connection!
            </div>
          ) : (
            noteEvents.map((event, index) => (
              <NoteEvent key={index} $isOwn={peerRef.current?.id === event.peerId}>
                {event.action === 'system' ? (
                  <div>
                    <strong>{event.peerId}:</strong> {event.message}
                  </div>
                ) : (
                  <div>
                    <strong>
                      {peerRef.current?.id === event.peerId
                        ? 'You'
                        : `Peer ${event.peerId.substring(0, 6)}`}
                    </strong>{' '}
                    {event.action === 'play' ? 'played' : 'stopped'}{' '}
                    {event.note ? displayNote(event.note) : null}
                    {event.octave && <sub>{event.octave}</sub>} with {event.oscillatorType} tone
                  </div>
                )}
              </NoteEvent>
            ))
          )}
        </ChatMessagesContainer>
      </ChatContainer>
    </ChorusContainer>
  );
}
