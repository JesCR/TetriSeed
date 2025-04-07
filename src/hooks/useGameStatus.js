import { useState, useEffect, useCallback } from 'react';

export const useGameStatus = rowsCleared => {
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(1);
  const [tetrisCleared, setTetrisCleared] = useState(false);

  // Scoring constants - original Tetris scoring system
  const linePoints = [0, 40, 100, 300, 1200]; // Puntuación por líneas: 0, 1, 2, 3, 4 líneas

  const calcScore = useCallback(() => {
    // Check if we have rows cleared
    if (rowsCleared > 0) {
      // Actualizar el estado de tetris completado
      setTetrisCleared(rowsCleared === 4);
      
      // Aplicar puntuación original del Tetris, multiplicada por el nivel actual
      setScore(prev => prev + (linePoints[rowsCleared] * level));
    }
  }, [rowsCleared, linePoints, level]);

  useEffect(() => {
    calcScore();
  }, [calcScore, rowsCleared]);
  
  // Update rows separately to prevent double counting
  useEffect(() => {
    if (rowsCleared > 0) {
      setRows(prev => prev + rowsCleared);
    }
  }, [rowsCleared]);

  // Increase level when player has cleared 10 rows
  useEffect(() => {
    if (rows > level * 10) {
      setLevel(prev => prev + 1);
    }
  }, [level, rows]);

  return [score, setScore, rows, setRows, level, setLevel, tetrisCleared, setTetrisCleared];
}; 