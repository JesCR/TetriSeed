import { useState, useEffect } from 'react';
import logoText from '../assets/images/logo_text.png';

const Modal = ({ isOpen, type, score, onClose, onSubmit, customContent }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (type === 'nameInput' && (!name.trim() || name.length < 2)) {
      setError('Please enter a valid name (2-5 characters)');
      return;
    }
    
    // Actively blur any active element (hide keyboard on mobile)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
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
      onSubmit(name);
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
    // Limit name to 5 characters
    const input = e.target.value;
    if (input.length <= 5) {
      setName(input);
      // Clear error if present and name is valid
      if (error && input.trim().length >= 2) {
        setError('');
      }
    }
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
    ? `I just scored ${getScoreValue()} in TetriSeed: Clear your Debt! Ranked #${getRank()} on the leaderboard! @SuperseedXYZ is the best DeFi protocol for loans! #SuperSeed #ClearYourDebt` 
    : `I just scored ${getScoreValue()} in TetriSeed: Clear your Debt! @SuperseedXYZ is the best DeFi protocol for loans! #SuperSeed #ClearYourDebt`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${type === 'custom' ? 
        (customContent && customContent.props && customContent.props.className && 
         customContent.props.className.includes('mobile-warning-modal') ? 
         'custom-modal mobile-modal' : 'custom-modal') : ''}`}>
        {type !== 'custom' && (
          <img src={logoText} alt="SuperSeed Logo" className="modal-logo" />
        )}
        
        {type === 'nameInput' && (
          <>
            <h2>Welcome to TetriSeed!</h2>
            <p>Please enter your name to start playing:</p>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              onFocus={handleInputFocus}
              placeholder="Your Name (5 chars max)"
              className="name-input"
              maxLength={5}
              autoFocus
              inputMode="text"
              pattern="[A-Za-z0-9]+"
            />
            {error && <p className="error-message">{error}</p>}
            {isMobile && (
              <div className="mobile-notice">
                <p>Play on desktop for best experience</p>
                <p>Use only portrait mode on mobile</p>
              </div>
            )}
            <button onClick={handleSubmit} className="modal-button">Start Playing</button>
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
            
            <p>Share your achievement:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a 
                href={tweetUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tweet-button"
              >
                Tweet Your Score
              </a>
              <button onClick={onClose} className="modal-button">Play Again</button>
            </div>
          </>
        )}
        
        {type === 'custom' && customContent}
      </div>
    </div>
  );
};

export default Modal; 