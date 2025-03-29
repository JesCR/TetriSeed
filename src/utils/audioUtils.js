// Audio utilities for Tetris game
import tetrisTheme from '../assets/tetris-theme-korobeiniki-rearranged-arr-for-strings-185592.mp3';

// Audio context and sounds
let audioContext = null;
let bgMusic = null;
let isMusicEnabled = true;

// Initialize the audio
const initAudio = () => {
  // Create audio element for background music
  bgMusic = new Audio(tetrisTheme);
  bgMusic.loop = true;
  bgMusic.volume = 0.7;
  
  // Try to load audio
  bgMusic.load();
  
  // Get stored music preference
  const storedMusicPref = localStorage.getItem('tetrisSeedMusicEnabled');
  if (storedMusicPref !== null) {
    isMusicEnabled = storedMusicPref === 'true';
  }
  
  return {
    bgMusic,
    isMusicEnabled
  };
};

// Play background music
const playBackgroundMusic = () => {
  if (!bgMusic) {
    const { bgMusic: music } = initAudio();
    bgMusic = music;
  }
  
  if (isMusicEnabled && bgMusic.paused) {
    // Use a promise to handle autoplay issues
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Autoplay prevented. User interaction needed to play music.');
      });
    }
  }
};

// Pause background music
const pauseBackgroundMusic = () => {
  if (bgMusic && !bgMusic.paused) {
    bgMusic.pause();
  }
};

// Toggle music on/off
const toggleMusic = () => {
  isMusicEnabled = !isMusicEnabled;
  
  // Store preference
  localStorage.setItem('tetrisSeedMusicEnabled', isMusicEnabled);
  
  if (isMusicEnabled) {
    playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
  }
  
  return isMusicEnabled;
};

// Get current music state
const getMusicState = () => {
  if (!bgMusic) {
    const { isMusicEnabled: musicState } = initAudio();
    return musicState;
  }
  return isMusicEnabled;
};

export {
  initAudio,
  playBackgroundMusic,
  pauseBackgroundMusic,
  toggleMusic,
  getMusicState
}; 