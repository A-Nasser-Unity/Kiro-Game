// Unit Tests for Beat Survivors Core Game Logic
// Tests focus on: progress bar calculations, collision detection, timing windows, sprite updates, and game state transitions

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('=== Beat Survivors Unit Tests ===\n');
    
    for (const test of this.tests) {
      try {
        await test.testFn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log(`\n=== Results ===`);
    console.log(`Passed: ${this.passed}/${this.tests.length}`);
    console.log(`Failed: ${this.failed}/${this.tests.length}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThan(actual, threshold, message) {
  if (actual <= threshold) {
    throw new Error(message || `Expected ${actual} to be greater than ${threshold}`);
  }
}

function assertLessThan(actual, threshold, message) {
  if (actual >= threshold) {
    throw new Error(message || `Expected ${actual} to be less than ${threshold}`);
  }
}

// ============================================
// PROGRESS BAR TESTS
// ============================================

const runner = new TestRunner();

// Test 1: Progress bar starts at 0%
runner.addTest('Progress bar initializes at 0%', () => {
  const progressManager = new ProgressManager();
  assertEqual(progressManager.getProgress(), 0, 'Progress should start at 0%');
});

// Test 2: Perfect hit adds 10% progress
runner.addTest('Perfect hit adds 10% progress', () => {
  const progressManager = new ProgressManager();
  progressManager.addProgress(10);
  assertEqual(progressManager.getProgress(), 10, 'Progress should be 10% after perfect hit');
});

// Test 3: Good hit adds 5% progress
runner.addTest('Good hit adds 5% progress', () => {
  const progressManager = new ProgressManager();
  progressManager.addProgress(5);
  assertEqual(progressManager.getProgress(), 5, 'Progress should be 5% after good hit');
});

// Test 4: Multiple hits accumulate progress
runner.addTest('Multiple hits accumulate progress correctly', () => {
  const progressManager = new ProgressManager();
  progressManager.addProgress(10); // Perfect hit
  progressManager.addProgress(5);  // Good hit
  progressManager.addProgress(10); // Perfect hit
  assertEqual(progressManager.getProgress(), 25, 'Progress should be 25% after three hits');
});

// Test 5: Progress capped at 100%
runner.addTest('Progress capped at 100%', () => {
  const progressManager = new ProgressManager();
  progressManager.addProgress(50);
  progressManager.addProgress(50);
  progressManager.addProgress(50); // Should not exceed 100%
  assertEqual(progressManager.getProgress(), 100, 'Progress should be capped at 100%');
});

// Test 6: isFull() returns true at 100%
runner.addTest('isFull() returns true when progress is 100%', () => {
  const progressManager = new ProgressManager();
  progressManager.setProgress(100);
  assert(progressManager.isFull(), 'isFull() should return true at 100%');
});

// Test 7: isFull() returns false below 100%
runner.addTest('isFull() returns false when progress is below 100%', () => {
  const progressManager = new ProgressManager();
  progressManager.setProgress(99);
  assert(!progressManager.isFull(), 'isFull() should return false below 100%');
});

// Test 8: Progress reset to 0
runner.addTest('Progress resets to 0%', () => {
  const progressManager = new ProgressManager();
  progressManager.addProgress(50);
  progressManager.reset();
  assertEqual(progressManager.getProgress(), 0, 'Progress should reset to 0%');
});

// ============================================
// COLLISION DETECTION TESTS
// ============================================

// Test 9: Hit box collision detection - note overlaps hit box
runner.addTest('Hit box collision detects overlapping note', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const hitBox = player.getHitBox();
  const note = new Note(
    hitBox.x + 10,
    hitBox.y + 10,
    'up',
    null,
    250
  );
  
  assert(collisionDetector.checkHitBoxCollision(note), 'Should detect note in hit box');
});

// Test 10: Hit box collision detection - note outside hit box
runner.addTest('Hit box collision rejects note outside hit box', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const note = new Note(
    player.x + 200,
    player.y + 200,
    'up',
    null,
    250
  );
  
  assert(!collisionDetector.checkHitBoxCollision(note), 'Should not detect note outside hit box');
});

// Test 11: Direction matching works correctly
runner.addTest('Direction matching validates correct direction', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const note = new Note(100, 100, 'up', null, 250);
  
  assert(collisionDetector.checkDirectionMatch(note, ['up']), 'Should match up direction');
  assert(!collisionDetector.checkDirectionMatch(note, ['down']), 'Should not match down direction');
});

// Test 12: Miss collider detects notes that passed
runner.addTest('Miss collider detects notes that passed without being hit', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const missColliderX = collisionDetector.missColliderX;
  const note = new Note(missColliderX - 50, 300, 'up', null, 250);
  
  assert(collisionDetector.checkMissCollision(note), 'Should detect missed note');
});

// Test 13: Miss collider ignores hit notes
runner.addTest('Miss collider ignores notes already marked as hit', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const missColliderX = collisionDetector.missColliderX;
  const note = new Note(missColliderX - 50, 300, 'up', null, 250);
  note.markAsHit();
  
  assert(!collisionDetector.checkMissCollision(note), 'Should not detect hit note as missed');
});

// ============================================
// TIMING WINDOW TESTS
// ============================================

// Test 14: Perfect timing window calculation
runner.addTest('Timing window correctly identifies perfect hits', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const hitBox = player.getHitBox();
  const centerX = hitBox.x + hitBox.width / 2;
  
  // Create note very close to center (perfect timing)
  const note = new Note(centerX - 5, hitBox.y + 10, 'up', null, 250);
  
  const timing = collisionDetector.getTimingWindow(note);
  assertEqual(timing, 'perfect', 'Should identify perfect timing');
});

// Test 15: Good timing window calculation
runner.addTest('Timing window correctly identifies good hits', () => {
  const player = new Player(100, 300, null);
  const collisionDetector = new CollisionDetector(player);
  
  const hitBox = player.getHitBox();
  const centerX = hitBox.x + hitBox.width / 2;
  
  // Create note at distance that results in good timing
  const note = new Note(centerX - 30, hitBox.y + 10, 'up', null, 250);
  
  const timing = collisionDetector.getTimingWindow(note);
  assertEqual(timing, 'good', 'Should identify good timing');
});

// ============================================
// SPRITE POSITION UPDATE TESTS
// ============================================

// Test 16: Note moves leftward correctly
runner.addTest('Note moves leftward at correct speed', () => {
  const note = new Note(500, 300, 'up', null, 250);
  const initialX = note.x;
  
  note.update(1); // 1 second delta time
  
  assertLessThan(note.x, initialX, 'Note should move left');
  assertEqual(note.x, initialX - 250, 'Note should move 250 pixels in 1 second');
});

// Test 17: Monster moves leftward correctly
runner.addTest('Monster moves leftward at correct speed', () => {
  const monster = new Monster(1000, 300, null, 50);
  const initialX = monster.x;
  
  monster.update(1); // 1 second delta time
  
  assertLessThan(monster.x, initialX, 'Monster should move left');
  assertEqual(monster.x, initialX - 50, 'Monster should move 50 pixels in 1 second');
});

// Test 18: Monster speed increases on miss
runner.addTest('Monster speed increases correctly', () => {
  const monster = new Monster(1000, 300, null, 50);
  const initialSpeed = monster.getSpeed();
  
  monster.increaseSpeed(10);
  
  assertGreaterThan(monster.getSpeed(), initialSpeed, 'Monster speed should increase');
  assertEqual(monster.getSpeed(), 60, 'Monster speed should increase by 10');
});

// Test 19: Monster speed resets to base speed
runner.addTest('Monster speed resets to base speed', () => {
  const monster = new Monster(1000, 300, null, 50);
  
  monster.increaseSpeed(20);
  monster.resetSpeed();
  
  assertEqual(monster.getSpeed(), 50, 'Monster speed should reset to base speed');
});

// Test 20: Note is marked as hit
runner.addTest('Note can be marked as hit', () => {
  const note = new Note(500, 300, 'up', null, 250);
  
  assert(!note.isHit(), 'Note should not be hit initially');
  note.markAsHit();
  assert(note.isHit(), 'Note should be marked as hit');
});

// ============================================
// GAME STATE TRANSITION TESTS
// ============================================

// Test 21: Game state initializes to 'initializing'
runner.addTest('Game state initializes correctly', () => {
  const gameManager = new GameManager();
  assertEqual(gameManager.gameState, 'initializing', 'Game state should start as initializing');
});

// Test 22: Game state transitions to 'ready' after init
runner.addTest('Game state transitions to ready after initialization', async () => {
  // Setup DOM
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 1200;
  canvas.height = 600;
  document.body.appendChild(canvas);

  const progressBar = document.createElement('div');
  progressBar.id = 'progressBar';
  document.body.appendChild(progressBar);

  const progressPercentage = document.createElement('div');
  progressPercentage.id = 'progressPercentage';
  document.body.appendChild(progressPercentage);

  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  document.body.appendChild(gameOverScreen);

  const gameOverMessage = document.createElement('div');
  gameOverMessage.id = 'gameOverMessage';
  gameOverScreen.appendChild(gameOverMessage);

  const restartButton = document.createElement('button');
  restartButton.id = 'restartButton';
  gameOverScreen.appendChild(restartButton);

  const gameManager = new GameManager();
  await gameManager.init();
  
  assertEqual(gameManager.gameState, 'ready', 'Game state should be ready after init');

  // Cleanup
  document.body.removeChild(canvas);
  document.body.removeChild(progressBar);
  document.body.removeChild(progressPercentage);
  document.body.removeChild(gameOverScreen);
});

// Test 23: Win condition detected at 100% progress
runner.addTest('Win condition is detected when progress reaches 100%', () => {
  const progressManager = new ProgressManager();
  progressManager.setProgress(100);
  
  assert(progressManager.isFull(), 'Win condition should be detected at 100% progress');
});

// Test 24: Lose condition detected when monster reaches player
runner.addTest('Lose condition is detected when monster reaches player', () => {
  const player = new Player(100, 300, null);
  const monster = new Monster(150, 300, null, 50);
  
  assert(!monster.hasReachedPlayer(player.x), 'Monster should not have reached player yet');
  
  monster.x = 100;
  assert(monster.hasReachedPlayer(player.x), 'Monster should have reached player');
});

// ============================================
// DIFFICULTY SETTINGS TESTS
// ============================================

// Test 25: Difficulty manager initializes with normal difficulty
runner.addTest('Difficulty manager initializes with normal difficulty', () => {
  const difficultyManager = new DifficultyManager();
  assertEqual(difficultyManager.getDifficulty(), 'normal', 'Should initialize with normal difficulty');
});

// Test 26: Easy difficulty has slower notes than hard
runner.addTest('Easy difficulty has slower notes than hard', () => {
  const difficultyManager = new DifficultyManager();
  
  difficultyManager.setDifficulty('easy');
  const easySpeed = difficultyManager.getNoteSpeed();
  
  difficultyManager.setDifficulty('hard');
  const hardSpeed = difficultyManager.getNoteSpeed();
  
  assertLessThan(easySpeed, hardSpeed, 'Easy notes should be slower than hard');
});

// Test 27: Easy difficulty has longer spawn intervals than hard
runner.addTest('Easy difficulty has longer spawn intervals than hard', () => {
  const difficultyManager = new DifficultyManager();
  
  difficultyManager.setDifficulty('easy');
  const easyInterval = difficultyManager.getNoteSpawnInterval();
  
  difficultyManager.setDifficulty('hard');
  const hardInterval = difficultyManager.getNoteSpawnInterval();
  
  assertGreaterThan(easyInterval, hardInterval, 'Easy spawn interval should be longer than hard');
});

// Test 28: Difficulty settings can be applied
runner.addTest('Difficulty settings are retrievable', () => {
  const difficultyManager = new DifficultyManager();
  difficultyManager.setDifficulty('hard');
  
  const settings = difficultyManager.getCurrentSettings();
  assertEqual(settings.difficulty, 'hard', 'Should retrieve hard difficulty');
  assertGreaterThan(settings.noteSpeed, 0, 'Note speed should be positive');
});

// Test 29: Difficulty resets to normal
runner.addTest('Difficulty resets to normal', () => {
  const difficultyManager = new DifficultyManager();
  difficultyManager.setDifficulty('hard');
  difficultyManager.reset();
  
  assertEqual(difficultyManager.getDifficulty(), 'normal', 'Should reset to normal difficulty');
});

// ============================================
// AUDIO MANAGER TESTS
// ============================================

// Test 30: Audio manager initializes with audio assets
runner.addTest('Audio manager initializes with audio assets', () => {
  const audioManager = new AudioManager();
  const mockAudio = {
    perfect: new Audio(),
    good: new Audio(),
    miss: new Audio(),
    win: new Audio(),
    lose: new Audio()
  };
  
  const initialized = audioManager.init(mockAudio);
  assert(initialized, 'Audio manager should initialize successfully');
});

// Test 31: Audio manager checks if sound exists
runner.addTest('Audio manager can check if sound exists', () => {
  const audioManager = new AudioManager();
  const mockAudio = {
    perfect: new Audio(),
    good: new Audio()
  };
  
  audioManager.init(mockAudio);
  assert(audioManager.soundExists('perfect'), 'Should find perfect sound');
  assert(!audioManager.soundExists('nonexistent'), 'Should not find nonexistent sound');
});

// ============================================
// EFFECT MANAGER TESTS
// ============================================

// Test 32: Effect manager creates effects
runner.addTest('Effect manager creates visual effects', () => {
  const effectManager = new EffectManager();
  const mockSprites = {
    perfect: new Image(),
    good: new Image(),
    miss: new Image()
  };
  
  const initialCount = effectManager.getEffectCount();
  effectManager.createEffect('perfect', { x: 100, y: 100 }, mockSprites);
  
  assertGreaterThan(effectManager.getEffectCount(), initialCount, 'Effect should be created');
});

// Test 33: Effect manager clears effects
runner.addTest('Effect manager clears all effects', () => {
  const effectManager = new EffectManager();
  const mockSprites = {
    perfect: new Image(),
    good: new Image(),
    miss: new Image()
  };
  
  effectManager.createEffect('perfect', { x: 100, y: 100 }, mockSprites);
  effectManager.createEffect('good', { x: 150, y: 150 }, mockSprites);
  
  effectManager.clearEffects();
  assertEqual(effectManager.getEffectCount(), 0, 'All effects should be cleared');
});

// ============================================
// SPRITE MANAGER TESTS
// ============================================

// Test 34: Sprite manager adds and retrieves notes
runner.addTest('Sprite manager adds and retrieves notes', () => {
  const spriteManager = new SpriteManager();
  const note = new Note(500, 300, 'up', null, 250);
  
  spriteManager.addNote(note);
  const notes = spriteManager.getNotes();
  
  assertEqual(notes.length, 1, 'Should have one note');
  assertEqual(notes[0].direction, 'up', 'Note should have correct direction');
});

// Test 35: Sprite manager removes notes
runner.addTest('Sprite manager removes notes', () => {
  const spriteManager = new SpriteManager();
  const note = new Note(500, 300, 'up', null, 250);
  
  spriteManager.addNote(note);
  spriteManager.removeNote(note.id);
  
  assertEqual(spriteManager.getNotes().length, 0, 'Note should be removed');
});

// Test 36: Sprite manager clears all notes
runner.addTest('Sprite manager clears all notes', () => {
  const spriteManager = new SpriteManager();
  
  spriteManager.addNote(new Note(500, 300, 'up', null, 250));
  spriteManager.addNote(new Note(600, 300, 'down', null, 250));
  spriteManager.addNote(new Note(700, 300, 'left', null, 250));
  
  spriteManager.clearNotes();
  assertEqual(spriteManager.getNoteCount(), 0, 'All notes should be cleared');
});

// ============================================
// INPUT HANDLER TESTS
// ============================================

// Test 37: Input handler tracks key presses
runner.addTest('Input handler tracks key presses', () => {
  const inputHandler = new InputHandler();
  
  inputHandler.keysPressed['ArrowUp'] = true;
  const activeKeys = inputHandler.getActiveKeys();
  
  assert(activeKeys.includes('up'), 'Should detect up arrow key');
});

// Test 38: Input handler maps keys to directions
runner.addTest('Input handler maps all arrow keys to directions', () => {
  const inputHandler = new InputHandler();
  
  inputHandler.keysPressed['ArrowUp'] = true;
  inputHandler.keysPressed['ArrowDown'] = true;
  inputHandler.keysPressed['ArrowLeft'] = true;
  inputHandler.keysPressed['ArrowRight'] = true;
  
  const activeKeys = inputHandler.getActiveKeys();
  
  assert(activeKeys.includes('up'), 'Should map ArrowUp to up');
  assert(activeKeys.includes('down'), 'Should map ArrowDown to down');
  assert(activeKeys.includes('left'), 'Should map ArrowLeft to left');
  assert(activeKeys.includes('right'), 'Should map ArrowRight to right');
});

// Test 39: Input handler resets keys
runner.addTest('Input handler resets all keys', () => {
  const inputHandler = new InputHandler();
  
  inputHandler.keysPressed['ArrowUp'] = true;
  inputHandler.keysPressed['ArrowDown'] = true;
  inputHandler.resetKeys();
  
  const activeKeys = inputHandler.getActiveKeys();
  assertEqual(activeKeys.length, 0, 'All keys should be reset');
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runner };
}
