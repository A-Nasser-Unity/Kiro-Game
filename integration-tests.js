// Integration Tests for Beat Survivors - Full Game Flow
// Tests the complete integration of all game systems working together

class IntegrationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.testResults = [];
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('=== Beat Survivors Integration Tests ===\n');
    
    for (const test of this.tests) {
      try {
        await test.testFn();
        this.passed++;
        this.testResults.push({ name: test.name, status: 'passed', error: null });
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        this.testResults.push({ name: test.name, status: 'failed', error: error.message });
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log(`\n=== Results ===`);
    console.log(`Passed: ${this.passed}/${this.tests.length}`);
    console.log(`Failed: ${this.failed}/${this.tests.length}`);
    
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.tests.length,
      results: this.testResults
    };
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

function assertArrayIncludes(array, value, message) {
  if (!array.includes(value)) {
    throw new Error(message || `Expected array to include ${value}`);
  }
}

// Setup test environment with DOM elements
function setupTestEnvironment() {
  // Remove existing elements if they exist
  const existingCanvas = document.getElementById('gameCanvas');
  if (existingCanvas) existingCanvas.remove();
  const existingProgressBar = document.getElementById('progressBar');
  if (existingProgressBar) existingProgressBar.remove();
  const existingProgressPercentage = document.getElementById('progressPercentage');
  if (existingProgressPercentage) existingProgressPercentage.remove();
  const existingGameOverScreen = document.getElementById('gameOverScreen');
  if (existingGameOverScreen) existingGameOverScreen.remove();

  // Create mock canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 1200;
  canvas.height = 600;
  document.body.appendChild(canvas);

  // Create mock progress bar elements
  const progressBar = document.createElement('div');
  progressBar.id = 'progressBar';
  progressBar.style.width = '0%';
  document.body.appendChild(progressBar);

  const progressPercentage = document.createElement('div');
  progressPercentage.id = 'progressPercentage';
  progressPercentage.textContent = '0%';
  document.body.appendChild(progressPercentage);

  // Create mock game over screen
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  gameOverScreen.style.display = 'none';
  document.body.appendChild(gameOverScreen);

  const gameOverMessage = document.createElement('div');
  gameOverMessage.id = 'gameOverMessage';
  gameOverScreen.appendChild(gameOverMessage);

  // Create mock restart button
  const restartButton = document.createElement('button');
  restartButton.id = 'restartButton';
  gameOverScreen.appendChild(restartButton);
}

// ============================================
// INTEGRATION TEST 1: Full Game Initialization Flow
// ============================================

const integrationRunner = new IntegrationTestRunner();

integrationRunner.addTest('Full game initialization flow', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  const initialized = await gameManager.init();
  
  assert(initialized, 'Game should initialize successfully');
  assertEqual(gameManager.gameState, 'ready', 'Game state should be ready');
  
  // Verify all subsystems are initialized
  assert(gameManager.inputHandler, 'Input handler should be initialized');
  assert(gameManager.audioManager, 'Audio manager should be initialized');
  assert(gameManager.effectManager, 'Effect manager should be initialized');
  assert(gameManager.difficultyManager, 'Difficulty manager should be initialized');
  assert(gameManager.spriteManager, 'Sprite manager should be initialized');
  assert(gameManager.progressManager, 'Progress manager should be initialized');
  assert(gameManager.collisionDetector, 'Collision detector should be initialized');
  
  // Verify sprites are created
  assert(gameManager.spriteManager.getPlayer(), 'Player sprite should be created');
  assert(gameManager.spriteManager.getMonster(), 'Monster sprite should be created');
  
  // Verify progress bar is at 0%
  assertEqual(gameManager.progressManager.getProgress(), 0, 'Progress should start at 0%');
});

// ============================================
// INTEGRATION TEST 2: Note Spawn → Hit Detection → Progress Update
// ============================================

integrationRunner.addTest('Note spawn → hit detection → progress update flow', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  // Spawn a note
  const initialNoteCount = gameManager.spriteManager.getNoteCount();
  gameManager.spawnNote();
  const afterSpawnCount = gameManager.spriteManager.getNoteCount();
  
  assertGreaterThan(afterSpawnCount, initialNoteCount, 'Note should be spawned');
  
  // Get the spawned note
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  assert(note, 'Note should exist');
  assertArrayIncludes(['up', 'down', 'left', 'right'], note.direction, 'Note should have valid direction');
  
  // Move note into hit box
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  note.x = hitBox.x + 10;
  note.y = hitBox.y + 10;
  
  // Simulate input for the note's direction
  gameManager.inputHandler.keysPressed[
    Object.entries(gameManager.inputHandler.keyToDirection)
      .find(([_, dir]) => dir === note.direction)[0]
  ] = true;
  
  // Process hit
  const initialProgress = gameManager.progressManager.getProgress();
  gameManager.processInputAndHits();
  const afterHitProgress = gameManager.progressManager.getProgress();
  
  assertGreaterThan(afterHitProgress, initialProgress, 'Progress should increase after hit');
  assert(note.isHit(), 'Note should be marked as hit');
});

// ============================================
// INTEGRATION TEST 3: Input Handling → Hit Detection → Effect Display → Audio Playback
// ============================================

integrationRunner.addTest('Input handling → hit detection → effect display → audio playback', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  // Spawn a note
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  // Position note in hit box
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  note.x = hitBox.x + 5;
  note.y = hitBox.y + 5;
  
  // Simulate input
  const directionKey = Object.entries(gameManager.inputHandler.keyToDirection)
    .find(([_, dir]) => dir === note.direction)[0];
  gameManager.inputHandler.keysPressed[directionKey] = true;
  
  // Get initial effect count
  const initialEffectCount = gameManager.effectManager.getEffectCount();
  
  // Process hit
  gameManager.processInputAndHits();
  
  // Verify effect was created
  const afterEffectCount = gameManager.effectManager.getEffectCount();
  assertGreaterThan(afterEffectCount, initialEffectCount, 'Visual effect should be created');
  
  // Verify audio manager has the sound
  assert(gameManager.audioManager.soundExists('perfect') || gameManager.audioManager.soundExists('good'), 
    'Audio should be available for playback');
  
  // Verify note is marked as hit
  assert(note.isHit(), 'Note should be marked as hit');
});

// ============================================
// INTEGRATION TEST 4: Monster Movement and Speed Increase on Miss
// ============================================

integrationRunner.addTest('Monster movement and speed increase on miss', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  const monster = gameManager.spriteManager.getMonster();
  const initialX = monster.x;
  const initialSpeed = monster.getSpeed();
  
  // Update monster
  monster.update(1); // 1 second
  const afterUpdateX = monster.x;
  
  assertLessThan(afterUpdateX, initialX, 'Monster should move leftward');
  
  // Spawn a note and let it pass without being hit
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  // Move note past miss collider
  note.x = gameManager.collisionDetector.missColliderX - 50;
  
  // Check for miss
  gameManager.checkMissedNotes();
  
  // Verify monster speed increased
  const afterMissSpeed = monster.getSpeed();
  assertGreaterThan(afterMissSpeed, initialSpeed, 'Monster speed should increase on miss');
});

// ============================================
// INTEGRATION TEST 5: Difficulty Settings Application
// ============================================

integrationRunner.addTest('Difficulty settings application', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Test easy difficulty
  gameManager.difficultyManager.setDifficulty('easy');
  const easySettings = gameManager.difficultyManager.getCurrentSettings();
  
  assertEqual(easySettings.difficulty, 'easy', 'Difficulty should be set to easy');
  assertGreaterThan(easySettings.noteSpawnInterval, 0, 'Easy spawn interval should be positive');
  assertGreaterThan(easySettings.noteSpeed, 0, 'Easy note speed should be positive');
  
  // Test hard difficulty
  gameManager.difficultyManager.setDifficulty('hard');
  const hardSettings = gameManager.difficultyManager.getCurrentSettings();
  
  assertEqual(hardSettings.difficulty, 'hard', 'Difficulty should be set to hard');
  assertGreaterThan(hardSettings.noteSpeed, easySettings.noteSpeed, 'Hard notes should be faster than easy');
  assertLessThan(hardSettings.noteSpawnInterval, easySettings.noteSpawnInterval, 'Hard spawn interval should be shorter than easy');
  
  // Apply difficulty to game
  const applied = gameManager.difficultyManager.applyDifficultyToGame(
    gameManager.spriteManager,
    gameManager
  );
  
  assert(applied, 'Difficulty settings should be applied to game');
});

// ============================================
// INTEGRATION TEST 6: Win Condition Flow
// ============================================

integrationRunner.addTest('Win condition flow', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  // Set progress to 100%
  gameManager.progressManager.setProgress(100);
  
  // Check win condition
  gameManager.checkGameConditions();
  
  assertEqual(gameManager.gameState, 'won', 'Game state should be won');
  
  // Verify game over screen is displayed
  const gameOverScreen = document.getElementById('gameOverScreen');
  assertEqual(gameOverScreen.style.display, 'flex', 'Game over screen should be displayed');
  
  const gameOverMessage = document.getElementById('gameOverMessage');
  assert(gameOverMessage.textContent.includes('WIN'), 'Win message should be displayed');
});

// ============================================
// INTEGRATION TEST 7: Lose Condition Flow
// ============================================

integrationRunner.addTest('Lose condition flow', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  const player = gameManager.spriteManager.getPlayer();
  const monster = gameManager.spriteManager.getMonster();
  
  // Move monster to player position
  monster.x = player.x;
  
  // Check lose condition
  gameManager.checkGameConditions();
  
  assertEqual(gameManager.gameState, 'lost', 'Game state should be lost');
  
  // Verify game over screen is displayed
  const gameOverScreen = document.getElementById('gameOverScreen');
  assertEqual(gameOverScreen.style.display, 'flex', 'Game over screen should be displayed');
  
  const gameOverMessage = document.getElementById('gameOverMessage');
  assert(gameOverMessage.textContent.includes('LOSE'), 'Lose message should be displayed');
});

// ============================================
// INTEGRATION TEST 8: Game Restart Flow
// ============================================

integrationRunner.addTest('Game restart flow', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  // Set up game state as if it's been played
  gameManager.progressManager.setProgress(50);
  gameManager.spawnNote();
  gameManager.spawnNote();
  
  // End game
  gameManager.endGame('won');
  
  assertEqual(gameManager.gameState, 'won', 'Game should be in won state');
  assertGreaterThan(gameManager.spriteManager.getNoteCount(), 0, 'Notes should exist before restart');
  
  // Restart game
  gameManager.restartGame();
  
  assertEqual(gameManager.gameState, 'playing', 'Game state should be playing after restart');
  assertEqual(gameManager.progressManager.getProgress(), 0, 'Progress should reset to 0%');
  assertEqual(gameManager.spriteManager.getNoteCount(), 0, 'All notes should be cleared');
  
  const gameOverScreen = document.getElementById('gameOverScreen');
  assertEqual(gameOverScreen.style.display, 'none', 'Game over screen should be hidden');
});

// ============================================
// INTEGRATION TEST 9: Multiple Hits and Progress Accumulation
// ============================================

integrationRunner.addTest('Multiple hits and progress accumulation', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  
  // Simulate multiple hits
  for (let i = 0; i < 5; i++) {
    gameManager.spawnNote();
    const notes = gameManager.spriteManager.getNotes();
    const note = notes[notes.length - 1];
    
    // Position in hit box
    note.x = hitBox.x + 10;
    note.y = hitBox.y + 10;
    
    // Simulate input
    const directionKey = Object.entries(gameManager.inputHandler.keyToDirection)
      .find(([_, dir]) => dir === note.direction)[0];
    gameManager.inputHandler.keysPressed[directionKey] = true;
    
    // Process hit
    gameManager.processInputAndHits();
    
    gameManager.inputHandler.keysPressed[directionKey] = false;
  }
  
  // Verify progress accumulated
  const progress = gameManager.progressManager.getProgress();
  assertGreaterThan(progress, 0, 'Progress should accumulate from multiple hits');
});

// ============================================
// INTEGRATION TEST 10: Note Lifecycle (Spawn → Move → Hit/Miss → Remove)
// ============================================

integrationRunner.addTest('Note lifecycle (spawn → move → hit/miss → remove)', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  // Spawn note
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  const initialX = note.x;
  
  // Update note (move)
  note.update(1); // 1 second
  const afterUpdateX = note.x;
  
  assertLessThan(afterUpdateX, initialX, 'Note should move leftward');
  
  // Move note off screen
  note.x = -100;
  
  // Remove off-screen notes
  gameManager.spriteManager.removeOffScreenNotes(gameManager.canvas.width);
  
  assertEqual(gameManager.spriteManager.getNoteCount(), 0, 'Off-screen note should be removed');
});

// ============================================
// INTEGRATION TEST 11: Collision Detection with Multiple Notes
// ============================================

integrationRunner.addTest('Collision detection with multiple notes', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  
  // Spawn multiple notes
  gameManager.spawnNote();
  gameManager.spawnNote();
  gameManager.spawnNote();
  
  const notes = gameManager.spriteManager.getNotes();
  assertEqual(notes.length, 3, 'Three notes should be spawned');
  
  // Position first note in hit box
  notes[0].x = hitBox.x + 10;
  notes[0].y = hitBox.y + 10;
  
  // Position other notes outside hit box
  notes[1].x = hitBox.x - 100;
  notes[2].x = hitBox.x + 200;
  
  // Simulate input for first note's direction
  const directionKey = Object.entries(gameManager.inputHandler.keyToDirection)
    .find(([_, dir]) => dir === notes[0].direction)[0];
  gameManager.inputHandler.keysPressed[directionKey] = true;
  
  // Process hits
  gameManager.processInputAndHits();
  
  // Verify only first note is hit
  assert(notes[0].isHit(), 'First note should be hit');
  assert(!notes[1].isHit(), 'Second note should not be hit');
  assert(!notes[2].isHit(), 'Third note should not be hit');
});

// ============================================
// INTEGRATION TEST 12: Audio and Visual Effects Synchronization
// ============================================

integrationRunner.addTest('Audio and visual effects synchronization', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster (simulate 3 second delay)
  gameManager.monsterHasStarted = true;
  
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  
  // Spawn note
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  // Position in hit box
  note.x = hitBox.x + 10;
  note.y = hitBox.y + 10;
  
  // Simulate input
  const directionKey = Object.entries(gameManager.inputHandler.keyToDirection)
    .find(([_, dir]) => dir === note.direction)[0];
  gameManager.inputHandler.keysPressed[directionKey] = true;
  
  const initialEffectCount = gameManager.effectManager.getEffectCount();
  
  // Process hit
  gameManager.processInputAndHits();
  
  const afterEffectCount = gameManager.effectManager.getEffectCount();
  
  // Verify effect was created
  assertGreaterThan(afterEffectCount, initialEffectCount, 'Visual effect should be created');
  
  // Verify audio exists
  const audioManager = gameManager.audioManager;
  assert(audioManager.soundExists('perfect') || audioManager.soundExists('good'), 
    'Audio should be available');
});

// ============================================
// INTEGRATION TEST 13: Game Loop Continuity
// ============================================

integrationRunner.addTest('Game loop continuity', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  // Simulate multiple game loop iterations
  const initialNoteCount = gameManager.spriteManager.getNoteCount();
  
  // Spawn notes
  gameManager.spawnNote();
  gameManager.spawnNote();
  
  const afterSpawnCount = gameManager.spriteManager.getNoteCount();
  assertGreaterThan(afterSpawnCount, initialNoteCount, 'Notes should be spawned');
  
  // Update sprites
  gameManager.spriteManager.update(0.016); // ~60 FPS
  
  // Update effects
  gameManager.effectManager.update(0.016);
  
  // Verify game is still in playing state
  assertEqual(gameManager.gameState, 'playing', 'Game should remain in playing state');
});

// ============================================
// INTEGRATION TEST 14: Difficulty Progression During Gameplay
// ============================================

integrationRunner.addTest('Difficulty progression during gameplay', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Start with normal difficulty
  gameManager.difficultyManager.setDifficulty('normal');
  const normalSettings = gameManager.difficultyManager.getCurrentSettings();
  
  // Switch to hard
  gameManager.difficultyManager.setDifficulty('hard');
  const hardSettings = gameManager.difficultyManager.getCurrentSettings();
  
  // Verify settings changed
  assertGreaterThan(hardSettings.noteSpeed, normalSettings.noteSpeed, 
    'Hard difficulty should have faster notes');
  assertLessThan(hardSettings.noteSpawnInterval, normalSettings.noteSpawnInterval, 
    'Hard difficulty should have shorter spawn intervals');
  
  // Apply to game
  gameManager.difficultyManager.applyDifficultyToGame(
    gameManager.spriteManager,
    gameManager
  );
  
  // Verify monster speed updated
  const monster = gameManager.spriteManager.getMonster();
  assertEqual(monster.baseSpeed, hardSettings.monsterBaseSpeed, 
    'Monster base speed should match difficulty setting');
});

// ============================================
// INTEGRATION TEST 15: Monster 3-Second Delay Before Movement
// ============================================

integrationRunner.addTest('Monster 3-second delay before movement and note spawning', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  gameManager.gameStartTime = Date.now();
  gameManager.monsterHasStarted = false;
  
  const monster = gameManager.spriteManager.getMonster();
  const initialMonsterX = monster.x;
  
  // Update monster before 3 seconds (should not move)
  gameManager.spriteManager.update(0.016, gameManager.monsterHasStarted);
  const monsterXAfterUpdate = monster.x;
  
  assertEqual(monsterXAfterUpdate, initialMonsterX, 'Monster should not move before 3 seconds');
  
  // Simulate 3 seconds passing
  gameManager.gameStartTime = Date.now() - 3100; // 3.1 seconds ago
  gameManager.updateNoteSpawning(); // This will set monsterHasStarted to true
  
  assert(gameManager.monsterHasStarted, 'Monster should have started after 3 seconds');
  
  // Now update monster (should move)
  gameManager.spriteManager.update(1, gameManager.monsterHasStarted);
  const monsterXAfterDelay = monster.x;
  
  assertLessThan(monsterXAfterDelay, initialMonsterX, 'Monster should move after 3 seconds');
});

// ============================================
// INTEGRATION TEST 16: Notes Don't Spawn Until Monster Starts
// ============================================

integrationRunner.addTest('Notes do not spawn until monster starts moving', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  gameManager.gameStartTime = Date.now();
  gameManager.monsterHasStarted = false;
  gameManager.lastNoteSpawnTime = Date.now();
  
  // Try to spawn notes before monster starts
  gameManager.updateNoteSpawning();
  
  assertEqual(gameManager.spriteManager.getNoteCount(), 0, 'No notes should spawn before monster starts');
  
  // Simulate 3 seconds passing
  gameManager.gameStartTime = Date.now() - 3100; // 3.1 seconds ago
  gameManager.updateNoteSpawning(); // This will set monsterHasStarted to true
  
  assert(gameManager.monsterHasStarted, 'Monster should have started');
  
  // Now try to spawn notes (should work)
  gameManager.updateNoteSpawning();
  
  assertGreaterThan(gameManager.spriteManager.getNoteCount(), 0, 'Notes should spawn after monster starts');
});

// ============================================
// INTEGRATION TEST 17: Background Music Selection and Playback
// ============================================

integrationRunner.addTest('Background music selection and playback', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Start game (should play background music)
  gameManager.start();
  
  // Verify a music track was selected
  assert(gameManager.currentMusicTrack, 'A music track should be selected');
  assertArrayIncludes(['track1', 'track2', 'track3'], gameManager.currentMusicTrack, 
    'Selected track should be one of the three available tracks');
  
  // Verify the audio element exists
  const audio = gameManager.assets.audio[gameManager.currentMusicTrack];
  assert(audio, 'Audio element should exist for selected track');
  
  // Verify audio is set to loop
  assert(audio.loop, 'Background music should be set to loop');
  
  // Verify volume is set
  assertGreaterThan(audio.volume, 0, 'Background music volume should be greater than 0');
});

// ============================================
// INTEGRATION TEST 18: Background Music Stops on Game End
// ============================================

integrationRunner.addTest('Background music stops when game ends', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  // Start game
  gameManager.start();
  
  const currentTrack = gameManager.currentMusicTrack;
  assert(currentTrack, 'Music track should be playing');
  
  // End the game
  gameManager.endGame('won');
  
  // Verify music was stopped
  const audio = gameManager.assets.audio[currentTrack];
  assert(audio.paused, 'Background music should be paused when game ends');
  assertEqual(audio.currentTime, 0, 'Background music should be reset to start');
});

// ============================================
// INTEGRATION TEST 19: Background Music Restarts on Game Restart
// ============================================

integrationRunner.addTest('Background music restarts when game restarts', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  gameManager.gameState = 'playing';
  
  // Start game
  gameManager.start();
  const firstTrack = gameManager.currentMusicTrack;
  
  // End game
  gameManager.endGame('won');
  
  // Restart game
  gameManager.restartGame();
  
  // Verify a new music track is playing (may be same or different)
  assert(gameManager.currentMusicTrack, 'A music track should be selected after restart');
  assertArrayIncludes(['track1', 'track2', 'track3'], gameManager.currentMusicTrack, 
    'Selected track should be one of the three available tracks');
});

// ============================================
// INTEGRATION TEST 20: Complete Game Session (Initialization → Play → Win)
// ============================================

integrationRunner.addTest('Complete game session (initialization → play → win)', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  const initialized = await gameManager.init();
  
  assert(initialized, 'Game should initialize');
  assertEqual(gameManager.gameState, 'ready', 'Game should be ready');
  
  // Start game
  gameManager.start();
  assertEqual(gameManager.gameState, 'playing', 'Game should be playing');
  
  // Simulate gameplay
  gameManager.progressManager.setProgress(100);
  gameManager.checkGameConditions();
  
  assertEqual(gameManager.gameState, 'won', 'Game should end in won state');
  
  // Verify game over screen
  const gameOverScreen = document.getElementById('gameOverScreen');
  assertEqual(gameOverScreen.style.display, 'flex', 'Game over screen should be visible');
});

// ============================================
// INTEGRATION TEST 21: Random Monster Selection
// ============================================

integrationRunner.addTest('Random monster selection at game start', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const monster = gameManager.spriteManager.getMonster();
  assert(monster, 'Monster should be created');
  assert(monster.sprite, 'Monster should have a sprite');
  
  // Verify monster sprite is one of the three available
  const monsterSprites = [
    gameManager.assets.sprites.monster1,
    gameManager.assets.sprites.monster2,
    gameManager.assets.sprites.monster3
  ];
  
  assert(monsterSprites.includes(monster.sprite), 'Monster sprite should be one of the three available');
});

// ============================================
// INTEGRATION TEST 22: Monster Speed Reduction (80% reduction)
// ============================================

integrationRunner.addTest('Monster speed reduced by 80%', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const monster = gameManager.spriteManager.getMonster();
  const difficultyManager = gameManager.difficultyManager;
  
  // Get the original base speed from difficulty settings
  const originalBaseSpeed = difficultyManager.getMonsterBaseSpeed();
  
  // Monster speed should be 20% of original (80% reduction)
  const expectedSpeed = originalBaseSpeed * 0.2;
  
  assertEqual(monster.baseSpeed, expectedSpeed, 
    `Monster base speed should be 20% of original (${expectedSpeed}), but got ${monster.baseSpeed}`);
  
  // Verify current speed is also reduced
  assertEqual(monster.currentSpeed, expectedSpeed, 
    'Monster current speed should match reduced base speed');
});

// ============================================
// INTEGRATION TEST 23: Multiple Game Sessions Have Different Monsters
// ============================================

integrationRunner.addTest('Different game sessions can have different monsters', async () => {
  setupTestEnvironment();
  
  const gameManager1 = new GameManager();
  await gameManager1.init();
  const monster1Sprite = gameManager1.spriteManager.getMonster().sprite;
  
  // Clean up first game
  const canvas1 = document.getElementById('gameCanvas');
  if (canvas1) canvas1.remove();
  
  setupTestEnvironment();
  
  const gameManager2 = new GameManager();
  await gameManager2.init();
  const monster2Sprite = gameManager2.spriteManager.getMonster().sprite;
  
  // Both should be valid monster sprites
  const monsterSprites = [
    gameManager2.assets.sprites.monster1,
    gameManager2.assets.sprites.monster2,
    gameManager2.assets.sprites.monster3
  ];
  
  assert(monsterSprites.includes(monster1Sprite), 'First monster should be valid');
  assert(monsterSprites.includes(monster2Sprite), 'Second monster should be valid');
  
  // Note: They might be the same or different due to randomness
  console.log('Monster selection is random - different sessions may have same or different monsters');
});

// ============================================
// INTEGRATION TEST 24: Player Sprite Scaling (2x)
// ============================================

integrationRunner.addTest('Player sprite scaled by 2x', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const player = gameManager.spriteManager.getPlayer();
  
  // Player should be scaled 2x (160x160 instead of 80x80)
  assertEqual(player.width, 160, 'Player width should be 160 (80 * 2)');
  assertEqual(player.height, 160, 'Player height should be 160 (80 * 2)');
});

// ============================================
// INTEGRATION TEST 25: Monster Sprite Scaling (3x)
// ============================================

integrationRunner.addTest('Monster sprite scaled by 3x', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const monster = gameManager.spriteManager.getMonster();
  
  // Monster should be scaled 3x (240x240 instead of 80x80)
  assertEqual(monster.width, 240, 'Monster width should be 240 (80 * 3)');
  assertEqual(monster.height, 240, 'Monster height should be 240 (80 * 3)');
});

// ============================================
// INTEGRATION TEST 26: Player Positioned at Bottom Left
// ============================================

integrationRunner.addTest('Player positioned at bottom left of screen', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const player = gameManager.spriteManager.getPlayer();
  const canvasDimensions = gameManager.getCanvasDimensions();
  
  // Player should be at bottom left with padding
  assertEqual(player.x, 20, 'Player X should be 20 (left side with padding)');
  
  // Player Y should be at bottom (canvas height - player height - padding)
  const expectedY = canvasDimensions.height - player.height - 20;
  assertEqual(player.y, expectedY, `Player Y should be ${expectedY} (bottom with padding)`);
});

// ============================================
// INTEGRATION TEST 27: Monster Positioned at Bottom Right
// ============================================

integrationRunner.addTest('Monster positioned at bottom right of screen', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const monster = gameManager.spriteManager.getMonster();
  const canvasDimensions = gameManager.getCanvasDimensions();
  
  // Monster should be at bottom right with padding
  const expectedX = canvasDimensions.width - monster.width - 20;
  assertEqual(monster.x, expectedX, `Monster X should be ${expectedX} (right side with padding)`);
  
  // Monster Y should be at bottom (canvas height - monster height - padding)
  const expectedY = canvasDimensions.height - monster.height - 20;
  assertEqual(monster.y, expectedY, `Monster Y should be ${expectedY} (bottom with padding)`);
});

// ============================================
// INTEGRATION TEST 28: Hit Box Scales with Player
// ============================================

integrationRunner.addTest('Hit box scales proportionally with player sprite', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const player = gameManager.spriteManager.getPlayer();
  const hitBox = player.getHitBox();
  
  // Hit box should scale with player (2x scale)
  // Original: width=60, height=140
  // Scaled: width=120, height=280
  assertEqual(hitBox.width, 120, 'Hit box width should be 120 (60 * 2)');
  assertEqual(hitBox.height, 280, 'Hit box height should be 280 (140 * 2)');
});

// ============================================
// INTEGRATION TEST 29: NotePath Initialization
// ============================================

integrationRunner.addTest('NotePath initialized at center of screen', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const canvasDimensions = gameManager.getCanvasDimensions();
  
  // NotePath should be centered vertically
  const expectedY = canvasDimensions.height / 2 - 50;
  assertEqual(gameManager.notePathY, expectedY, `NotePath Y should be ${expectedY} (center of screen)`);
  
  // NotePath should have a height
  assertGreaterThan(gameManager.notePathHeight, 0, 'NotePath height should be greater than 0');
});

// ============================================
// INTEGRATION TEST 30: HitBox Positioning
// ============================================

integrationRunner.addTest('HitBox positioned on NotePath above player', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const player = gameManager.spriteManager.getPlayer();
  
  // HitBox should be on the NotePath
  assertEqual(gameManager.hitBoxY, gameManager.notePathY, 'HitBox Y should match NotePath Y');
  
  // HitBox should be to the right of player
  assertGreaterThan(gameManager.hitBoxX, player.x + player.width, 
    'HitBox X should be to the right of player');
  
  // HitBox should have dimensions
  assertGreaterThan(gameManager.hitBoxWidth, 0, 'HitBox width should be greater than 0');
  assertGreaterThan(gameManager.hitBoxHeight, 0, 'HitBox height should be greater than 0');
});

// ============================================
// INTEGRATION TEST 31: Notes Spawn Above NotePath
// ============================================

integrationRunner.addTest('Notes spawn above NotePath and move downward', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster
  gameManager.monsterHasStarted = true;
  
  // Spawn a note
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  
  assert(notes.length > 0, 'Note should be spawned');
  
  const note = notes[0];
  
  // Note should spawn above the NotePath
  const expectedY = gameManager.notePathY - 100;
  assertEqual(note.y, expectedY, `Note Y should be above NotePath (${expectedY})`);
  
  // Note should start from the right side
  assertEqual(note.x, gameManager.getCanvasDimensions().width, 'Note should start from right side');
  
  // Update note and verify it moves downward
  const initialY = note.y;
  note.update(1); // 1 second
  assertGreaterThan(note.y, initialY, 'Note should move downward');
});

// ============================================
// INTEGRATION TEST 32: Random Spawn Intervals
// ============================================

integrationRunner.addTest('Notes spawn with random intervals', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Get random intervals multiple times
  const intervals = [];
  for (let i = 0; i < 5; i++) {
    intervals.push(gameManager.getRandomSpawnInterval());
  }
  
  // All intervals should be positive
  intervals.forEach(interval => {
    assertGreaterThan(interval, 0, 'Spawn interval should be positive');
  });
  
  // At least some intervals should be different (random)
  const uniqueIntervals = new Set(intervals);
  assertGreaterThan(uniqueIntervals.size, 1, 'Intervals should vary (random)');
});

// ============================================
// INTEGRATION TEST 33: NotePath Moved Up by 30% and Scaled by 3x
// ============================================

integrationRunner.addTest('NotePath moved up by 30% and scaled by 3x in Y axis', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const canvasDimensions = gameManager.getCanvasDimensions();
  
  // NotePath should be moved up by 30%
  const expectedY = canvasDimensions.height / 2 - (canvasDimensions.height * 0.3) - 50;
  assertEqual(gameManager.notePathY, expectedY, `NotePath Y should be moved up by 30% (${expectedY})`);
  
  // NotePath should be scaled by 3x in Y axis
  assertEqual(gameManager.notePathHeight, 300, 'NotePath height should be 300 (100 * 3)');
});

// ============================================
// INTEGRATION TEST 34: HitBox Collision Detection with Custom HitBox
// ============================================

integrationRunner.addTest('HitBox collision detection works with custom HitBox', async () => {
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  // Manually start the monster
  gameManager.monsterHasStarted = true;
  
  // Spawn a note
  gameManager.spawnNote();
  const notes = gameManager.spriteManager.getNotes();
  const note = notes[0];
  
  // Move note to HitBox position
  note.x = gameManager.hitBoxX + 10;
  note.y = gameManager.hitBoxY + 5;
  
  // Create custom HitBox
  const customHitBox = {
    x: gameManager.hitBoxX,
    y: gameManager.hitBoxY,
    width: gameManager.hitBoxWidth,
    height: gameManager.hitBoxHeight
  };
  
  // Check collision with custom HitBox
  const collision = gameManager.collisionDetector.checkHitBoxCollisionCustom(note, customHitBox);
  assert(collision, 'Note should collide with custom HitBox');
});

// Export for use in browser or test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { integrationRunner };
}
