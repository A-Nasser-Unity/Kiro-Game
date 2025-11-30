# Implementation Plan: Beat Survivors

- [x] 1. Set up project structure and core HTML/CSS foundation





  - Create index.html with canvas element and progress bar UI
  - Create style.css with styling for game container, progress bar, and game over screens
  - Set up canvas dimensions and basic layout
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Initialize game manager and asset loading




  - Create main.js with Game Manager class
  - Implement asset loading for all sprite images and audio files
  - Implement game initialization that loads all assets and sets up the canvas context
  - Add error handling for failed asset loads
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement sprite classes and sprite manager





  - Create Player class with position, sprite, and hit box properties
  - Create Monster class with position, sprite, speed, and movement methods
  - Create Note class with position, direction, speed, and movement methods
  - Create Sprite Manager to manage collections of sprites
  - _Requirements: 2.1, 2.2, 2.3, 5.1_

- [x] 4. Implement input handler for arrow key detection




  - Create Input Handler class with keyboard event listeners
  - Map arrow keys to directions (Up, Down, Left, Right)
  - Track which keys are currently pressed
  - Implement method to get active keys for hit detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement collision detection system




  - Create Collision Detector class with hit box and miss collider logic
  - Implement hit box collision detection for notes
  - Implement timing window calculation (perfect ±50ms, good ±100ms)
  - Implement miss collider detection for notes that pass without being hit
  - _Requirements: 3.2, 3.3, 4.1_

- [x] 6. Implement progress bar management




  - Create Progress Manager class to track progress percentage
  - Implement addProgress() method to increase progress by 5% or 10%
  - Implement progress bar UI update logic
  - Implement isFull() check for win condition
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Implement audio manager for sound effects





  - Create Audio Manager class to load and play sound effects
  - Load all audio files (Perfect.wav, Good.wav, Miss.wav, Win.wav, Lose.wav)
  - Implement play() method to trigger sound effects
  - Add error handling for audio playback
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Implement visual effect manager




  - Create Effect Manager class to manage temporary visual effects
  - Implement effect creation for Perfect, Good, and Miss feedback
  - Implement effect animation and fade-out logic
  - Implement effect rendering on canvas
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Implement difficulty manager with configurable parameters




  - Create Difficulty Manager class with difficulty presets (Easy, Normal, Hard)
  - Store configurable parameters: noteSpawnInterval, noteSpeed, monsterBaseSpeed
  - Implement method to apply difficulty settings to game
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 10. Implement note spawning system





  - Create note spawning logic in Game Manager
  - Implement configurable spawn interval using difficulty settings
  - Assign random direction to each spawned note
  - Add spawned notes to sprite manager
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 11. Implement monster movement toward player





  - Implement monster movement logic in update loop
  - Move monster leftward at configurable speed
  - Implement speed increase on miss (optional feature)
  - Check for monster reaching player position
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Implement hit detection and registration





  - Integrate input handler with collision detector
  - When arrow key is pressed, check for overlapping notes in hit box
  - Register perfect hit if within ±50ms timing window
  - Register good hit if within ±100ms timing window
  - Update progress bar on successful hits
  - Trigger audio and visual effects on hits
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 13. Implement miss detection and handling





  - Detect when notes pass miss collider without being hit
  - Trigger miss effect animation
  - Optionally increase monster speed on miss
  - Remove missed notes from game
  - Play miss sound effect
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. Implement win condition and end game state




  - Check if progress bar reaches 100% each frame
  - When win condition triggers: stop note spawning, stop game mechanics
  - Display win animation and message
  - Play win sound effect
  - Prevent further input processing
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 15. Implement lose condition and end game state





  - Check if monster reaches player position each frame
  - When lose condition triggers: stop note spawning, stop game mechanics
  - Display lose animation and message
  - Play lose sound effect
  - Prevent further input processing
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 16. Implement main game loop and rendering





  - Create requestAnimationFrame loop in Game Manager
  - Update all sprites (notes, monster) with delta time
  - Update effects with delta time
  - Check collisions and hit registrations
  - Update progress bar
  - Check win/lose conditions
  - Render all sprites and effects to canvas
  - _Requirements: 1.4, 2.3, 5.1, 6.3_

- [x] 17. Integrate all systems and test core gameplay





  - Wire together all managers in Game Manager
  - Test note spawning and movement
  - Test input detection and hit registration
  - Test progress bar updates
  - Test monster movement
  - Test win/lose conditions
  - Verify audio and visual effects trigger correctly
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 18. Write unit tests for core game logic





  - Test progress bar calculations (perfect +10%, good +5%)
  - Test collision detection (hit box overlap, miss collider)
  - Test timing window calculations
  - Test sprite position updates
  - Test game state transitions
  - _Requirements: 1.1, 3.2, 3.3, 4.1, 6.1_

- [x] 19. Write integration tests for full game flow







  - Test initialization → note spawn → hit detection → progress update
  - Test input handling → hit detection → effect display → audio playback
  - Test monster movement and speed increase on miss
  - Test difficulty settings application
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 11.1_

