import React, { useState, useEffect } from 'react';
import './StartButton.css';

const StartButton = ({ callback, isCompetitive = false }) => {
  const [showAlternateText, setShowAlternateText] = useState(false);
  const [fadeState, setFadeState] = useState('visible'); // 'visible', 'fading-out', 'fading-in'
  
  const originalText = isCompetitive ? (
    <span>Pay <span className="crypto-amount">1 $SUPR</span> & Take a Loan</span>
  ) : (
    "Ask for a loan"
  );
  
  const alternateText = "Play a Game";

  useEffect(() => {
    const cycleText = () => {
      // Start fade out
      setFadeState('fading-out');
      
      // After fade out, change text and start fade in
      setTimeout(() => {
        setShowAlternateText(prev => !prev);
        setFadeState('fading-in');
        
        // After fade in completes, set to visible state
        setTimeout(() => {
          setFadeState('visible');
          
          // Wait 2 seconds before starting next cycle
          setTimeout(() => {
            cycleText();
          }, 2000);
        }, 1000);
      }, 1000);
    };
    
    // Start the animation cycle
    const animationTimer = setTimeout(cycleText, 2000);
    
    // Clean up timers on unmount
    return () => clearTimeout(animationTimer);
  }, []);

  return (
    <button className="start-button" onClick={callback}>
      <span className={`button-text ${fadeState}`}>
        {showAlternateText ? alternateText : originalText}
      </span>
    </button>
  );
};

export default StartButton; 