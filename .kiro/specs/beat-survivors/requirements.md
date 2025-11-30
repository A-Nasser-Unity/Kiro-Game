# Requirements Document: Beat Survivors

## Introduction

Beat Survivors is a 2D rhythm game where players defend against an approaching monster by hitting musical notes in time with arrow key inputs. The player must maintain a progress bar by successfully hitting notes within precise timing windows. The game ends when either the progress bar fills completely (win) or the monster reaches the player (lose).

## Glossary

- **Player**: The 2D character sprite positioned on the left side of the screen, controlled by the player using arrow keys.
- **Monster**: The 2D character sprite that approaches from the right side toward the player along the X-axis.
- **Note**: A 2D sprite that spawns on the right side and moves left across the screen at a constant speed.
- **Hit Box**: A fixed rectangular region where the player must press the corresponding arrow key to register a hit.
- **Miss Collider**: A fixed rectangular region that detects when a note passes without being hit.
- **Progress Bar**: An HTML/CSS UI element that displays the player's progress toward victory as a percentage.
- **Perfect Hit**: A note hit within a small, precise timing window, awarding +10% progress.
- **Good Hit**: A note hit within a larger timing window, awarding +5% progress.
- **Miss**: A note that passes the miss collider without being hit, triggering a miss effect.
- **Game State**: The current condition of the game (playing, won, or lost).

## Requirements

### Requirement 1: Game Initialization and Setup

**User Story:** As a player, I want the game to load with all sprites and audio assets ready, so that I can start playing immediately.

#### Acceptance Criteria

1. WHEN the game initializes, THE Beat Survivors game SHALL load all sprite images and audio files from relative paths without errors.
2. WHEN the game initializes, THE Beat Survivors game SHALL display the player sprite on the left side of the screen and the monster sprite on the right side.
3. WHEN the game initializes, THE Beat Survivors game SHALL display an empty progress bar at 0% fill.
4. WHEN the game initializes, THE Beat Survivors game SHALL be ready to accept arrow key input.

### Requirement 2: Note Spawning and Movement

**User Story:** As a player, I want notes to spawn at regular intervals and move across the screen, so that I have targets to hit.

#### Acceptance Criteria

1. WHEN the game is running, THE Beat Survivors game SHALL spawn a new note at a configurable interval.
2. WHEN a note spawns, THE Beat Survivors game SHALL position the note on the right side of the screen.
3. WHEN a note is active, THE Beat Survivors game SHALL move the note leftward at a constant, configurable speed.
4. WHEN a note reaches the left edge of the screen, THE Beat Survivors game SHALL remove the note from the game.

### Requirement 3: Input Detection and Hit Registration

**User Story:** As a player, I want my arrow key presses to register as hits when notes overlap the hit box, so that I can score points.

#### Acceptance Criteria

1. WHEN the player presses an arrow key, THE Beat Survivors game SHALL detect the key press and check for overlapping notes in the hit box.
2. WHEN a note overlaps the hit box and the player presses the corresponding arrow key within the perfect timing window, THE Beat Survivors game SHALL register a perfect hit and award +10% progress.
3. WHEN a note overlaps the hit box and the player presses the corresponding arrow key within the good timing window, THE Beat Survivors game SHALL register a good hit and award +5% progress.
4. WHEN the player presses an arrow key and no note is in the hit box, THE Beat Survivors game SHALL not award progress.

### Requirement 4: Miss Detection and Penalty

**User Story:** As a player, I want missed notes to trigger a visual effect and optionally increase monster speed, so that I feel the consequence of mistakes.

#### Acceptance Criteria

1. WHEN a note passes the miss collider without being hit, THE Beat Survivors game SHALL trigger a miss effect animation.
2. WHEN a note passes the miss collider without being hit, THE Beat Survivors game SHALL optionally increase the monster's movement speed.
3. WHEN a miss occurs, THE Beat Survivors game SHALL remove the missed note from the game.

### Requirement 5: Monster Movement and Approach

**User Story:** As a player, I want the monster to move toward me along the X-axis, so that there is a sense of urgency and threat.

#### Acceptance Criteria

1. WHILE the game is running, THE Beat Survivors game SHALL move the monster leftward toward the player at a configurable speed.
2. WHEN the player misses a note, THE Beat Survivors game SHALL optionally increase the monster's movement speed.
3. WHEN the monster reaches the player's position, THE Beat Survivors game SHALL trigger the lose condition.

### Requirement 6: Progress Bar Management

**User Story:** As a player, I want the progress bar to fill when I hit notes, so that I can track my progress toward victory.

#### Acceptance Criteria

1. WHEN the player registers a perfect hit, THE Beat Survivors game SHALL increase the progress bar by 10%.
2. WHEN the player registers a good hit, THE Beat Survivors game SHALL increase the progress bar by 5%.
3. WHILE the game is running, THE Beat Survivors game SHALL display the current progress bar fill percentage on screen.
4. WHEN the progress bar reaches 100%, THE Beat Survivors game SHALL trigger the win condition.

### Requirement 7: Win Condition

**User Story:** As a player, I want to win when the progress bar fills completely, so that I can see the monster defeated.

#### Acceptance Criteria

1. WHEN the progress bar reaches 100%, THE Beat Survivors game SHALL activate the win animation or visual element.
2. WHEN the progress bar reaches 100%, THE Beat Survivors game SHALL stop spawning new notes.
3. WHEN the progress bar reaches 100%, THE Beat Survivors game SHALL stop all game mechanics and display a win message.

### Requirement 8: Lose Condition

**User Story:** As a player, I want to lose when the monster reaches me, so that there is a failure state.

#### Acceptance Criteria

1. WHEN the monster reaches the player's X position, THE Beat Survivors game SHALL activate the lose animation or visual element.
2. WHEN the monster reaches the player's X position, THE Beat Survivors game SHALL stop spawning new notes.
3. WHEN the monster reaches the player's X position, THE Beat Survivors game SHALL stop all game mechanics and display a lose message.

### Requirement 9: Visual Feedback Effects

**User Story:** As a player, I want to see visual feedback for hits and misses, so that I know my actions registered.

#### Acceptance Criteria

1. WHEN the player registers a perfect hit, THE Beat Survivors game SHALL display a "Perfect" visual effect.
2. WHEN the player registers a good hit, THE Beat Survivors game SHALL display a "Good" visual effect.
3. WHEN the player misses a note, THE Beat Survivors game SHALL display a "Miss" visual effect.

### Requirement 10: Audio Feedback

**User Story:** As a player, I want to hear sound effects for hits, misses, and game events, so that I receive audio confirmation of my actions.

#### Acceptance Criteria

1. WHEN the player registers a perfect hit, THE Beat Survivors game SHALL play a "Perfect" sound effect.
2. WHEN the player registers a good hit, THE Beat Survivors game SHALL play a "Good" sound effect.
3. WHEN the player misses a note, THE Beat Survivors game SHALL play a "Miss" sound effect.
4. WHEN the player wins, THE Beat Survivors game SHALL play a "Win" sound effect.
5. WHEN the player loses, THE Beat Survivors game SHALL play a "Lose" sound effect.

### Requirement 11: Difficulty Configuration

**User Story:** As a player, I want to adjust difficulty settings, so that I can customize the game challenge.

#### Acceptance Criteria

1. WHERE difficulty is adjustable, THE Beat Survivors game SHALL allow configuration of note spawn interval.
2. WHERE difficulty is adjustable, THE Beat Survivors game SHALL allow configuration of note movement speed.
3. WHERE difficulty is adjustable, THE Beat Survivors game SHALL allow configuration of monster movement speed.

