# TetriSeed Game Server

![TetriSeed Server](https://raw.githubusercontent.com/JesCR/TetriSeed/refs/heads/main/src/assets/images/logo_text.png)

A Node.js backend server for the TetriSeed game that handles leaderboards, competitive mode scoring, season management, and data persistence.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Data Structure](#data-structure)
- [Season Management](#season-management)
- [Leaderboard Management](#leaderboard-management)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The TetriSeed Game Server is a lightweight, Express-based backend that manages player scores, competitive gameplay data, and season information. The server uses CSV files for data persistence, making it simple to deploy and maintain.

This server acts as the bridge between the TetriSeed game frontend and the blockchain-based competitive mode, storing scores and player information while coordinating with the smart contract for prize distribution.

## Features

- **Dual Leaderboard System**: Manages both casual and competitive gameplay scores
- **Season Management**: Tracks and rotates competitive seasons automatically
- **Wallet Address Verification**: Validates player addresses for competitive mode
- **Score Validation**: Ensures score integrity and prevents duplicates
- **Season History**: Maintains historical records of past seasons and winners
- **Prize Calculation**: Provides distribution information for prize payouts
- **Automatic Data Cleanup**: Removes duplicate entries and maintains data integrity
- **CORS Protection**: Secures API endpoints with proper CORS configuration
- **Scalable Architecture**: Designed to handle growing player bases and game usage

## Prerequisites

Before setting up the TetriSeed server, ensure you have the following:

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [npm](https://www.npmjs.com/) (v6.0.0 or higher)
- Accessible file system for data storage
- Network access for the API endpoints

## Installation

1. Clone the repository (if not already done):
   ```bash
   git clone https://github.com/JesCR/SuperSeedSuperGame.git
   cd SuperSeedSuperGame/server
   ```

2. Install server dependencies:
   ```bash
   npm install
   ```

3. Create the necessary data files (these will be created automatically on first run):
   - `leaderboard.csv`: Casual mode leaderboard
   - `competitive_leaderboard.csv`: Competitive mode leaderboard
   - `season_history.csv`: Historical record of past seasons
   - `season_config.json`: Current season configuration

4. Start the server:
   ```bash
   node index.js
   ```

   The server will start on port 5172 by default (configurable through environment variables).

## Configuration

### Environment Variables

The server supports the following environment variables:

- `PORT`: The port to run the server on (default: 5172)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGIN`: Allowed origins for CORS (default allows the frontend URL)

### Configuration Files

- `season_config.json`: Contains the current season information including:
  - `currentSeason`: Season number
  - `startDate`: ISO string of season start date
  - `endDate`: ISO string of season end date
  - `potSize`: Current prize pool size
  - `playerCount`: Number of players this season
  - `gameCount`: Number of games played this season

## API Endpoints

The server exposes the following RESTful API endpoints:

### GET `/api/leaderboard`

Returns the top 100 scores from the casual mode leaderboard.

**Response:**
```json
[
  {
    "name": "PlayerName",
    "score": "42000",
    "date": "2023-04-01T12:34:56Z"
  },
  ...
]
```

### GET `/api/competitive-leaderboard`

Returns the top 100 scores from the competitive mode leaderboard.

**Response:**
```json
[
  {
    "name": "PlayerName",
    "score": "42000", 
    "date": "2023-04-01T12:34:56Z",
    "address": "0x1234...abcd"
  },
  ...
]
```

### POST `/api/submit-score`

Submits a new score to the casual mode leaderboard.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 42000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score submitted successfully"
}
```

### POST `/api/submit-competitive-score`

Submits a new score to the competitive mode leaderboard.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 42000,
  "address": "0x1234...abcd"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Competitive score submitted successfully"
}
```

### GET `/api/current-season`

Returns information about the current competitive season.

**Response:**
```json
{
  "currentSeason": 1,
  "startDate": "2023-04-03T00:00:00.000Z",
  "endDate": "2023-04-09T23:59:59.999Z",
  "potSize": 10,
  "playerCount": 25,
  "gameCount": 50,
  "daysRemaining": 3,
  "hoursRemaining": 72
}
```

### GET `/api/season-history`

Returns the history of all past seasons with winners.

**Response:**
```json
[
  {
    "season": 1,
    "startDate": "2023-03-27T00:00:00.000Z",
    "endDate": "2023-04-02T23:59:59.999Z",
    "potSize": 20,
    "playerCount": 42,
    "gameCount": 120,
    "winners": [
      {"address": "0x1234...abcd", "prize": "10", "name": "PlayerName1", "rank": 1},
      {"address": "0x5678...efgh", "prize": "6", "name": "PlayerName2", "rank": 2},
      ...
    ]
  },
  ...
]
```

## Data Structure

### Leaderboard CSV Format

The server uses CSV files for data storage:

#### `leaderboard.csv` (Casual Mode)
```
name,score,date
PlayerName,42000,2023-04-01T12:34:56Z
...
```

#### `competitive_leaderboard.csv` (Competitive Mode)
```
name,score,date,address
PlayerName,42000,2023-04-01T12:34:56Z,0x1234...abcd
...
```

#### `season_history.csv` (Season Records)
```
season,startDate,endDate,potSize,playerCount,gameCount,winners
1,2023-03-27T00:00:00.000Z,2023-04-02T23:59:59.999Z,20,42,120,"[{""address"":""0x1234...abcd"",""prize"":""10"",""name"":""PlayerName1"",""rank"":1},...]"
...
```

## Season Management

The server automatically manages competitive seasons:

1. **Season Initialization**: 
   - When the server starts, it checks if `season_config.json` exists
   - If not, it creates a new season starting from the next Monday

2. **Season Rotation**:
   - The server periodically checks if the current season has ended
   - When a season ends, it archives the season data to `season_history.csv`
   - A new season is created starting from the next Monday

3. **Season Data**:
   - Each season tracks the number of players, games played, and prize pool size
   - At the end of a season, the top 5 players are calculated for prize distribution

## Leaderboard Management

The server implements several data integrity measures:

1. **Duplicate Removal**:
   - For competitive mode, only the highest score for each wallet address is kept
   - The server automatically cleans up duplicates on startup

2. **Score Validation**:
   - Scores are validated to ensure they are positive integers
   - Player names are sanitized to prevent injection attacks

3. **Top Player Calculation**:
   - The server can calculate the top 5 players at the end of each season
   - This information is used by the smart contract for prize distribution

## Security Considerations

The server implements several security measures:

1. **CORS Protection**:
   - API requests are validated against allowed origins
   - In production, only requests from the official game domain are accepted

2. **Input Validation**:
   - All user inputs are validated before processing
   - Score submissions are checked for validity

3. **Address Validation**:
   - Ethereum addresses in competitive mode are validated for correct format
   - The server prevents duplicate address entries

4. **Rate Limiting**:
   - Basic rate limiting is applied to prevent abuse of the API endpoints

## Deployment

### Production Deployment

For production deployment, we recommend:

1. **Setting Up PM2**:
   ```bash
   npm install -g pm2
   pm2 start index.js --name tetriseed-server
   ```

2. **Setting Environment Variables**:
   ```
   PORT=5172
   NODE_ENV=production
   CORS_ORIGIN=https://tetriseed.xyz
   ```

3. **Using Reverse Proxy**:
   - Configure Nginx or Apache as a reverse proxy
   - Enable HTTPS with Let's Encrypt certificates

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t tetriseed-server .

# Run the container
docker run -p 5172:5172 -v ./data:/app/data tetriseed-server
```

## Maintenance

### Backup Procedures

It's recommended to regularly backup the data files:

```bash
# Create a backup directory
mkdir -p backups

# Backup the data files
cp *.csv backups/
cp season_config.json backups/
```

### Data Migration

To migrate data to a new server:

1. Copy all CSV files and `season_config.json` to the new server
2. Install dependencies on the new server
3. Start the server, which will automatically load the existing data

## Troubleshooting

### Common Issues

#### Server Won't Start

**Symptoms:** Error messages when starting the server.

**Solution:**
- Check if the port is already in use
- Ensure Node.js is installed correctly
- Verify all dependencies are installed

#### Missing or Corrupted Data

**Symptoms:** Leaderboards missing or showing incorrect data.

**Solution:**
- Check if CSV files exist and have correct format
- Run the cleanup script manually:
  ```bash
  node cleanup-leaderboard.js
  ```
- Restore from backups if necessary

#### CORS Errors

**Symptoms:** Frontend can't connect to the API.

**Solution:**
- Check that the frontend URL matches the CORS_ORIGIN setting
- Verify network connectivity between frontend and server
- Check for any proxy or firewall issues

## Contributing

Contributions to the TetriSeed Server are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 