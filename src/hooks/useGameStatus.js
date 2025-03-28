import { useState, useEffect, useCallback } from 'react';

export const useGameStatus = rowsCleared => {
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(1);

  // Scoring constants - add points per line + linePoints for multiple lines at once
  const POINTS_PER_LINE = 10;
  const linePoints = [40, 100, 300, 1200]; // Bonus for multiple lines

  const calcScore = useCallback(() => {
    // Check if we have rows cleared
    if (rowsCleared > 0) {
      // Add score based on number of cleared rows
      setScore(prev => prev + (rowsCleared * POINTS_PER_LINE));
    }
  }, [rowsCleared, POINTS_PER_LINE]);

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

  return [score, setScore, rows, setRows, level, setLevel];
}; 