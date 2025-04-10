import React, { useEffect, useState, useRef } from 'react';
import './LogoCarousel.css';

// Import all logo images
import velodrome from '../assets/images/car_velodrome.webp';
import bulletx from '../assets/images/car_bulletx.webp';
import seedfi from '../assets/images/car_seedfi.webp'; 
import bebop from '../assets/images/car_bebop.webp';
import ionic from '../assets/images/car_ionic.webp';
import mintpad from '../assets/images/car_mintpad.webp';
import fractalvisions from '../assets/images/car_fractalvisions.webp';
import dolomite from '../assets/images/car_dolomite.webp';
import stryke from '../assets/images/car_stryke.webp';
import marginzero from '../assets/images/car_marginzero.webp';

const LogoCarousel = () => {
  const [isHovered, setIsHovered] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);
  
  // Define the partners data with their logos and links
  const partners = [
    { name: 'Velodrome', logo: velodrome, url: 'https://velodrome.finance/' },
    { name: 'BulletX', logo: bulletx, url: 'https://bulletx.io/' },
    { name: 'SeedFi', logo: seedfi, url: 'https://seedfi.trade/' },
    { name: 'Bebop', logo: bebop, url: 'https://bebop.xyz/trade?network=superseed&buy=' },
    { name: 'Ionic', logo: ionic, url: 'https://www.ionic.money/' },
    { name: 'Mintpad', logo: mintpad, url: 'https://mintpad.co/' },
    { name: 'Fractal Visions', logo: fractalvisions, url: 'https://www.fractalvisions.io/' },
    { name: 'Dolomite', logo: dolomite, url: 'https://dolomite.io/' },
    { name: 'Stryke', logo: stryke, url: 'https://www.stryke.xyz/en/dashboard' },
    { name: 'MarginZero', logo: marginzero, url: 'https://www.marginzero.xyz/' },
    // Duplicate the first few items to create a seamless loop
    { name: 'Velodrome', logo: velodrome, url: 'https://velodrome.finance/' },
    { name: 'BulletX', logo: bulletx, url: 'https://bulletx.io/' },
    { name: 'SeedFi', logo: seedfi, url: 'https://seedfi.trade/' },
    { name: 'Bebop', logo: bebop, url: 'https://bebop.xyz/trade?network=superseed&buy=' },
  ];

  // Handle pause/play animation on hover
  useEffect(() => {
    const trackElement = document.querySelector('.logo-track');
    
    if (trackElement) {
      if (isPaused) {
        trackElement.style.animationPlayState = 'paused';
      } else {
        trackElement.style.animationPlayState = 'running';
      }
    }
  }, [isPaused]);

  // Handle touch events for mobile
  const handleTouchStart = (index) => {
    setIsHovered(index);
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    setIsHovered(null);
    setIsPaused(false);
  };

  return (
    <div 
      className="logo-carousel-container" 
      ref={carouselRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="logo-carousel">
        <div className="logo-track">
          {partners.map((partner, index) => (
            <a
              key={`${partner.name}-${index}`}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`logo-item ${isHovered === index ? 'hovered' : ''}`}
              onMouseEnter={() => setIsHovered(index)}
              onMouseLeave={() => setIsHovered(null)}
              onTouchStart={() => handleTouchStart(index)}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="partner-logo"
              />
              <div className="logo-tooltip">{partner.name}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel; 