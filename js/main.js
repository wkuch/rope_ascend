class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        
        this.input = new InputManager(this.canvas);
        this.physics = new PhysicsManager();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.player = new Player(400, 100, this.physics);
        this.rope = new Rope(this.physics);
        this.world = new WorldGenerator(this.physics);
        this.hazard = new RisingHazard(this.physics);
        this.scoring = new ScoringSystem();
        this.gameState = new GameStateManager();
        this.renderer = new Renderer(this.canvas);
        this.logger = new Logger(this);
        
        // Focus the canvas to receive keyboard events
        this.canvas.focus();
        
        // Add click listener to canvas to ensure focus
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        this.start();
    }
    
    start() {
        this.gameLoop(0);
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.calculateFPS(currentTime);
        
        this.update(deltaTime);
        this.render();
        
        // Reset input state at end of frame
        this.input.endFrame();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    calculateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
            //console.log('FPS:', this.fps);
        }
    }
    
    update(deltaTime) {
        this.input.update();
        
        const currentState = this.gameState.getState();
        
        switch (currentState) {
            case 'menu':
                this.updateMenu();
                break;
            case 'playing':
                this.updatePlaying(deltaTime);
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
            default:
                console.error('Unknown game state:', currentState);
        }
    }
    
    updateMenu() {
        // Menu input handling
        if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter') || 
            this.input.isMousePressed() || this.input.isKeyPressed('NumpadEnter')) {
            this.startGame();
        }
    }
    
    updatePlaying(deltaTime) {
        this.physics.update(deltaTime);
        this.player.update(deltaTime, this.input);
        this.rope.update(this.player, this.input, this.camera);
        this.hazard.update(deltaTime);
        this.camera.update(this.player.getPosition());
        this.world.update(this.camera.getPosition().y);
        
        // Update score based on player height
        this.scoring.updateScore(this.player.getPosition().y);
        
        // Check hazard collision
        if (this.hazard.checkPlayerCollision(this.player)) {
            this.player.setState('dead');
            this.scoring.saveHighScore();
            this.gameState.transitionTo('gameOver');
        }

        // Log game state
        this.logger.logState();

        // Check for log download trigger
        if (this.input.isKeyJustPressed('KeyL')) {
            console.log("'L' key pressed, attempting to download log...");
            this.logger.downloadLog();
        }
    }
    
    updateGameOver() {
        // Game over input handling
        if (this.input.isKeyPressed('KeyR') || this.input.isKeyPressed('Space')) {
            this.startGame();
        } else if (this.input.isKeyPressed('KeyM') || this.input.isKeyPressed('Escape')) {
            this.gameState.transitionTo('menu');
        }
    }
    
    startGame() {
        
        // Reset player position and state
        Matter.Body.setPosition(this.player.getBody(), { x: 400, y: 100 });
        Matter.Body.setVelocity(this.player.getBody(), { x: 0, y: 0 });
        this.player.setState('falling');
        
        // Reset rope
        this.rope.releaseRope();
        
        // Reset hazard
        this.hazard.reset();
        
        // Reset camera
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        // Reset world
        this.world.reset();
        
        // Force initial world generation around player position
        this.world.update(this.player.getPosition().y);
        
        // Reset scoring
        this.scoring.reset();
        
        // Transition to playing state
        this.gameState.transitionTo('playing');
    }

    render() {
        const currentState = this.gameState.getState();
        
        
        this.renderer.render(this.camera, this.player, this.physics, this.rope, this.world, this.hazard, currentState, this.scoring);
    }
}

window.addEventListener('load', () => {
    new Game();
});