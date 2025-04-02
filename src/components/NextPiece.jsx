import React from 'react';
import { TETROMINOS } from '../utils/tetrisUtils';

// Special cell component for the next piece preview without the $ symbol
const NextPieceCell = ({ type }) => {
  // Determine which Tetromino type to use for styling
  const tetrominoType = typeof type === 'string' && type !== '0' ? type : 0;
  const color = TETROMINOS[tetrominoType].color;
  
  return (
    <div
      style={{
        width: 'auto',
        height: 'auto',
        background: `rgba(${color}, 0.8)`,
        border: type === 0 ? '1px solid #333' : '4px solid',
        borderBottomColor: `rgba(${color}, 0.1)`,
        borderRightColor: `rgba(${color}, 1)`,
        borderTopColor: `rgba(${color}, 1)`,
        borderLeftColor: `rgba(${color}, 0.3)`,
      }}
      className="next-cell"
    />
  );
};

const NextPiece = ({ tetromino }) => {
  // Create a mini grid for the next piece
  // Filter out any empty rows at the beginning
  const grid = tetromino.shape.map(row => [...row]);
  
  return (
    <div className="next-piece-container">
      <div className="next-piece-title">NEXT</div>
      <div className="next-piece-grid">
        {grid.map((row, y) => (
          <div className="next-piece-row" key={y}>
            {row.map((cell, x) => (
              <NextPieceCell key={`next-${y}-${x}`} type={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextPiece; 