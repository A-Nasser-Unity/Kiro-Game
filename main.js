// Game Manager - Main game controller
class GameManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'initializing';
    this.assets = {
      sprites: {},
      audio: {}
    };
    this.loadedAssets = 0;
    this.totalAssets = 0;
    this.assetLoadError = null;
    this.inputHandler = new InputHandler();
    this.audioManager = new AudioManager();
    this.effectManager = new EffectManager();
    this.difficultyManager = new DifficultyManager();
    this.spriteManager = new SpriteManager();
    
    // Note spawning properties
    this.lastNoteSpawnTime = 0;
    this.nextNoteSpawnInterval = 0; // Random interval for next note
    this.noteDirections = ['up', 'down', 'left', 'right'];
    
    // Monster delay properties
    this.monsterStartDelay = 3000; // 3 seconds in milliseconds
    this.gameStartTime = 0;
    this.monsterHasStarted = false;
    
    // Background music properties
    this.currentMusicTrack = null;
    
    // NotePath and HitBox properties
    this.notePathY = 0; // Y position of the note path (center of screen)
    this.notePathHeight = 100; // Height of the note path
    this.hitBoxX = 0; // X position of hit box
    this.hitBoxY = 0; // Y position of hit box
    this.hitBoxWidth = 100; // Width of hit box
    this.hitBoxHeight = 100; // Height of hit box
  }

  // Initialize the game and load all assets
  async init() {
    try {
      // Get canvas element
      this.canvas = document.getElementById('gameCanvas');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }

      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      // Load all assets
      await this.loadAssets();

      // Set up canvas
      this.setupCanvas();

      // Initialize input handler
      this.inputHandler.init();

      // Initialize audio manager
      this.audioManager.init(this.assets.audio);

      // Initialize sprites (player and monster)
      this.initializeSprites();

      // Set up restart button handler
      this.setupRestartButton();

      this.gameState = 'ready';
      console.log('Game initialized successfully');
      return true;
    } catch (error) {
      this.assetLoadError = error;
      console.error('Game initialization failed:', error);
      this.displayError(error.message);
      return false;
    }
  }

  // Load all sprite images and audio files
  async loadAssets() {
    const spriteAssets = [
      { name: 'player', path: 'Boy1.png' },
      { name: 'monster1', path: 'M1.png' },
      { name: 'monster2', path: 'M2.png' },
      { name: 'monster3', path: 'M3.png' },
      { name: 'noteUp', path: 'UpArrow.png' },
      { name: 'noteDown', path: 'Down Arrow.png' },
      { name: 'noteLeft', path: 'LeftArrow.png' },
      { name: 'noteRight', path: 'RightArrow.png' },
      { name: 'perfect', path: 'PERFECT.png' },
      { name: 'good', path: 'GOOD.png' },
      { name: 'miss', path: 'MISS.png' },
      { name: 'win', path: 'Win.png' },
      { name: 'lose', path: 'Lose.png' },
      { name: 'notePath', path: 'NotePath.png' },
      { name: 'hitBox', path: 'HitBox.png' }
    ];

    const audioAssets = [
      { name: 'perfect', path: 'Perfect.wav' },
      { name: 'good', path: 'Good.wav' },
      { name: 'miss', path: 'Miss.wav' },
      { name: 'win', path: 'Win.wav' },
      { name: 'lose', path: 'Lose.wav' },
      { name: 'track1', path: 'Track1.wav' },
      { name: 'track2', path: 'Track2.wav' },
      { name: 'track3', path: 'Track3.wav' }
    ];

    this.totalAssets = spriteAssets.length + audioAssets.length;
    this.loadedAssets = 0;

    // Load sprites
    const spritePromises = spriteAssets.map(asset =>
      this.loadSprite(asset.name, asset.path)
    );

    // Load audio
    const audioPromises = audioAssets.map(asset =>
      this.loadAudio(asset.name, asset.path)
    );

    // Wait for all assets to load
    await Promise.all([...spritePromises, ...audioPromises]);

    if (this.assetLoadError) {
      throw this.assetLoadError;
    }
  }

  // Load a single sprite image
  loadSprite(name, path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.assets.sprites[name] = img;
        this.loadedAssets++;
        resolve();
      };
      img.onerror = () => {
        const error = new Error(`Failed to load sprite: ${path}`);
        this.assetLoadError = error;
        reject(error);
      };
      img.src = path;
    });
  }

  // Load a single audio file
  loadAudio(name, path) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // Handle successful load - use loadedmetadata as fallback for large files
      const handleSuccess = () => {
        this.assets.audio[name] = audio;
        this.loadedAssets++;
        // Remove event listeners to prevent duplicate calls
        audio.removeEventListener('canplaythrough', handleSuccess);
        audio.removeEventListener('loadedmetadata', handleSuccess);
        resolve();
      };
      
      audio.addEventListener('canplaythrough', handleSuccess, { once: true });
      audio.addEventListener('loadedmetadata', handleSuccess, { once: true });
      
      audio.onerror = () => {
        const error = new Error(`Failed to load audio: ${path}`);
        this.assetLoadError = error;
        reject(error);
      };
      
      audio.src = path;
    });
  }

  // Set up canvas properties
  setupCanvas() {
    // Set canvas background color
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Initialize player and monster sprites
  initializeSprites() {
    try {
      const canvasDimensions = this.getCanvasDimensions();
      
      // Create player sprite at bottom left (scaled 2x)
      const playerSprite = this.getSprite('player');
      const playerWidth = 80 * 2; // Scale by 2x
      const playerHeight = 80 * 2; // Scale by 2x
      const playerX = 20; // Left side with padding
      const playerY = canvasDimensions.height - playerHeight - 20; // Bottom with padding
      const player = new Player(playerX, playerY, playerSprite, playerWidth, playerHeight);
      this.spriteManager.setPlayer(player);
      
      // Randomly select one of three monster sprites
      const monsterOptions = ['monster1', 'monster2', 'monster3'];
      const randomMonsterKey = monsterOptions[Math.floor(Math.random() * monsterOptions.length)];
      const monsterSprite = this.getSprite(randomMonsterKey);
      
      // Get base speed and reduce by 80% (keep only 20%)
      const monsterBaseSpeed = this.difficultyManager.getMonsterBaseSpeed();
      const reducedSpeed = monsterBaseSpeed * 0.2; // 80% reduction = 20% of original
      
      // Create monster sprite at bottom right (scaled 3x) with reduced speed
      const monsterWidth = 80 * 3; // Scale by 3x
      const monsterHeight = 80 * 3; // Scale by 3x
      const monsterX = canvasDimensions.width - monsterWidth - 20; // Right side with padding
      const monsterY = canvasDimensions.height - monsterHeight - 20; // Bottom with padding
      const monster = new Monster(
        monsterX,
        monsterY,
        monsterSprite,
        reducedSpeed,
        monsterWidth,
        monsterHeight
      );
      this.spriteManager.setMonster(monster);
      
      // Initialize collision detector with player
      this.collisionDetector = new CollisionDetector(player);
      
      // Initialize progress manager
      this.progressManager = new ProgressManager();
      this.progressManager.init();
      
      // Initialize NotePath (moved up by 30%, scaled in Y by 3)
      // Original: center of screen (height/2)
      // Moved up by 30%: height/2 - (height * 0.3)
      this.notePathY = canvasDimensions.height / 2 - (canvasDimensions.height * 0.3) - 50;
      this.notePathHeight = 100 * 3; // Scale Y axis by 3 (300 pixels)
      
      // Initialize HitBox (on NotePath, above player, a bit to the right)
      const hitBoxImage = this.getSprite('hitBox');
      if (hitBoxImage) {
        this.hitBoxWidth = 120; // Width of hit box
        this.hitBoxHeight = 100 * 3; // Scale Y axis by 3 (300 pixels)
        this.hitBoxX = playerX + playerWidth + 20; // To the right of player
        this.hitBoxY = this.notePathY; // On the note path
      }
      
      console.log(`Sprites initialized successfully - Monster: ${randomMonsterKey}, Speed: ${reducedSpeed}`);
      console.log(`Player: ${playerWidth}x${playerHeight} at (${playerX}, ${playerY})`);
      console.log(`Monster: ${monsterWidth}x${monsterHeight} at (${monsterX}, ${monsterY})`);
      console.log(`NotePath: Y=${this.notePathY}, Height=${this.notePathHeight}`);
      console.log(`HitBox: (${this.hitBoxX}, ${this.hitBoxY}) ${this.hitBoxWidth}x${this.hitBoxHeight}`);
      return true;
    } catch (error) {
      console.error('Error initializing sprites:', error);
      return false;
    }
  }

  // Select and play a random background music track
  playBackgroundMusic() {
    try {
      // Array of available music tracks
      const musicTracks = ['track1', 'track2', 'track3'];
      
      // Select a random track
      const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
      
      // Get the audio element
      const audio = this.assets.audio[randomTrack];
      if (!audio) {
        console.warn(`Background music track not found: ${randomTrack}`);
        return false;
      }
      
      console.log(`Audio element found for ${randomTrack}, readyState: ${audio.readyState}`);
      
      // Set up the audio to loop
      audio.loop = true;
      audio.volume = 0.5; // Set volume to 50% to not overpower sound effects
      
      // Reset audio to start
      audio.currentTime = 0;
      
      // Store the current track for later reference
      this.currentMusicTrack = randomTrack;
      
      // Try to play the audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✓ Successfully playing background music: ${randomTrack}`);
          })
          .catch(error => {
            console.warn(`⚠ Background music autoplay blocked (${error.name}): ${error.message}`);
            console.log('Music will play after user interaction');
          });
      } else {
        console.log(`Background music track selected: ${randomTrack} (older browser)`);
      }
      
      return true;
    } catch (error) {
      console.error('Error playing background music:', error);
      return false;
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    try {
      if (this.currentMusicTrack) {
        const audio = this.assets.audio[this.currentMusicTrack];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      return true;
    } catch (error) {
      console.error('Error stopping background music:', error);
      return false;
    }
  }

  // Resume background music (for handling autoplay policies)
  resumeBackgroundMusic() {
    try {
      if (this.currentMusicTrack) {
        const audio = this.assets.audio[this.currentMusicTrack];
        if (audio && audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn('Failed to resume background music:', error.message);
            });
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error resuming background music:', error);
      return false;
    }
  }

  // Display error message to user
  displayError(message) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    if (gameOverScreen && gameOverMessage) {
      gameOverMessage.textContent = `Error: ${message}`;
      gameOverScreen.style.display = 'flex';
    }
  }

  // Get a sprite by name
  getSprite(name) {
    return this.assets.sprites[name];
  }

  // Get audio by name
  getAudio(name) {
    return this.assets.audio[name];
  }

  // Get canvas context
  getContext() {
    return this.ctx;
  }

  // Get canvas dimensions
  getCanvasDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  // Get game state
  getGameState() {
    return this.gameState;
  }

  // Set game state
  setGameState(state) {
    this.gameState = state;
  }

  // Get input handler
  getInputHandler() {
    return this.inputHandler;
  }

  // Get audio manager
  getAudioManager() {
    return this.audioManager;
  }

  // Get effect manager
  getEffectManager() {
    return this.effectManager;
  }

  // Get difficulty manager
  getDifficultyManager() {
    return this.difficultyManager;
  }

  // Get sprite manager
  getSpriteManager() {
    return this.spriteManager;
  }

  // Spawn a new note with random direction
  spawnNote() {
    try {
      // Get canvas dimensions
      const canvasDimensions = this.getCanvasDimensions();
      
      // Spawn note on the right side of the canvas, ABOVE the NotePath
      const noteX = canvasDimensions.width;
      // Position note above the NotePath (at the top of the NotePath area)
      const noteY = this.notePathY - 100; // Spawn 100 pixels above NotePath
      
      // Random direction
      const randomDirection = this.noteDirections[
        Math.floor(Math.random() * this.noteDirections.length)
      ];
      
      // Get note sprite based on direction
      const spriteKey = `note${randomDirection.charAt(0).toUpperCase() + randomDirection.slice(1)}`;
      const noteSprite = this.getSprite(spriteKey);
      
      if (!noteSprite) {
        console.warn(`Note sprite not found for direction: ${randomDirection}`);
        return false;
      }
      
      // Get note speed from difficulty manager
      const noteSpeed = this.difficultyManager.getNoteSpeed();
      
      // Create new note
      const note = new Note(noteX, noteY, randomDirection, noteSprite, noteSpeed);
      
      // Add note to sprite manager
      this.spriteManager.addNote(note);
      
      return true;
    } catch (error) {
      console.error('Error spawning note:', error);
      return false;
    }
  }

  // Update note spawning based on difficulty settings
  updateNoteSpawning() {
    try {
      // Get current time
      const currentTime = Date.now();
      
      // Check if monster has started moving
      if (!this.monsterHasStarted) {
        // Check if 3 seconds have passed since game start
        if (currentTime - this.gameStartTime >= this.monsterStartDelay) {
          this.monsterHasStarted = true;
          this.lastNoteSpawnTime = currentTime; // Reset spawn timer when monster starts
          this.nextNoteSpawnInterval = this.getRandomSpawnInterval(); // Set random interval
        } else {
          // Monster hasn't started yet, don't spawn notes
          return;
        }
      }
      
      // Check if enough time has passed since last spawn
      if (currentTime - this.lastNoteSpawnTime >= this.nextNoteSpawnInterval) {
        // Spawn a new note
        this.spawnNote();
        
        // Update last spawn time
        this.lastNoteSpawnTime = currentTime;
        
        // Set random interval for next note
        this.nextNoteSpawnInterval = this.getRandomSpawnInterval();
      }
    } catch (error) {
      console.error('Error updating note spawning:', error);
    }
  }

  // Get random spawn interval between notes
  getRandomSpawnInterval() {
    // Get base spawn interval from difficulty manager
    const baseInterval = this.difficultyManager.getNoteSpawnInterval();
    
    // Add randomness: ±50% of base interval
    const minInterval = baseInterval * 0.5;
    const maxInterval = baseInterval * 1.5;
    
    return Math.random() * (maxInterval - minInterval) + minInterval;
  }

  // Reset note spawning timer
  resetNoteSpawning() {
    this.lastNoteSpawnTime = Date.now();
  }

  // Start the game and begin the main game loop
  start() {
    if (this.gameState !== 'ready') {
      console.warn('Game is not ready to start');
      return false;
    }

    this.gameState = 'playing';
    this.gameStartTime = Date.now();
    this.monsterHasStarted = false;
    this.resetNoteSpawning();
    this.lastFrameTime = Date.now();
    
    // Play background music
    this.playBackgroundMusic();

    // Start the game loop
    this.gameLoop();

    return true;
  }

  // Main game loop using requestAnimationFrame
  gameLoop = () => {
    // Calculate delta time
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Update game state
    if (this.gameState === 'playing') {
      // Update note spawning
      this.updateNoteSpawning();

      // Update all sprites (pass monsterHasStarted flag)
      this.spriteManager.update(deltaTime, this.monsterHasStarted);

      // Process input and check for hits
      this.processInputAndHits();

      // Update effects
      this.effectManager.update(deltaTime);

      // Remove off-screen notes
      this.spriteManager.removeOffScreenNotes(this.canvas.height);

      // Check for missed notes
      this.checkMissedNotes();

      // Check win/lose conditions
      this.checkGameConditions();
    }

    // Render the game
    this.render();

    // Continue the game loop
    requestAnimationFrame(this.gameLoop);
  }

  // Process input and check for hits
  processInputAndHits() {
    try {
      // Get currently active directions from input handler
      const activeDirections = this.inputHandler.getActiveKeys();

      // If no keys are pressed, nothing to do
      if (activeDirections.length === 0) {
        return;
      }

      // Get all active notes
      const notes = this.spriteManager.getNotes();

      // Create custom HitBox object from GameManager's HitBox properties
      const customHitBox = {
        x: this.hitBoxX,
        y: this.hitBoxY,
        width: this.hitBoxWidth,
        height: this.hitBoxHeight
      };

      // Check each note for potential hits
      notes.forEach(note => {
        // Skip if note is already hit
        if (note.isHit()) {
          return;
        }

        // Process hit for this note using custom HitBox
        const hitType = this.collisionDetector.processHit(note, activeDirections, customHitBox);

        if (hitType) {
          // Handle successful hit
          this.handleHit(note, hitType);
        }
      });
    } catch (error) {
      console.error('Error processing input and hits:', error);
    }
  }

  // Handle a successful hit
  handleHit(note, hitType) {
    try {
      // Mark note as hit
      note.markAsHit();

      // Determine progress amount based on hit type
      const progressAmount = hitType === 'perfect' ? 10 : 5;

      // Update progress bar
      this.progressManager.addProgress(progressAmount);

      // Play audio effect
      this.audioManager.play(hitType);

      // Create visual effect at note position
      const notePosition = note.getPosition();
      this.effectManager.createEffect(hitType, notePosition, this.assets.sprites);

      // Log hit for debugging
      console.log(`${hitType.toUpperCase()} hit! Progress: +${progressAmount}%`);

      return true;
    } catch (error) {
      console.error('Error handling hit:', error);
      return false;
    }
  }

  // Check for missed notes (notes that passed without being hit)
  checkMissedNotes() {
    try {
      const notes = this.spriteManager.getNotes();
      const notesToRemove = [];

      notes.forEach(note => {
        // Skip if note is already hit
        if (note.isHit()) {
          return;
        }

        // Check if note has passed the miss collider
        if (this.collisionDetector.checkMissCollision(note)) {
          // Handle miss
          this.handleMiss(note);
          notesToRemove.push(note.id);
        }
      });

      // Remove missed notes
      notesToRemove.forEach(noteId => {
        this.spriteManager.removeNote(noteId);
      });
    } catch (error) {
      console.error('Error checking missed notes:', error);
    }
  }

  // Handle a missed note
  handleMiss(note) {
    try {
      // Play miss audio
      this.audioManager.play('miss');

      // Create miss visual effect
      const notePosition = note.getPosition();
      this.effectManager.createEffect('miss', notePosition, this.assets.sprites);

      // Optionally increase monster speed on miss
      const monster = this.spriteManager.getMonster();
      if (monster) {
        const speedIncrement = this.difficultyManager.getMonsterSpeedIncrement();
        monster.increaseSpeed(speedIncrement);
      }

      console.log('Note missed!');
      return true;
    } catch (error) {
      console.error('Error handling miss:', error);
      return false;
    }
  }

  // Check win and lose conditions
  checkGameConditions() {
    try {
      // Check win condition (progress bar full)
      if (this.progressManager.isFull()) {
        this.endGame('won');
        return;
      }

      // Check lose condition (monster reached player)
      const player = this.spriteManager.getPlayer();
      const monster = this.spriteManager.getMonster();

      if (player && monster && monster.hasReachedPlayer(player.x)) {
        this.endGame('lost');
        return;
      }
    } catch (error) {
      console.error('Error checking game conditions:', error);
    }
  }

  // End the game with a result (won or lost)
  endGame(result) {
    try {
      // Stop the game
      this.gameState = result === 'won' ? 'won' : 'lost';

      // Stop spawning notes
      this.lastNoteSpawnTime = Date.now() + 999999; // Prevent further spawning
      
      // Stop background music
      this.stopBackgroundMusic();

      // Play end game audio
      this.audioManager.play(result);

      // Display end game screen
      this.displayGameOverScreen(result);

      console.log(`Game ${result}!`);
      return true;
    } catch (error) {
      console.error('Error ending game:', error);
      return false;
    }
  }

  // Display game over screen
  displayGameOverScreen(result) {
    try {
      const gameOverScreen = document.getElementById('gameOverScreen');
      const gameOverMessage = document.getElementById('gameOverMessage');

      if (!gameOverScreen || !gameOverMessage) {
        console.warn('Game over screen elements not found');
        return false;
      }

      // Set message based on result
      const message = result === 'won' ? 'YOU WIN!' : 'YOU LOSE!';
      gameOverMessage.textContent = message;

      // Apply appropriate CSS class for styling
      gameOverMessage.className = 'game-over-message ' + result;

      // Display the screen
      gameOverScreen.style.display = 'flex';

      return true;
    } catch (error) {
      console.error('Error displaying game over screen:', error);
      return false;
    }
  }

  // Set up restart button event handler
  setupRestartButton() {
    try {
      const restartButton = document.getElementById('restartButton');
      if (!restartButton) {
        console.warn('Restart button not found');
        return false;
      }

      restartButton.addEventListener('click', () => {
        this.restartGame();
      });

      return true;
    } catch (error) {
      console.error('Error setting up restart button:', error);
      return false;
    }
  }

  // Restart the game
  restartGame() {
    try {
      // Hide game over screen
      const gameOverScreen = document.getElementById('gameOverScreen');
      if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
      }
      
      // Stop current background music
      this.stopBackgroundMusic();

      // Reset all game state
      this.spriteManager.clearNotes();
      this.progressManager.reset();
      this.effectManager.clearEffects();
      this.difficultyManager.reset();
      this.inputHandler.resetKeys();

      // Reset sprites
      const canvasDimensions = this.getCanvasDimensions();
      const player = this.spriteManager.getPlayer();
      const monster = this.spriteManager.getMonster();

      if (monster) {
        monster.x = canvasDimensions.width - 100;
        monster.resetSpeed();
      }

      // Restart the game
      this.start();

      console.log('Game restarted');
      return true;
    } catch (error) {
      console.error('Error restarting game:', error);
      return false;
    }
  }

  // Render the game
  render() {
    try {
      // Clear canvas
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Render NotePath (semi-transparent, full width)
      this.renderNotePath();
      
      // Render HitBox
      this.renderHitBox();

      // Render all sprites
      this.spriteManager.render(this.ctx);

      // Render all effects
      this.effectManager.render(this.ctx);

      // Optional: Draw debug info (hit box and miss collider)
      // this.drawDebugInfo();
    } catch (error) {
      console.error('Error rendering game:', error);
    }
  }

  // Render the NotePath background
  renderNotePath() {
    try {
      const notePath = this.getSprite('notePath');
      if (!notePath) {
        console.warn('NotePath sprite not found');
        return;
      }

      // Save canvas state
      this.ctx.save();

      // Set opacity to 50%
      this.ctx.globalAlpha = 0.5;

      // Draw NotePath across full width at center
      this.ctx.drawImage(
        notePath,
        0, // X: start at left edge
        this.notePathY, // Y: center of screen
        this.canvas.width, // Width: full canvas width
        this.notePathHeight // Height: note path height
      );

      // Restore canvas state
      this.ctx.restore();
    } catch (error) {
      console.error('Error rendering NotePath:', error);
    }
  }

  // Render the HitBox
  renderHitBox() {
    try {
      const hitBox = this.getSprite('hitBox');
      if (!hitBox) {
        console.warn('HitBox sprite not found');
        return;
      }

      // Draw HitBox on the NotePath
      this.ctx.drawImage(
        hitBox,
        this.hitBoxX, // X: above player, to the right
        this.hitBoxY, // Y: on the note path
        this.hitBoxWidth, // Width
        this.hitBoxHeight // Height
      );
    } catch (error) {
      console.error('Error rendering HitBox:', error);
    }
  }

  // Draw debug information (hit box and miss collider)
  drawDebugInfo() {
    try {
      const hitBox = this.collisionDetector.getHitBoxBounds();
      const missCollider = this.collisionDetector.getMissColliderBounds();

      // Draw hit box
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(hitBox.x, hitBox.y, hitBox.width, hitBox.height);

      // Draw miss collider
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(missCollider.x, missCollider.y, missCollider.width, missCollider.height);
    } catch (error) {
      console.error('Error drawing debug info:', error);
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const gameManager = new GameManager();
  const initialized = await gameManager.init();

  if (initialized) {
    console.log('Game is ready to start');
    // Store game manager globally for access by other modules
    window.gameManager = gameManager;
    
    // Start the game automatically
    gameManager.start();
  }
});


// Player Class - Represents the player character
class Player {
  constructor(x, y, sprite, width = 80, height = 80) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    
    // Hit box properties - area where notes must be hit (scaled proportionally)
    // Hit box is positioned above the player sprite
    const scale = width / 80; // Calculate scale factor relative to default 80px
    this.hitBoxX = x + (10 * scale);
    this.hitBoxY = y - (60 * scale);
    this.hitBoxWidth = 60 * scale;
    this.hitBoxHeight = 140 * scale;
  }

  // Render the player sprite
  render(ctx) {
    if (this.sprite) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
  }

  // Get the hit box region
  getHitBox() {
    return {
      x: this.hitBoxX,
      y: this.hitBoxY,
      width: this.hitBoxWidth,
      height: this.hitBoxHeight
    };
  }

  // Get player position
  getPosition() {
    return { x: this.x, y: this.y };
  }
}

// Monster Class - Represents the approaching monster
class Monster {
  constructor(x, y, sprite, baseSpeed = 50, width = 80, height = 80) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.baseSpeed = baseSpeed;
    this.currentSpeed = baseSpeed;
    this.width = width;
    this.height = height;
  }

  // Update monster position (move toward player)
  update(deltaTime) {
    this.moveTowardPlayer(deltaTime);
  }

  // Move monster leftward toward player
  moveTowardPlayer(deltaTime) {
    this.x -= this.currentSpeed * deltaTime;
  }

  // Increase monster speed (on miss)
  increaseSpeed(increment = 10) {
    this.currentSpeed += increment;
  }

  // Reset speed to base speed
  resetSpeed() {
    this.currentSpeed = this.baseSpeed;
  }

  // Set current speed
  setSpeed(speed) {
    this.currentSpeed = speed;
  }

  // Get current speed
  getSpeed() {
    return this.currentSpeed;
  }

  // Render the monster sprite
  render(ctx) {
    if (this.sprite) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
  }

  // Get monster position
  getPosition() {
    return { x: this.x, y: this.y };
  }

  // Check if monster reached player position
  hasReachedPlayer(playerX) {
    return this.x <= playerX;
  }
}

// Note Class - Represents a musical note to be hit
class Note {
  constructor(x, y, direction, sprite, speed = 300, width = 40, height = 40) {
    this.x = x;
    this.y = y;
    this.direction = direction; // 'up', 'down', 'left', 'right'
    this.sprite = sprite;
    this.speed = speed;
    this.width = width;
    this.height = height;
    this.createdAt = Date.now();
    this.hit = false;
    this.id = Math.random(); // Unique identifier for this note
  }

  // Update note position (move downward)
  update(deltaTime) {
    this.y += this.speed * deltaTime;
  }

  // Render the note sprite
  render(ctx) {
    if (this.sprite) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
  }

  // Check if note is off screen (bottom side)
  isOffScreen(canvasHeight) {
    return this.y > canvasHeight;
  }

  // Get note position
  getPosition() {
    return { x: this.x, y: this.y };
  }

  // Get note bounds for collision detection
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  // Mark note as hit
  markAsHit() {
    this.hit = true;
  }

  // Check if note has been hit
  isHit() {
    return this.hit;
  }

  // Get time since note was created (in milliseconds)
  getTimeSinceCreation() {
    return Date.now() - this.createdAt;
  }

  // Get direction
  getDirection() {
    return this.direction;
  }
}

// Input Handler - Manages keyboard input for arrow keys
class InputHandler {
  constructor() {
    this.keysPressed = {
      'ArrowUp': false,
      'ArrowDown': false,
      'ArrowLeft': false,
      'ArrowRight': false
    };

    // Map arrow keys to directions
    this.keyToDirection = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    };
  }

  // Initialize keyboard event listeners
  init() {
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));
    
    // Add click listener to resume audio on user interaction (for autoplay policies)
    document.addEventListener('click', () => this.onUserInteraction(), { once: true });
  }
  
  // Handle user interaction to resume audio
  onUserInteraction() {
    // Resume background music if it was blocked by autoplay policies
    if (window.gameManager) {
      window.gameManager.resumeBackgroundMusic();
    }
  }

  // Handle key down event
  onKeyDown(event) {
    if (event.key in this.keysPressed) {
      event.preventDefault();
      this.keysPressed[event.key] = true;
    }
  }

  // Handle key up event
  onKeyUp(event) {
    if (event.key in this.keysPressed) {
      event.preventDefault();
      this.keysPressed[event.key] = false;
    }
  }

  // Get currently pressed keys
  getActiveKeys() {
    const activeKeys = [];
    for (const [key, isPressed] of Object.entries(this.keysPressed)) {
      if (isPressed) {
        activeKeys.push(this.keyToDirection[key]);
      }
    }
    return activeKeys;
  }

  // Check if a specific key is pressed
  isKeyPressed(key) {
    return this.keysPressed[key] || false;
  }

  // Check if a specific direction is active
  isDirectionActive(direction) {
    const directionKey = Object.entries(this.keyToDirection).find(
      ([_, dir]) => dir === direction
    );
    return directionKey ? this.keysPressed[directionKey[0]] : false;
  }

  // Reset all keys (useful for game state changes)
  resetKeys() {
    for (const key in this.keysPressed) {
      this.keysPressed[key] = false;
    }
  }
}

// Collision Detector - Handles collision detection and hit registration
class CollisionDetector {
  constructor(player) {
    this.player = player;
    
    // Timing windows in milliseconds
    this.perfectWindow = 50;  // ±50ms for perfect hit
    this.goodWindow = 100;    // ±100ms for good hit
    
    // Miss collider position (where notes are considered "missed" if they pass)
    // This is positioned slightly below the hit box (notes move downward)
    this.missColliderY = player.hitBoxY + player.hitBoxHeight + 20;
    this.missColliderHeight = 20;
  }

  // Check if a note overlaps with the hit box
  checkHitBoxCollision(note) {
    const noteBounds = note.getBounds();
    const hitBox = this.player.getHitBox();

    // Check if note bounds overlap with hit box
    return this.rectanglesOverlap(noteBounds, hitBox);
  }

  // Check if two rectangles overlap
  rectanglesOverlap(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  // Get the timing accuracy for a note (perfect, good, or miss)
  getTimingWindow(note) {
    // Calculate the center of the hit box (Y-axis, since notes move vertically)
    const hitBoxCenterY = this.player.hitBoxY + this.player.hitBoxHeight / 2;
    const noteY = note.getPosition().y + note.height / 2; // Center of note
    
    // Calculate distance from note center to hit box center
    const distanceFromCenter = Math.abs(hitBoxCenterY - noteY);
    
    // Convert distance to time offset (in milliseconds)
    // Based on how far the note is from the perfect center
    const timingOffset = (distanceFromCenter / note.speed) * 1000;

    if (timingOffset <= this.perfectWindow) {
      return 'perfect';
    } else if (timingOffset <= this.goodWindow) {
      return 'good';
    }

    return 'miss';
  }

  // Check if a note has passed the miss collider without being hit
  checkMissCollision(note) {
    // If note is already marked as hit, it's not a miss
    if (note.isHit()) {
      return false;
    }

    // Check if note has passed the miss collider (moved below it)
    const noteBounds = note.getBounds();
    return noteBounds.y > this.missColliderY;
  }

  // Check if a note is in the hit box and matches the pressed direction
  checkDirectionMatch(note, pressedDirections) {
    // Check if note direction matches any of the pressed directions
    return pressedDirections.includes(note.getDirection());
  }

  // Process a hit for a note (with custom HitBox)
  processHit(note, pressedDirections, customHitBox = null) {
    // Use custom HitBox if provided, otherwise use player's hit box
    const hitBox = customHitBox || this.player.getHitBox();
    
    // Check if note is in hit box
    if (!this.checkHitBoxCollisionCustom(note, hitBox)) {
      return null;
    }

    // Check if direction matches
    if (!this.checkDirectionMatch(note, pressedDirections)) {
      return null;
    }

    // Check timing window
    const timing = this.getTimingWindow(note);
    
    if (timing === 'perfect' || timing === 'good') {
      note.markAsHit();
      return timing;
    }

    return null;
  }

  // Check if a note overlaps with a custom hit box
  checkHitBoxCollisionCustom(note, hitBox) {
    const noteBounds = note.getBounds();

    // Check if note bounds overlap with hit box
    return this.rectanglesOverlap(noteBounds, hitBox);
  }

  // Update miss collider position based on player position
  updateMissColliderPosition() {
    this.missColliderX = this.player.hitBoxX - 20;
  }

  // Get miss collider bounds for debugging
  getMissColliderBounds() {
    return {
      x: this.missColliderX,
      y: this.player.hitBoxY,
      width: this.missColliderWidth,
      height: this.player.hitBoxHeight
    };
  }

  // Get hit box bounds for debugging
  getHitBoxBounds() {
    return this.player.getHitBox();
  }
}

// Sprite Manager - Manages all game sprites
class SpriteManager {
  constructor() {
    this.player = null;
    this.monster = null;
    this.notes = [];
  }

  // Set the player sprite
  setPlayer(player) {
    this.player = player;
  }

  // Get the player sprite
  getPlayer() {
    return this.player;
  }

  // Set the monster sprite
  setMonster(monster) {
    this.monster = monster;
  }

  // Get the monster sprite
  getMonster() {
    return this.monster;
  }

  // Add a note to the collection
  addNote(note) {
    this.notes.push(note);
  }

  // Remove a note from the collection
  removeNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
  }

  // Get all notes
  getNotes() {
    return this.notes;
  }

  // Get notes by direction
  getNotesByDirection(direction) {
    return this.notes.filter(note => note.direction === direction);
  }

  // Update all sprites
  update(deltaTime, monsterHasStarted = true) {
    // Update monster only if it has started
    if (this.monster && monsterHasStarted) {
      this.monster.update(deltaTime);
    }

    // Update all notes
    this.notes.forEach(note => {
      note.update(deltaTime);
    });
  }

  // Render all sprites
  render(ctx) {
    // Render player
    if (this.player) {
      this.player.render(ctx);
    }

    // Render monster
    if (this.monster) {
      this.monster.render(ctx);
    }

    // Render all notes
    this.notes.forEach(note => {
      note.render(ctx);
    });
  }

  // Clear all notes
  clearNotes() {
    this.notes = [];
  }

  // Get total number of active notes
  getNoteCount() {
    return this.notes.length;
  }

  // Remove off-screen notes
  removeOffScreenNotes(canvasHeight) {
    this.notes = this.notes.filter(note => !note.isOffScreen(canvasHeight));
  }
}

// Progress Manager - Manages progress bar tracking and UI updates
class ProgressManager {
  constructor() {
    this.progress = 0; // Current progress percentage (0-100)
    this.progressBarElement = null;
    this.progressPercentageElement = null;
  }

  // Initialize progress manager with DOM elements
  init() {
    this.progressBarElement = document.getElementById('progressBar');
    this.progressPercentageElement = document.getElementById('progressPercentage');

    if (!this.progressBarElement || !this.progressPercentageElement) {
      console.warn('Progress bar UI elements not found');
      return false;
    }

    // Set initial state
    this.updateUI();
    return true;
  }

  // Add progress by a specified amount
  addProgress(amount) {
    // Ensure amount is valid
    if (typeof amount !== 'number' || amount < 0) {
      console.warn('Invalid progress amount:', amount);
      return;
    }

    // Add progress and cap at 100%
    this.progress = Math.min(this.progress + amount, 100);

    // Update UI
    this.updateUI();
  }

  // Get current progress percentage
  getProgress() {
    return this.progress;
  }

  // Set progress to a specific value
  setProgress(value) {
    // Ensure value is between 0 and 100
    if (typeof value !== 'number' || value < 0 || value > 100) {
      console.warn('Invalid progress value:', value);
      return;
    }

    this.progress = value;
    this.updateUI();
  }

  // Check if progress bar is full (100%)
  isFull() {
    return this.progress >= 100;
  }

  // Update progress bar UI elements
  updateUI() {
    if (!this.progressBarElement || !this.progressPercentageElement) {
      return;
    }

    // Update progress bar fill width
    this.progressBarElement.style.width = this.progress + '%';

    // Update percentage text
    this.progressPercentageElement.textContent = Math.floor(this.progress) + '%';
  }

  // Reset progress to 0
  reset() {
    this.progress = 0;
    this.updateUI();
  }

  // Get progress bar element
  getProgressBarElement() {
    return this.progressBarElement;
  }

  // Get progress percentage element
  getProgressPercentageElement() {
    return this.progressPercentageElement;
  }
}

// Effect Manager - Manages temporary visual effects
class EffectManager {
  constructor() {
    this.effects = [];
    this.effectDuration = 0.5; // Duration in seconds for effect fade-out
  }

  // Create a visual effect at a specific position
  createEffect(type, position, spriteAssets) {
    // Validate effect type
    if (!['perfect', 'good', 'miss'].includes(type)) {
      console.warn(`Invalid effect type: ${type}`);
      return;
    }

    // Validate position
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      console.warn('Invalid position for effect');
      return;
    }

    // Get the sprite for this effect type
    const sprite = spriteAssets[type];
    if (!sprite) {
      console.warn(`Sprite not found for effect type: ${type}`);
      return;
    }

    // Create effect object
    const effect = {
      type: type,
      x: position.x,
      y: position.y,
      sprite: sprite,
      createdAt: Date.now(),
      duration: this.effectDuration * 1000, // Convert to milliseconds
      width: 60,
      height: 60,
      opacity: 1.0
    };

    // Add effect to active effects list
    this.effects.push(effect);
  }

  // Update all active effects
  update(deltaTime) {
    // Update each effect's opacity based on elapsed time
    this.effects = this.effects.filter(effect => {
      const elapsedTime = Date.now() - effect.createdAt;
      const progress = elapsedTime / effect.duration;

      // Calculate opacity (fade from 1.0 to 0.0)
      effect.opacity = Math.max(0, 1.0 - progress);

      // Keep effect if still visible, remove if fully faded
      return effect.opacity > 0;
    });
  }

  // Render all active effects on canvas
  render(ctx) {
    this.effects.forEach(effect => {
      // Save canvas state
      ctx.save();

      // Set opacity for this effect
      ctx.globalAlpha = effect.opacity;

      // Draw the effect sprite
      if (effect.sprite) {
        ctx.drawImage(
          effect.sprite,
          effect.x,
          effect.y,
          effect.width,
          effect.height
        );
      }

      // Restore canvas state
      ctx.restore();
    });
  }

  // Get all active effects
  getEffects() {
    return this.effects;
  }

  // Get number of active effects
  getEffectCount() {
    return this.effects.length;
  }

  // Clear all effects
  clearEffects() {
    this.effects = [];
  }

  // Set effect duration (in seconds)
  setEffectDuration(duration) {
    if (typeof duration !== 'number' || duration <= 0) {
      console.warn('Invalid effect duration');
      return false;
    }
    this.effectDuration = duration;
    return true;
  }

  // Get effect duration (in seconds)
  getEffectDuration() {
    return this.effectDuration;
  }
}

// Difficulty Manager - Manages game difficulty settings and parameters
class DifficultyManager {
  constructor() {
    // Define difficulty presets
    this.presets = {
      easy: {
        noteSpawnInterval: 2000,    // 2 seconds between note spawns
        noteSpeed: 150,              // Pixels per second
        monsterBaseSpeed: 30         // Pixels per second
      },
      normal: {
        noteSpawnInterval: 1500,    // 1.5 seconds between note spawns
        noteSpeed: 250,              // Pixels per second
        monsterBaseSpeed: 50         // Pixels per second
      },
      hard: {
        noteSpawnInterval: 1000,    // 1 second between note spawns
        noteSpeed: 350,              // Pixels per second
        monsterBaseSpeed: 80         // Pixels per second
      }
    };

    // Current difficulty settings
    this.currentDifficulty = 'normal';
    this.noteSpawnInterval = this.presets.normal.noteSpawnInterval;
    this.noteSpeed = this.presets.normal.noteSpeed;
    this.monsterBaseSpeed = this.presets.normal.monsterBaseSpeed;
    this.monsterSpeedIncrement = 10; // Speed increase on miss (optional feature)
  }

  // Set difficulty by preset name
  setDifficulty(difficultyName) {
    // Validate difficulty name
    if (!this.presets[difficultyName]) {
      console.warn(`Invalid difficulty: ${difficultyName}. Using normal.`);
      difficultyName = 'normal';
    }

    this.currentDifficulty = difficultyName;
    const preset = this.presets[difficultyName];

    // Apply preset settings
    this.noteSpawnInterval = preset.noteSpawnInterval;
    this.noteSpeed = preset.noteSpeed;
    this.monsterBaseSpeed = preset.monsterBaseSpeed;

    console.log(`Difficulty set to: ${difficultyName}`);
    return true;
  }

  // Get current difficulty name
  getDifficulty() {
    return this.currentDifficulty;
  }

  // Set note spawn interval (in milliseconds)
  setNoteSpawnInterval(interval) {
    if (typeof interval !== 'number' || interval <= 0) {
      console.warn('Invalid note spawn interval');
      return false;
    }
    this.noteSpawnInterval = interval;
    return true;
  }

  // Get note spawn interval
  getNoteSpawnInterval() {
    return this.noteSpawnInterval;
  }

  // Set note speed (pixels per second)
  setNoteSpeed(speed) {
    if (typeof speed !== 'number' || speed <= 0) {
      console.warn('Invalid note speed');
      return false;
    }
    this.noteSpeed = speed;
    return true;
  }

  // Get note speed
  getNoteSpeed() {
    return this.noteSpeed;
  }

  // Set monster base speed (pixels per second)
  setMonsterBaseSpeed(speed) {
    if (typeof speed !== 'number' || speed <= 0) {
      console.warn('Invalid monster base speed');
      return false;
    }
    this.monsterBaseSpeed = speed;
    return true;
  }

  // Get monster base speed
  getMonsterBaseSpeed() {
    return this.monsterBaseSpeed;
  }

  // Set monster speed increment (for speed increase on miss)
  setMonsterSpeedIncrement(increment) {
    if (typeof increment !== 'number' || increment < 0) {
      console.warn('Invalid monster speed increment');
      return false;
    }
    this.monsterSpeedIncrement = increment;
    return true;
  }

  // Get monster speed increment
  getMonsterSpeedIncrement() {
    return this.monsterSpeedIncrement;
  }

  // Apply difficulty settings to game objects
  applyDifficultyToGame(spriteManager, gameManager) {
    try {
      // Validate inputs
      if (!spriteManager || !gameManager) {
        console.warn('Invalid sprite manager or game manager');
        return false;
      }

      // Get monster from sprite manager
      const monster = spriteManager.getMonster();
      if (!monster) {
        console.warn('Monster not found in sprite manager');
        return false;
      }

      // Apply monster base speed
      monster.baseSpeed = this.monsterBaseSpeed;
      monster.resetSpeed();

      console.log('Difficulty settings applied to game');
      return true;
    } catch (error) {
      console.error('Error applying difficulty settings:', error);
      return false;
    }
  }

  // Get all available difficulty presets
  getAvailableDifficulties() {
    return Object.keys(this.presets);
  }

  // Get a specific difficulty preset
  getDifficultyPreset(difficultyName) {
    if (!this.presets[difficultyName]) {
      console.warn(`Difficulty preset not found: ${difficultyName}`);
      return null;
    }
    return { ...this.presets[difficultyName] };
  }

  // Get current settings as an object
  getCurrentSettings() {
    return {
      difficulty: this.currentDifficulty,
      noteSpawnInterval: this.noteSpawnInterval,
      noteSpeed: this.noteSpeed,
      monsterBaseSpeed: this.monsterBaseSpeed,
      monsterSpeedIncrement: this.monsterSpeedIncrement
    };
  }

  // Reset to default (normal) difficulty
  reset() {
    this.setDifficulty('normal');
    return true;
  }
}

// Audio Manager - Manages sound effects playback
class AudioManager {
  constructor() {
    this.audioElements = {};
    this.isMuted = false;
    this.volume = 1.0; // Volume level (0.0 to 1.0)
  }

  // Initialize audio manager with audio elements
  init(audioAssets) {
    try {
      // Store audio elements from game manager assets
      if (!audioAssets || typeof audioAssets !== 'object') {
        throw new Error('Invalid audio assets provided');
      }

      this.audioElements = audioAssets;

      // Set initial volume for all audio elements
      this.setVolume(this.volume);

      console.log('Audio Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Audio Manager initialization failed:', error);
      return false;
    }
  }

  // Play a sound effect by name
  play(soundName) {
    try {
      // Check if sound exists
      if (!this.audioElements[soundName]) {
        console.warn(`Sound not found: ${soundName}`);
        return false;
      }

      const audio = this.audioElements[soundName];

      // Check if audio is muted
      if (this.isMuted) {
        return true;
      }

      // Reset audio to beginning and play
      audio.currentTime = 0;
      
      // Play the audio
      const playPromise = audio.play();
      
      // Handle play promise (for browsers that require user interaction)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound ${soundName}:`, error);
        });
      }

      return true;
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
      return false;
    }
  }

  // Stop a sound effect by name
  stop(soundName) {
    try {
      if (!this.audioElements[soundName]) {
        console.warn(`Sound not found: ${soundName}`);
        return false;
      }

      const audio = this.audioElements[soundName];
      audio.pause();
      audio.currentTime = 0;

      return true;
    } catch (error) {
      console.error(`Error stopping sound ${soundName}:`, error);
      return false;
    }
  }

  // Stop all sounds
  stopAll() {
    try {
      for (const soundName in this.audioElements) {
        this.stop(soundName);
      }
      return true;
    } catch (error) {
      console.error('Error stopping all sounds:', error);
      return false;
    }
  }

  // Set volume level (0.0 to 1.0)
  setVolume(level) {
    try {
      // Validate volume level
      if (typeof level !== 'number' || level < 0 || level > 1) {
        console.warn('Invalid volume level. Must be between 0 and 1');
        return false;
      }

      this.volume = level;

      // Apply volume to all audio elements
      for (const soundName in this.audioElements) {
        this.audioElements[soundName].volume = level;
      }

      return true;
    } catch (error) {
      console.error('Error setting volume:', error);
      return false;
    }
  }

  // Get current volume level
  getVolume() {
    return this.volume;
  }

  // Mute all sounds
  mute() {
    this.isMuted = true;
    return true;
  }

  // Unmute all sounds
  unmute() {
    this.isMuted = false;
    return true;
  }

  // Check if audio is muted
  isMuted() {
    return this.isMuted;
  }

  // Check if a sound is currently playing
  isPlaying(soundName) {
    try {
      if (!this.audioElements[soundName]) {
        console.warn(`Sound not found: ${soundName}`);
        return false;
      }

      const audio = this.audioElements[soundName];
      return !audio.paused && audio.currentTime > 0;
    } catch (error) {
      console.error(`Error checking if sound is playing ${soundName}:`, error);
      return false;
    }
  }

  // Get all available sounds
  getAvailableSounds() {
    return Object.keys(this.audioElements);
  }

  // Check if a sound exists
  soundExists(soundName) {
    return soundName in this.audioElements;
  }
}
