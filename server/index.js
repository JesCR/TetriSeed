import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '../public/data');
const leaderboardPath = path.join(dataDir, 'leaderboard.csv');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create empty leaderboard file if it doesn't exist
if (!fs.existsSync(leaderboardPath)) {
  const csvWriter = createObjectCsvWriter({
    path: leaderboardPath,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'score', title: 'Score' },
      { id: 'date', title: 'Date' }
    ]
  });
  csvWriter.writeRecords([]);
}

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  console.log('Received leaderboard request');
  
  // Check if leaderboard file exists
  if (!fs.existsSync(leaderboardPath)) {
    console.log('Leaderboard file not found, creating empty one');
    // Create file with header and sample data
    const sampleData = [
      { name: 'SuperSeed', score: '5000', date: '2023-06-27' },
      { name: 'Player1', score: '3200', date: '2023-06-28' }
    ];
    
    const csvWriter = createObjectCsvWriter({
      path: leaderboardPath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'score', title: 'Score' },
        { id: 'date', title: 'Date' }
      ]
    });
    
    csvWriter.writeRecords(sampleData)
      .then(() => {
        // Send sample data since file was just created
        res.json(sampleData);
      })
      .catch(error => {
        console.error('Error creating leaderboard:', error);
        res.status(500).json({ error: 'Failed to create leaderboard' });
      });
    return;
  }
  
  const results = [];
  
  fs.createReadStream(leaderboardPath)
    .pipe(csvParser())
    .on('data', (data) => {
      console.log('Parsed leaderboard row:', data);
      // Transform data to use lowercase property names consistently
      results.push({
        name: data.Name || data.name || 'Unknown',
        score: data.Score || data.score || '0',
        date: data.Date || data.date || new Date().toISOString().split('T')[0]
      });
    })
    .on('end', () => {
      console.log(`Read ${results.length} entries from leaderboard`);
      // Sort by score (highest first)
      results.sort((a, b) => parseInt(b.score) - parseInt(a.score));
      // Send top 5 (changed from top 10)
      const topScores = results.slice(0, 5);
      console.log('Sending top 5:', topScores);
      res.json(topScores);
    })
    .on('error', (error) => {
      console.error('Error reading leaderboard:', error);
      res.status(500).json({ error: 'Failed to read leaderboard' });
    });
});

// Add new score
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  console.log('Received score submission:', { name, score });
  
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Name and score are required' });
  }

  // Ensure score is a number
  const scoreNum = parseInt(score, 10);
  if (isNaN(scoreNum) || scoreNum < 0) {
    return res.status(400).json({ error: 'Score must be a valid positive number' });
  }

  const newEntry = {
    name: String(name),
    score: String(scoreNum),
    date: new Date().toISOString().split('T')[0]
  };

  console.log('Created new entry:', newEntry);

  // Read existing entries
  const results = [];
  try {
    // Check if file exists first
    if (fs.existsSync(leaderboardPath)) {
      fs.createReadStream(leaderboardPath)
        .pipe(csvParser())
        .on('data', (data) => {
          // Transform data to use consistent property names and validate score
          const scoreValue = parseInt(data.Score || data.score || '0', 10);
          if (!isNaN(scoreValue) && scoreValue >= 0) {
            results.push({
              name: data.Name || data.name || 'Unknown',
              score: String(scoreValue),
              date: data.Date || data.date || new Date().toISOString().split('T')[0]
            });
          }
        })
        .on('end', () => {
          finishSubmission();
        })
        .on('error', (error) => {
          console.error('Error reading leaderboard:', error);
          finishSubmission();
        });
    } else {
      finishSubmission();
    }
  } catch (error) {
    console.error('Error accessing leaderboard file:', error);
    finishSubmission();
  }

  function finishSubmission() {
    // Add new entry
    results.push(newEntry);
    
    console.log('All entries before sort:', results);
    
    // Sort by score (highest first) using numeric comparison
    results.sort((a, b) => parseInt(b.score) - parseInt(a.score));
    
    console.log('Sorted entries:', results);
    
    // Write back to CSV
    const csvWriter = createObjectCsvWriter({
      path: leaderboardPath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'score', title: 'Score' },
        { id: 'date', title: 'Date' }
      ]
    });
    
    csvWriter.writeRecords(results)
      .then(() => {
        // Check if the new entry is in the top 5
        const rank = results.findIndex(entry => 
          entry.name === newEntry.name && 
          parseInt(entry.score) === parseInt(newEntry.score) &&
          entry.date === newEntry.date
        ) + 1;
        
        const isTop5 = rank <= 5;
        
        console.log('Entry saved, rank:', rank, 'isTop5:', isTop5);
        
        res.json({ 
          success: true, 
          isTop5,
          rank
        });
      })
      .catch(error => {
        console.error('Error writing to leaderboard:', error);
        res.status(500).json({ error: 'Failed to update leaderboard' });
      });
  }
});

// Listen on PORT, but try alternative ports if busy
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT); 