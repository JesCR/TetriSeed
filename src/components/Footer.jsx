import React from 'react';

const Footer = () => {
  return (
    <div className="main-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/JesCR/TetriSeed" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://x.com/xJesCR" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href="https://contest.superseed.xyz/" target="_blank" rel="noopener noreferrer">
            Tesla Contest
          </a>
        </div>
        <div className="footer-love">
          Made with <span className="heart">❤️</span> for SuperSeed community
        </div>
      </div>
    </div>
  );
};

export default Footer; 