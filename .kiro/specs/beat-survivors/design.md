# Design Document: Beat Survivors

## Overview

Beat Survivors is a browser-based 2D rhythm game built with HTML5, CSS3, and vanilla JavaScript. The game uses a canvas-based rendering system for sprites and animations, with HTML/CSS for UI elements like the progress bar. The architecture follows a modular design with separate concerns for game state management, input handling, sprite management, collision detection, and audio playback.

## Architecture

### High-Level Structure

```
Beat Survivors Game
├── Game Manager (main game loop, state management)
├── Input Handler (arrow key detection)
├── Sprite Manager (player, monster, notes)
├── Collision Detector (hit box, miss collider)
├── Progress Manager (progress bar logic)
├── Audio Manager (sound effects)
├── Effect Manager (visual feedback animations)
└── Difficulty Manager (configurable parameters)
```

### Game Loop

The game runs on a requestAnimationFrame loop that:
1. Updates all active sprites (notes, monster)
2. Checks for collisions and hit registrations
3. Updates progress bar and game state
4. Renders all sprites and effects
5. Checks win/lose conditions

## Components and Interfaces

### 1. Game Manager

**Responsibilities:**
- Initialize the game and load assets
- Manage the main game loop
- Track game state (playing, won, lost)
- Coordinate between all subsystems

**Key Methods:**
- `init()`: Load sprites, audio, initialize UI
- `start()`: Begin the game loop
- `update(deltaTime)`: Update all game objects
- `render()`: Draw all sprites and effects
- `checkWinCondition()`: Check if progress bar is full
- `checkLoseCondition()`: Check if monster reached player
- `end(result)`: Handle game end (win/lose)

### 2. Input Handler

**Responsibilities:**
- Detect arrow key presses
- Map key presses to note directions (Up, Down, Left, Right)
- Trigger hit detection when keys are pressed

**Key Methods:**
- `init()`: Attach keyboard event listeners
- `onKeyDown(event)`: Handle key press
- `onKeyUp(event)`: Handle key release
- `getActiveKeys()`: Return currently pressed keys

**Key Mapping:**
- ArrowUp → Up direction
- ArrowDown → Down direction
- ArrowLeft → Left direction
- ArrowRight → Right direction

### 3. Sprite Manager

**Responsibilities:**
- Manage all game sprites (player, monster, notes)
- Handle sprite creation, updates, and removal
- Track sprite positions and velocities

**Sprite Classes:**

#### Player
- Position: Fixed on left side (x: 100, y: center)
- Properties: sprite image, hitbox region
- Methods: `render(ctx)`, `getHitBox()`

#### Monster
- Position: Right side, moves left toward player
- Properties: sprite image, current speed, base speed
- Methods: `update(deltaTime)`, `render(ctx)`, `moveTowardPlayer()`, `increaseSpeed()`

#### Note
- Position: Spawns on right, moves left
- Properties: sprite image, direction (Up/Down/Left/Right), speed, creation time
- Methods: `update(deltaTime)`, `render(ctx)`, `isOffScreen()`, `getPosition()`

**Note Spawning:**
- Notes spawn at configurable intervals (e.g., every 1-2 seconds)
- Each note is assigned a random direction (Up, Down, Left, Right)
- Notes move at a constant, configurable speed

### 4. Collision Detector

**Responsibilities:**
- Detect when notes overlap the hit box
- Detect when notes pass the miss collider
- Determine hit timing (perfect vs. good)

**Key Methods:**
- `checkHitBoxCollision(note, direction)`: Check if note is in hit box
- `checkMissCollision(note)`: Check if note passed miss collider
- `getTimingWindow(note)`: Calculate timing accuracy (perfect/good/miss)

**Timing Windows:**
- Perfect: ±50ms from center of hit box
- Good: ±100ms from center of hit box
- Miss: Note passes miss collider without being hit

### 5. Progress Manager

**Responsibilities:**
- Track progress bar fill percentage
- Update progress on hits
- Manage progress bar UI

**Key Methods:**
- `addProgress(amount)`: Increase progress by amount (5 or 10)
- `getProgress()`: Return current progress percentage
- `isFull()`: Check if progress bar is at 100%
- `updateUI()`: Update progress bar display

**Progress Logic:**
- Perfect hit: +10%
- Good hit: +5%
- Progress bar fills from 0% to 100%

### 6. Audio Manager

**Responsibilities:**
- Load and play sound effects
- Manage audio playback

**Key Methods:**
- `init()`: Load all audio files
- `play(soundName)`: Play a specific sound effect
- `stop(soundName)`: Stop a sound effect

**Sound Effects:**
- Perfect.wav: Perfect hit feedback
- Good.wav: Good hit feedback
- Miss.wav: Miss feedback
- Win.wav: Victory sound
- Lose.wav: Defeat sound

### 7. Effect Manager

**Responsibilities:**
- Create and manage visual feedback animations
- Display temporary effect sprites (Perfect, Good, Miss)

**Key Methods:**
- `createEffect(type, position)`: Create a visual effect
- `update(deltaTime)`: Update all active effects
- `render(ctx)`: Draw all effects

**Effect Types:**
- Perfect: Display "PERFECT.png" at hit location, fade out over 0.5s
- Good: Display "GOOD.png" at hit location, fade out over 0.5s
- Miss: Display "MISS.png" at miss location, fade out over 0.5s

### 8. Difficulty Manager

**Responsibilities:**
- Store and manage difficulty settings
- Provide configurable game parameters

**Key Properties:**
- `noteSpawnInterval`: Time between note spawns (ms)
- `noteSpeed`: Pixels per second for note movement
- `monsterBaseSpeed`: Pixels per second for monster movement
- `monsterSpeedIncrement`: Speed increase on miss (optional)

**Difficulty Presets:**
- Easy: Slower notes, longer spawn intervals, slower monster
- Normal: Balanced settings
- Hard: Faster notes, shorter spawn intervals, faster monster

## Data Models

### Note Object
```javascript
{
  id: unique_identifier,
  direction: 'up' | 'down' | 'left' | 'right',
  x: number,
  y: number,
  speed: number,
  createdAt: timestamp,
  sprite: Image,
  width: number,
  height: number,
  hit: boolean
}
```

### Monster Object
```javascript
{
  x: number,
  y: number,
  baseSpeed: number,
  currentSpeed: number,
  sprite: Image,
  width: number,
  height: number
}
```

### Player Object
```javascript
{
  x: number,
  y: number,
  sprite: Image,
  width: number,
  height: number,
  hitBoxX: number,
  hitBoxY: number,
  hitBoxWidth: number,
  hitBoxHeight: number
}
```

### Game State Object
```javascript
{
  status: 'initializing' | 'playing' | 'won' | 'lost',
  progress: number (0-100),
  score: number,
  monsterX: number,
  notes: Array<Note>,
  effects: Array<Effect>,
  elapsedTime: number
}
```

## Error Handling

### Asset Loading Errors
- If sprite or audio files fail to load, display an error message and prevent game start
- Log errors to console for debugging

### Collision Detection Edge Cases
- Handle notes that spawn outside visible area
- Handle monster reaching player position (trigger lose immediately)
- Handle rapid key presses (only register one hit per note)

### Game State Errors
- Prevent state transitions from invalid states (e.g., can't win while lost)
- Validate progress bar bounds (0-100%)

## Testing Strategy

### Unit Tests
- Test progress bar calculations (perfect hit +10%, good hit +5%)
- Test collision detection logic (hit box overlap, miss collider detection)
- Test timing window calculations (perfect vs. good)
- Test sprite position updates and movement
- Test game state transitions (playing → won/lost)

### Integration Tests
- Test full game flow: initialization → note spawn → hit detection → progress update → win condition
- Test input handling: key press → hit detection → effect display → audio playback
- Test monster movement: speed increase on miss, approach toward player
- Test difficulty settings: verify note speed, spawn interval, monster speed changes

### Manual Testing
- Verify all sprites render correctly
- Verify audio plays on hits, misses, and game end
- Verify progress bar fills correctly
- Verify win/lose conditions trigger at correct times
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)

## File Structure

```
beat-survivors/
├── index.html          # Main HTML file with canvas and UI
├── style.css           # Styling for UI elements
├── main.js             # Main game logic and initialization
├── sprites/            # All sprite images (already in root)
├── audio/              # All audio files (already in root)
└── .kiro/specs/beat-survivors/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Key Design Decisions

1. **Canvas-based Rendering**: Used HTML5 Canvas for sprite rendering to allow smooth animations and efficient updates.

2. **Modular Architecture**: Separated concerns into distinct managers (Input, Sprite, Collision, Progress, Audio, Effect) for maintainability and testability.

3. **requestAnimationFrame Loop**: Used for smooth 60 FPS gameplay and browser optimization.

4. **Configurable Difficulty**: Difficulty settings are centralized in the Difficulty Manager, allowing easy adjustment without code changes.

5. **Timing Windows**: Implemented precise timing detection (perfect ±50ms, good ±100ms) to reward player skill.

6. **Optional Speed Increase on Miss**: Monster speed can optionally increase on miss to add difficulty progression.

7. **Relative Asset Paths**: All sprites and audio use relative paths for easy deployment and portability.

