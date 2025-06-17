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
        this.renderer = new Renderer(this.canvas);
        
        this.state = 'running';
        
        //console.log('Game initialized');
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
        this.physics.update(deltaTime);
        this.player.update(deltaTime, this.input);
        this.rope.update(this.player, this.input, this.camera);
        this.camera.update(this.player.getPosition());
    }
    
    render() {
        this.renderer.render(this.camera, this.player, this.physics, this.rope);
    }
}

window.addEventListener('load', () => {
    new Game();
});