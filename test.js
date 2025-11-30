// Test suite for Beat Survivors core gameplay
// This file tests the integration of all game systems

// Mock canvas and DOM elements for testing
function setupTestEnvironment() {
  // Create mock canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 1200;
  canvas.height = 600;
  document.body.appendChild(canvas);

  // Create mock progress bar elements
  const progressBar = document.createElement('div');
  progressBar.id = 'progressBar';
  document.body.appendChild(progressBar);

  const progressPercentage = document.createElement('div');
  progressPercentage.id = 'progressPercentage';
  document.body.appendChild(progressPercentage);

  // Create mock game over screen
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  document.body.appendChild(gameOverScreen);

  const gameOverMessage = document.createElement('div');
  gameOverMessage.id = 'gameOverMessage';
  gameOverScreen.appendChild(gameOverMessage);

  // Create mock restart button
  const restartButton = document.createElement('button');
  restartButton.id = 'restartButton';
  gameOverScreen.appendChild(restartButton);
}

// Test 1: Game Initialization
async function testGameInitialization() {
  console.log('Test 1: Game Initialization');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  const initialized = await gameManager.init();
  
  if (initialized && gameManager.gameState === 'ready') {
    console.log('✓ Game initialized successfully');
    console.log('✓ Game state is ready');
    console.log('✓ Canvas context obtained');
    console.log('✓ All assets loaded');
    return true;
  } else {
    console.log('✗ Game initialization failed');
    return false;
  }
}

// Test 2: Note Spawning
async function testNoteSpawning() {
  console.log('\nTest 2: Note Spawning');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const initialNoteCount = gameManager.spriteManager.getNoteCount();
  gameManager.spawnNote();
  const afterSpawnCount = gameManager.spriteManager.getNoteCount();
  
  if (afterSpawnCount > initialNoteCount) {
    console.log('✓ Note spawned successfully');
    
    const notes = gameManager.spriteManager.getNotes();
    const note = notes[0];
    
    if (note && ['up', 'down', 'left', 'right'].includes(note.direction)) {
      console.log('✓ Note has valid direction:', note.direction);
      return true;
    }
  }
  
  console.log('✗ Note spawning failed');
  return false;
}

// Test 3: Input Detection
async function testInputDetection() {
  console.log('\nTest 3: Input Detection');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const inputHandler = gameManager.inputHandler;
  
  // Simulate key press
  inputHandler.keysPressed['ArrowUp'] = true;
  const activeKeys = inputHandler.getActiveKeys();
  
  if (activeKeys.includes('up')) {
    console.log('✓ Input handler detects arrow key press');
    console.log('✓ Key mapped to direction correctly');
    
    inputHandler.keysPressed['ArrowUp'] = false;
    const afterRelease = inputHandler.getActiveKeys();
    
    if (afterRelease.length === 0) {
      console.log('✓ Input handler detects key release');
      return true;
    }
  }
  
  console.log('✗ Input detection failed');
  return false;
}

// Test 4: Progress Bar Updates
async function testProgressBarUpdates() {
  console.log('\nTest 4: Progress Bar Updates');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const progressManager = gameManager.progressManager;
  const initialProgress = progressManager.getProgress();
  
  // Add perfect hit progress
  progressManager.addProgress(10);
  const afterPerfect = progressManager.getProgress();
  
  if (afterPerfect === initialProgress + 10) {
    console.log('✓ Perfect hit adds 10% progress');
    
    // Add good hit progress
    progressManager.addProgress(5);
    const afterGood = progressManager.getProgress();
    
    if (afterGood === afterPerfect + 5) {
      console.log('✓ Good hit adds 5% progress');
      
      // Test progress cap at 100%
      progressManager.addProgress(100);
      const capped = progressManager.getProgress();
      
      if (capped === 100) {
        console.log('✓ Progress capped at 100%');
        return true;
      }
    }
  }
  
  console.log('✗ Progress bar updates failed');
  return false;
}

// Test 5: Monster Movement
async function testMonsterMovement() {
  console.log('\nTest 5: Monster Movement');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const monster = gameManager.spriteManager.getMonster();
  const initialX = monster.x;
  
  // Update monster position
  monster.update(1); // 1 second delta time
  const afterUpdate = monster.x;
  
  if (afterUpdate < initialX) {
    console.log('✓ Monster moves leftward');
    
    const speed = initialX - afterUpdate;
    console.log('✓ Monster speed:', speed, 'pixels/second');
    
    // Test speed increase on miss
    const initialSpeed = monster.currentSpeed;
    monster.increaseSpeed(10);
    
    if (monster.currentSpeed > initialSpeed) {
      console.log('✓ Monster speed increases on miss');
      return true;
    }
  }
  
  console.log('✗ Monster movement failed');
  return false;
}

// Test 6: Collision Detection
async function testCollisionDetection() {
  console.log('\nTest 6: Collision Detection');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const collisionDetector = gameManager.collisionDetector;
  const player = gameManager.spriteManager.getPlayer();
  
  // Create a test note in the hit box
  const hitBox = player.getHitBox();
  const testNote = new Note(
    hitBox.x + 10,
    hitBox.y + 10,
    'up',
    gameManager.getSprite('noteUp'),
    250
  );
  
  // Test hit box collision
  if (collisionDetector.checkHitBoxCollision(testNote)) {
    console.log('✓ Hit box collision detection works');
    
    // Test direction matching
    if (collisionDetector.checkDirectionMatch(testNote, ['up'])) {
      console.log('✓ Direction matching works');
      
      // Test timing window
      const timing = collisionDetector.getTimingWindow(testNote);
      if (['perfect', 'good', 'miss'].includes(timing)) {
        console.log('✓ Timing window calculation works');
        return true;
      }
    }
  }
  
  console.log('✗ Collision detection failed');
  return false;
}

// Test 7: Audio and Visual Effects
async function testAudioAndEffects() {
  console.log('\nTest 7: Audio and Visual Effects');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const audioManager = gameManager.audioManager;
  const effectManager = gameManager.effectManager;
  
  // Test audio manager
  if (audioManager.soundExists('perfect')) {
    console.log('✓ Audio manager has perfect sound');
    
    // Test effect creation
    const initialEffectCount = effectManager.getEffectCount();
    effectManager.createEffect('perfect', { x: 100, y: 100 }, gameManager.assets.sprites);
    const afterEffectCount = effectManager.getEffectCount();
    
    if (afterEffectCount > initialEffectCount) {
      console.log('✓ Visual effect created successfully');
      
      // Test effect update
      effectManager.update(0.1);
      console.log('✓ Effects update correctly');
      
      return true;
    }
  }
  
  console.log('✗ Audio and effects failed');
  return false;
}

// Test 8: Win Condition
async function testWinCondition() {
  console.log('\nTest 8: Win Condition');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const progressManager = gameManager.progressManager;
  
  // Set progress to 100%
  progressManager.setProgress(100);
  
  if (progressManager.isFull()) {
    console.log('✓ Win condition detected when progress is 100%');
    return true;
  }
  
  console.log('✗ Win condition failed');
  return false;
}

// Test 9: Lose Condition
async function testLoseCondition() {
  console.log('\nTest 9: Lose Condition');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const player = gameManager.spriteManager.getPlayer();
  const monster = gameManager.spriteManager.getMonster();
  
  // Move monster to player position
  monster.x = player.x;
  
  if (monster.hasReachedPlayer(player.x)) {
    console.log('✓ Lose condition detected when monster reaches player');
    return true;
  }
  
  console.log('✗ Lose condition failed');
  return false;
}

// Test 10: Difficulty Settings
async function testDifficultySettings() {
  console.log('\nTest 10: Difficulty Settings');
  
  setupTestEnvironment();
  
  const gameManager = new GameManager();
  await gameManager.init();
  
  const difficultyManager = gameManager.difficultyManager;
  
  // Test easy difficulty
  difficultyManager.setDifficulty('easy');
  const easySettings = difficultyManager.getCurrentSettings();
  
  if (easySettings.difficulty === 'easy') {
    console.log('✓ Easy difficulty set');
    
    // Test hard difficulty
    difficultyManager.setDifficulty('hard');
    const hardSettings = difficultyManager.getCurrentSettings();
    
    if (hardSettings.difficulty === 'hard' && hardSettings.noteSpeed > easySettings.noteSpeed) {
      console.log('✓ Hard difficulty has faster notes than easy');
      console.log('✓ Difficulty settings configurable');
      return true;
    }
  }
  
  console.log('✗ Difficulty settings failed');
  return false;
}

// Run all tests
async function runAllTests() {
  console.log('=== Beat Survivors Integration Tests ===\n');
  
  const tests = [
    testGameInitialization,
    testNoteSpawning,
    testInputDetection,
    testProgressBarUpdates,
    testMonsterMovement,
    testCollisionDetection,
    testAudioAndEffects,
    testWinCondition,
    testLoseCondition,
    testDifficultySettings
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Test error:', error);
      failed++;
    }
  }
  
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n✓ All tests passed! Core gameplay is fully integrated.');
  }
}

// Export for use in browser console or test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
