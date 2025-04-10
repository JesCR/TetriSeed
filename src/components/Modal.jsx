import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import logoText from '../assets/images/logo_text.png';
import './Modal.css';
import LogoCarousel from './LogoCarousel';

const Modal = ({ isOpen, type, score, onClose, onSubmit, customContent }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const nameInputRef = useRef(null);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Capture screenshot when the game ends
  useEffect(() => {
    if (isOpen && type === 'top10' && !screenshotUrl && !isCapturing) {
      captureScreenshot();
    }
  }, [isOpen, type, screenshotUrl, isCapturing]);

  if (!isOpen) return null;

  // Function to capture the game screen
  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      
      // Target the main game area for screenshot
      const gameElement = document.querySelector('.stage-container');
      
      if (gameElement) {
        // Hide any overlays or messages that might interfere
        const tempOverlays = document.querySelectorAll('.debt-message, .interest-message');
        tempOverlays.forEach(overlay => {
          if (overlay) overlay.style.display = 'none';
        });
        
        // Take the screenshot
        const canvas = await html2canvas(gameElement, {
          backgroundColor: '#000000',
          scale: 2, // Higher quality
          logging: false,
          useCORS: true
        });
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotUrl(dataUrl);
        
        // Restore any hidden elements
        tempOverlays.forEach(overlay => {
          if (overlay) overlay.style.display = '';
        });
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = () => {
    // Get name directly from the input ref for submission
    const inputName = nameInputRef.current ? nameInputRef.current.value : '';
    
    if (type === 'nameInput' && (!inputName.trim() || inputName.length < 2)) {
      setError('Please enter a valid name (2-5 characters)');
      return;
    }
    
    // First, force scroll to top immediately
    window.scrollTo(0, 0);
    
    // iOS needs special handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                 
    // Submit the name after a short delay to let keyboard hide
    setTimeout(() => {
      // iOS-specific: set position fixed to prevent content shift when keyboard hides
      if (isIOS) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0px';
        
        // Reset these properties after keyboard animation completes
        setTimeout(() => {
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          
          // Force scroll again
          window.scrollTo(0, 0);
        }, 300);
      }
      
      // Force scroll again with various methods
      window.scrollTo(0, 0);
      window.scrollTo({top: 0, behavior: 'auto'});
      
      // Submit the name
      onSubmit(inputName);
      
      // Reset input
      if (nameInputRef.current) {
        nameInputRef.current.value = '';
      }
      setName('');
      setError('');
      
      // Repeated scroll attempts with increasing delays
      const scrollAttempts = [50, 300, 500, 800, 1200];
      scrollAttempts.forEach(delay => {
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, delay);
      });
    }, 100);
  };
  
  const handleNameChange = (e) => {
    console.log('Input value:', e.target.value);
    setName(e.target.value);
    
    // Clear error if present and name is valid
    if (error && e.target.value.trim().length >= 2) {
      setError('');
    }
  };
  
  // Handle key events to prevent propagation
  const handleKeyEvent = (e) => {
    // Stop propagation to prevent game controls from interfering
    e.stopPropagation();
  };
  
  // Prevent zooming when input receives focus
  const handleInputFocus = (e) => {
    // Prevent zoom-in behavior on iOS by setting font size to 16px temporarily
    e.target.style.fontSize = '16px';
    // And restore original font size after a short delay
    setTimeout(() => {
      if (e.target) {
        e.target.style.fontSize = '';
      }
    }, 100);
    
    // Create a global event handler to capture all keyboard events during input focus
    const captureKeyEvents = (event) => {
      // If input is focused, prevent default for game controls
      if (document.activeElement === nameInputRef.current) {
        event.stopPropagation();
      }
    };
    
    // Add global event listeners
    window.addEventListener('keydown', captureKeyEvents, true);
    window.addEventListener('keyup', captureKeyEvents, true);
    window.addEventListener('keypress', captureKeyEvents, true);
    
    // Remove listeners when input blurs
    nameInputRef.current.addEventListener('blur', () => {
      window.removeEventListener('keydown', captureKeyEvents, true);
      window.removeEventListener('keyup', captureKeyEvents, true);
      window.removeEventListener('keypress', captureKeyEvents, true);
    }, { once: true });
  };
  
  // Handle score object or plain number
  const getScoreValue = () => {
    if (score === null || score === undefined) return 0;
    if (typeof score === 'object') {
      return score.score || 0;
    }
    return score;
  };

  const getRank = () => {
    if (score && typeof score === 'object') {
      return score.rank;
    }
    return null;
  };

  const tweetText = getRank() 
    ? `I just scored ${getScoreValue()} in TetriSeed: Clear your Debt! Ranked #${getRank()} on the leaderboard! @SuperseedXYZ is the best DeFi protocol for loans! #SuperSeed #ClearYourDebt Check it out: tetriseed.xyz` 
    : `I just scored ${getScoreValue()} in TetriSeed: Clear your Debt! @SuperseedXYZ is the best DeFi protocol for loans! #SuperSeed #ClearYourDebt Check it out: tetriseed.xyz`;
  
  // Create tweet URL with media if screenshot is available
  const getTweetUrl = () => {
    const baseUrl = 'https://twitter.com/intent/tweet';
    const textParam = `text=${encodeURIComponent(tweetText)}`;
    
    // Twitter's web intent doesn't directly support attaching images
    // But we can still share the text
    return `${baseUrl}?${textParam}`;
  };

  // Function to download the screenshot
  const downloadScreenshot = () => {
    if (!screenshotUrl) return;
    
    const link = document.createElement('a');
    link.href = screenshotUrl;
    link.download = `tetriseed-score-${getScoreValue()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay">
      <div 
        className={`modal-content ${type === 'custom' ? 
          (customContent?.props?.className?.includes('mobile-warning-modal') ? 
           'custom-modal mobile-modal' : 'custom-modal') : ''}`}
      >
        {type !== 'custom' && (
          <img src={logoText} alt="SuperSeed Logo" className="modal-logo" />
        )}
        
        {type === 'nameInput' && (
          <>
            <h2>Welcome to TetriSeed!</h2>
            <p className="input-prompt">Please enter your name to start playing:</p>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Your Name (5 chars max)"
              className="name-input"
              maxLength={5}
              autoFocus
              ref={nameInputRef}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyEvent}
              onKeyUp={handleKeyEvent}
              onKeyPress={handleKeyEvent}
              style={{ marginBottom: '10px' }}
            />
            {error && <p className="error-message">{error}</p>}
            
            {isMobile && (
              <div className="mobile-notice">
                <p>Play on desktop for best experience</p>
                <p>Use only portrait mode on mobile</p>
              </div>
            )}
            <button onClick={handleSubmit} className="modal-button">&nbsp;Start Playing&nbsp;</button>
            
            <LogoCarousel />
          </>
        )}
        
        {type === 'top10' && (
          <>
            <h2>{getRank() && getRank() <= 10 ? 'Congratulations!' : 'Game Over!'}</h2>
            <p>Your final score: <span className="score-value">{getScoreValue()}</span></p>
            
            {getRank() && getRank() <= 10 ? (
              <p>You've made it to rank #{getRank()} on the competitive leaderboard!</p>
            ) : getRank() ? (
              <p>Your current rank: #{getRank()} on the competitive leaderboard</p>
            ) : (
              <p className="competitive-notice">Only competitive scores are tracked.<br/>Play in competitive mode to join the leaderboard!</p>
            )}
            
            {screenshotUrl && (
              <div className="screenshot-container">
                <img 
                  src={screenshotUrl} 
                  alt="Your game" 
                  className="game-screenshot" 
                />
                <button onClick={downloadScreenshot} className="screenshot-button">
                  Download Screenshot
                </button>
              </div>
            )}
            
            <p className="share-text">Share your achievement:</p>
            <div className="modal-actions">
              <a 
                href={getTweetUrl()} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tweet-button"
              >
                Tweet it!
              </a>
              <button onClick={onClose} className="modal-button">
                Play Again
              </button>
            </div>
          </>
        )}
        
        {type === 'custom' && customContent}
      </div>
    </div>
  );
};

export default Modal; 