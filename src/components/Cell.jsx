import { memo } from 'react';
import { TETROMINOS } from '../utils/tetrisUtils';

const Cell = ({ type }) => {
  // Determine which Tetromino type to use for styling
  const tetrominoType = typeof type === 'string' && type !== '0' ? type : 0;
  const color = TETROMINOS[tetrominoType].color;
  
  // Display a $ symbol for all non-empty cells
  const content = type === 0 ? '' : '$';
  
  return (
    <div
      style={{
        width: 'auto',
        background: `rgba(${color}, 0.8)`,
        border: type === 0 ? '1px solid #333' : '4px solid',
        borderBottomColor: `rgba(${color}, 0.1)`,
        borderRightColor: `rgba(${color}, 1)`,
        borderTopColor: `rgba(${color}, 1)`,
        borderLeftColor: `rgba(${color}, 0.3)`,
      }}
      className="cell"
    >
      {content}
    </div>
  );
};

// Optimize with React.memo to prevent unnecessary re-renders
export default memo(Cell); 