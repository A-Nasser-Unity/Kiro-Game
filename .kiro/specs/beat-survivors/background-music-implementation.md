# Background Music Implementation

## Overview
Implemented background music functionality where one of three music tracks (Track1, Track2, Track3) is randomly selected and plays in a loop throughout each game level.

## Features

### 1. Random Track Selection
- Three music tracks available: Track1.mp3, Track2.mp3, Track3.mp3
- One track is randomly selected when the game starts
- Each track has an equal probability of being selected

### 2. Looping Playback
- Selected track plays continuously in a loop
- Loop continues until the game ends (win or lose)
- Volume is set to 50% to not overpower sound effects

### 3. Music Lifecycle
- **Game Start**: Background music begins playing
- **Game Playing**: Music continues looping in the background
- **Game End**: Music stops when win/lose condition is triggered
- **Game Restart**: New random track is selected and plays

## Implementation Details

### Audio Assets
Added three new audio assets to the game:
```javascript
{ name: 'track1', path: 'Track1.wav' },
{ name: 'track2', path: 'Track2.wav' },
{ name: 'track3', path: 'Track3.wav' }
```

### GameManager Methods

#### playBackgroundMusic()
- Selects a random track from the three available
- Sets the audio to loop
- Sets volume to 50%
- Plays the audio
- Stores the current track name for reference

#### stopBackgroundMusic()
- Pauses the currently playing track
- Resets the track to the beginning
- Called when game ends or restarts

### Integration Points

#### start() Method
- Calls `playBackgroundMusic()` when game begins
- Ensures music starts at the same time as gameplay

#### endGame() Method
- Calls `stopBackgroundMusic()` before playing end game audio
- Prevents music from continuing after game ends

#### restartGame() Method
- Calls `stopBackgroundMusic()` before restarting
- Allows a new track to be selected on restart

## Audio Properties

- **Loop**: Enabled (audio.loop = true)
- **Volume**: 50% (audio.volume = 0.5)
- **Format**: WAV (same format as sound effects)
- **Timing**: Starts immediately when game starts

## Testing

Three new integration tests verify the functionality:

1. **Background Music Selection and Playback**
   - Verifies a track is selected when game starts
   - Confirms the track is one of the three available
   - Checks that loop is enabled

2. **Background Music Stops on Game End**
   - Verifies music stops when game ends
   - Confirms audio is paused and reset

3. **Background Music Restarts on Game Restart**
   - Verifies new track is selected on restart
   - Confirms music plays after restart

## Browser Compatibility

- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard HTML5 Audio API
- Graceful fallback if audio files are not found

## Future Enhancements

- Add volume control UI
- Add music selection menu
- Add fade-in/fade-out effects
- Add more music tracks
- Add difficulty-specific music
