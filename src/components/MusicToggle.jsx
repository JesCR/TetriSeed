import { useState, useEffect } from 'react';
import { toggleMusic, getMusicState } from '../utils/audioUtils';

const MusicToggle = () => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(getMusicState());
  
  const handleToggle = () => {
    const newState = toggleMusic();
    setIsMusicEnabled(newState);
  };
  
  return (
    <button 
      className="music-toggle-btn" 
      onClick={handleToggle}
      aria-label={isMusicEnabled ? "Turn music off" : "Turn music on"}
      title={isMusicEnabled ? "Turn music off" : "Turn music on"}
    >
      {isMusicEnabled ? '🔊' : '🔇'}
    </button>
  );
};

export default MusicToggle; 