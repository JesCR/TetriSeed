import { memo } from 'react';
import { TETROMINOS } from '../utils/tetrisUtils';
// Import the logo SVG
import logoSvg from '../assets/images/logo_og.svg';

const Cell = ({ type, cellState }) => {
  // Determine which Tetromino type to use for styling
  const tetrominoType = typeof type === 'string' && type !== '0' ? type : 0;
  const color = TETROMINOS[tetrominoType].color;
  
  // Instead of emoji, use an image element for non-empty cells
  const content = type === 0 ? '' : <img src={logoSvg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  
  // Determine if this cell is in a clearing row
  const isClearing = cellState === 'clearing';
  const isTetrisClearing = cellState === 'tetris-clearing';
  
  // Apply different animation and effects based on the clearing type
  const animationStyle = isClearing 
    ? 'explode-cell 0.4s forwards' 
    : isTetrisClearing 
      ? 'tetris-explode-cell 0.6s forwards' 
      : 'none';
  
  const cellClassName = `cell ${
    isClearing ? 'clearing' : isTetrisClearing ? 'tetris-clearing' : ''
  }`;
  
  return (
    <div
      style={{
        width: 'auto',
        background: `rgba(${color}, ${isClearing || isTetrisClearing ? '1' : '0.8'})`,
        border: type === 0 ? '1px solid #333' : '4px solid',
        borderBottomColor: `rgba(${color}, 0.1)`,
        borderRightColor: `rgba(${color}, 1)`,
        borderTopColor: `rgba(${color}, 1)`,
        borderLeftColor: `rgba(${color}, 0.3)`,
        animation: animationStyle
      }}
      className={cellClassName}
    >
      {content}
    </div>
  );
};

// Optimize with React.memo to prevent unnecessary re-renders
export default memo(Cell); 