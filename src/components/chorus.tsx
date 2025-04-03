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

const StatusMessage = styled.div`
  color: #ffffff;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const InfoBox = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #1f1f1f;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  max-width: 100%;
  word-break: break-word;
`;

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TONES = ['sine', 'square', 'triangle', 'sawtooth'];
const ROOM_ID = 'CHORUS'; // Hardcoded peer ID that everyone will connect to

interface ToneMessage {
  type: 'tone';
  note: string | null;
  oscillatorType: string;
  peerId: string;
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
}

export default function Chorus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('sine');
  const [activeTones, setActiveTones] = useState<Map<string, ToneMessage>>(new Map());
  const [status, setStatus] = useState<string>('Initializing...');
  const [connectionInfo, setConnectionInfo] = useState<string>('No connection info available');
  const [noteEvents, setNoteEvents] = useState<NoteEventData[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [audioContextState, setAudioContextState] = useState<string>('not created');

  const peerRef = useRef<Peer | null>(null);
  const connections = useRef<Map<string, DataConnection>>(new Map());
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodes = useRef<Map<string, GainNode>>(new Map());

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
        console.log('Received data from', conn.peer, ':', data);
        processIncomingMessage(data);
      });

      // When connected, send our current state if we have a note active
      if (selectedNote && peerRef.current) {
        const initMessage: ToneMessage = {
          type: 'tone',
          note: selectedNote,
          oscillatorType: selectedTone,
          peerId: peerRef.current.id,
        };

        console.log('Sending initial state to new connection:', initMessage);
        conn.send(initMessage);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);

      // Remove the connection
      connections.current.delete(conn.peer);

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
      if (selectedNote && peerRef.current) {
        const initMessage: ToneMessage = {
          type: 'tone',
          note: selectedNote,
          oscillatorType: selectedTone,
          peerId: peerRef.current.id,
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

  const playTone = (peerId: string, note: string, oscillatorType: string) => {
    console.log(`► Playing tone - Peer: ${peerId}, Note: ${note}, Type: ${oscillatorType}`);

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

    // Stop any existing tone from this peer
    stopTone(peerId);

    try {
      console.log(`Creating oscillator for ${peerId}, note: ${note}, type: ${oscillatorType}`);

      // Make sure we have a master gain node
      if (!gainNodes.current.has('master')) {
        console.log('Creating master gain node');
        const masterGain = audioContext.current.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioContext.current.destination);
        gainNodes.current.set('master', masterGain);
      }

      // Create peer-specific gain node if needed
      if (!gainNodes.current.has(peerId)) {
        const peerGain = audioContext.current.createGain();
        peerGain.gain.value = 0.4;
        peerGain.connect(gainNodes.current.get('master')!);
        gainNodes.current.set(peerId, peerGain);
      }

      // Create and configure oscillator
      const oscillator = audioContext.current.createOscillator();
      oscillator.type = oscillatorType as OscillatorType;

      // Calculate the frequency - ensure noteIndex is valid
      const noteIndex = NOTES.indexOf(note);
      if (noteIndex === -1) {
        console.error(`Invalid note: ${note}`);
        return;
      }

      // A4 = 440Hz, each semitone is a factor of 2^(1/12)
      const frequency = 440 * Math.pow(2, noteIndex / 12);
      console.log(`Setting frequency: ${frequency}Hz for note ${note}`);
      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

      // Connect and start the oscillator
      oscillator.connect(gainNodes.current.get(peerId)!);
      oscillator.start();
      console.log(`Started oscillator for ${peerId}`);

      // Store the oscillator
      oscillators.current.set(peerId, oscillator);
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

  const toggleSound = async () => {
    console.log('Toggling sound. Current state:', isSoundEnabled);

    if (!isSoundEnabled) {
      try {
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
        console.log('AudioContext state:', audioContext.current.state);

        // Create master gain node if it doesn't exist
        if (!gainNodes.current.has('master')) {
          console.log('Creating master gain node');
          const gainNode = audioContext.current.createGain();
          gainNode.gain.value = 0.5; // Increased from 0.3 for better audibility
          gainNode.connect(audioContext.current.destination);
          gainNodes.current.set('master', gainNode);
        }

        // Test sound to verify audio works
        const testOsc = audioContext.current.createOscillator();
        testOsc.type = 'sine';
        testOsc.frequency.setValueAtTime(440, audioContext.current.currentTime); // A4 note
        testOsc.connect(gainNodes.current.get('master')!);
        testOsc.start();
        testOsc.stop(audioContext.current.currentTime + 0.2); // Play for 200ms

        console.log('Test sound played');
        setIsSoundEnabled(true);

        // Play all active tones
        activeTones.forEach((tone, peerId) => {
          if (tone.note) {
            console.log('Playing active tone for', peerId, tone.note);
            playTone(peerId, tone.note, tone.oscillatorType);
          }
        });
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setAudioContextState('error: ' + (error as Error).message);
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
    }
  };

  const handleNoteClick = (note: string) => {
    console.log('Note clicked:', note);

    // Toggle the note
    const newSelectedNote = selectedNote === note ? null : note;
    setSelectedNote(newSelectedNote);

    if (!peerRef.current) {
      console.error('Cannot send tone update: peer is null');
      return;
    }

    // Create the message
    const message: ToneMessage = {
      type: 'tone',
      note: newSelectedNote,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
    };

    // Record this in our own note event history
    const noteEvent: NoteEventData = {
      type: 'noteEvent',
      action: newSelectedNote ? 'play' : 'stop',
      note: newSelectedNote,
      oscillatorType: selectedTone,
      peerId: peerRef.current.id,
      timestamp: Date.now(),
    };

    setNoteEvents(prev => {
      // Keep only the most recent 50 events
      const newEvents = [...prev, noteEvent].slice(-50);
      return newEvents;
    });

    console.log('Sending message:', message);

    // IMPORTANT: Play locally regardless of role
    if (newSelectedNote) {
      console.log('Playing note locally:', newSelectedNote);
      playTone('local-' + peerRef.current.id, newSelectedNote, selectedTone);
    } else {
      console.log('Stopping local note');
      stopTone('local-' + peerRef.current.id);
    }

    // If we're the CHORUS, handle the message locally through the same event flow
    if (peerRef.current.id === ROOM_ID) {
      console.log('I am CHORUS, processing message locally');
      processIncomingMessage(message);
    }

    console.log('Number of connections:', connections.current.size);
    console.log('Connection keys:', [...connections.current.keys()]);

    // Send to all connections
    if (connections.current.size === 0) {
      console.log('No active connections to send to');
      // Don't try to reconnect if we're the CHORUS room
      if (peerRef.current.id !== ROOM_ID) {
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
        console.log('Trying to send tone update to:', id);
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

  // Fix processIncomingMessage to better log and handle tone messages
  const processIncomingMessage = (data: any) => {
    console.log('Processing message:', data);

    if (data.type === 'tone') {
      const toneData = data as ToneMessage;
      console.log('Processing tone message:', toneData);

      // Don't process our own messages that come back to us
      if (peerRef.current && toneData.peerId === peerRef.current.id) {
        console.log('Ignoring our own message that came back to us');
        return;
      }

      // Record this note event in history
      const noteEvent: NoteEventData = {
        type: 'noteEvent',
        action: toneData.note ? 'play' : 'stop',
        note: toneData.note,
        oscillatorType: toneData.oscillatorType,
        peerId: toneData.peerId,
        timestamp: Date.now(),
      };

      setNoteEvents(prev => {
        // Keep only the most recent 50 events
        const newEvents = [...prev, noteEvent].slice(-50);
        return newEvents;
      });

      // Scroll to bottom of event history
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 10);

      // Update the active tones
      if (toneData.note) {
        console.log('Adding/updating tone for', toneData.peerId);
        // Add or update the tone
        setActiveTones(prev => {
          const newMap = new Map(prev);
          newMap.set(toneData.peerId, toneData);
          return newMap;
        });

        // Play the tone if sound is enabled
        if (isSoundEnabled) {
          console.log('Playing remote tone for', toneData.peerId, 'with note', toneData.note);
          // Use a special ID for remote tones
          playTone('remote-' + toneData.peerId, toneData.note, toneData.oscillatorType);
        } else {
          console.log('Sound disabled, not playing tone');
        }
      } else {
        console.log('Removing tone for', toneData.peerId);
        // Remove the tone
        setActiveTones(prev => {
          const newMap = new Map(prev);
          newMap.delete(toneData.peerId);
          return newMap;
        });

        // Stop the tone
        stopTone('remote-' + toneData.peerId);
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
    if (selectedNote) {
      handleNoteClick(selectedNote);
    }
  };

  // Update this to test connections
  const testConnections = () => {
    console.log('Testing connections...');
    console.log('Current number of connections:', connections.current.size);

    // Build connection info
    let info = `Peer ID: ${peerRef.current?.id || 'unknown'}\n`;
    info += `Role: ${peerRef.current?.id === ROOM_ID ? 'CHORUS SERVER' : 'CLIENT'}\n`;
    info += `Connections: ${connections.current.size}\n`;

    if (connections.current.size === 0) {
      if (peerRef.current?.id === ROOM_ID) {
        setStatus('I am the CHORUS room - waiting for others to connect');
        info += 'Waiting for clients to connect.\n';
        info += '\nTo test this app:\n';
        info += '1. Open another browser window/tab\n';
        info += '2. Navigate to the same URL\n';
        info += '3. Turn on SOUND in both windows\n';
        info += '4. Click notes in either window\n';
      } else {
        info += 'Trying to connect to CHORUS...\n';
        connectToChorus();
      }
    } else {
      info += 'Connected peers:\n';
      connections.current.forEach((conn, id) => {
        info += `- ${id}: ${conn.open ? 'open' : 'closed'}\n`;
        console.log(`Connection to ${id}: ${conn.open ? 'open' : 'closed'}`);
        if (!conn.open) {
          connections.current.delete(id);
        }
      });
    }

    setConnectionInfo(info);
  };

  // Add this effect to update connection info periodically
  useEffect(() => {
    // Update connection info initially
    testConnections();

    // Update connection info every 5 seconds
    const interval = setInterval(() => {
      testConnections();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        <div style={{ marginLeft: '10px', fontSize: '0.7rem', color: '#aaa' }}>
          Audio: {audioContextState}
        </div>
      </PowerSwitch>

      <ConnectionStatus $isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>

      <StatusMessage>{status}</StatusMessage>

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
                    {event.action === 'play' ? 'played' : 'stopped'} {event.note} with{' '}
                    {event.oscillatorType} tone
                  </div>
                )}
              </NoteEvent>
            ))
          )}
        </ChatMessagesContainer>
      </ChatContainer>

      <button
        onClick={testConnections}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#2a2a2a',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Test Connections
      </button>

      <InfoBox>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{connectionInfo}</pre>
      </InfoBox>
    </ChorusContainer>
  );
}
