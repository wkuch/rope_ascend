class RisingHazard {
    constructor(physicsManager) {
        this.physics = physicsManager;
        
        // Hazard parameters
        this.riseSpeed = 25; // pixels per second - adjustable for difficulty
        this.width = 800; // Full screen width
        this.height = 100; // Height of hazard zone
        this.startY = 700; // Start below screen
        this.currentY = this.startY;
        
        // Visual properties
        this.color = '#ff4444'; // Red hazard color
        this.waveAmplitude = 5;
        this.waveFrequency = 0.01;
        this.waveOffset = 0;
        
        // Physics body for collision detection
        this.body = Matter.Bodies.rectangle(
            this.width / 2,
            this.currentY - this.height / 2,
            this.width,
            this.height,
            {
                isStatic: true,
                isSensor: true, // Sensor to detect collision without physics response
                label: 'risingHazard'
            }
        );
        
        this.physics.addBody(this.body);
        
        console.log('Rising hazard initialized at y:', this.startY, 'rise speed:', this.riseSpeed, 'px/s');
    }
    
    update(deltaTime) {
        // Update wave animation
        this.waveOffset += deltaTime * 0.002;
        
        const oldY = this.currentY;
        
        // Rise upward at constant speed
        this.currentY -= this.riseSpeed * (deltaTime / 1000);
        
        
        // Update physics body position
        Matter.Body.setPosition(this.body, {
            x: this.width / 2,
            y: this.currentY - this.height / 2
        });
    }
    
    checkPlayerCollision(player) {
        // Check if player is touching the hazard
        const playerPos = player.getPosition();
        const playerRadius = player.getRadius();
        
        // Simple rectangular collision detection
        const hazardTop = this.currentY - this.height;
        const hazardBottom = this.currentY;
        const hazardLeft = 0;
        const hazardRight = this.width;
        
        // Check if player circle intersects with hazard rectangle
        const playerLeft = playerPos.x - playerRadius;
        const playerRight = playerPos.x + playerRadius;
        const playerTop = playerPos.y - playerRadius;
        const playerBottom = playerPos.y + playerRadius;
        
        const collision = (
            playerRight > hazardLeft &&
            playerLeft < hazardRight &&
            playerBottom > hazardTop &&
            playerTop < hazardBottom
        );
        
        if (collision) {
            return true;
        }
        
        
        return false;
    }
    
    getCurrentY() {
        return this.currentY;
    }
    
    getVisualData() {
        return {
            x: 0,
            y: this.currentY - this.height,
            width: this.width,
            height: this.height,
            color: this.color,
            waveAmplitude: this.waveAmplitude,
            waveFrequency: this.waveFrequency,
            waveOffset: this.waveOffset
        };
    }
    
    // Get rise speed for UI display
    getRiseSpeed() {
        return this.riseSpeed;
    }
    
    // Adjust rise speed for difficulty tuning
    setRiseSpeed(speed) {
        this.riseSpeed = Math.max(0, speed);
        console.log('Hazard rise speed set to:', this.riseSpeed, 'px/s');
    }
    
    // Reset hazard position for game restart
    reset() {
        this.currentY = this.startY;
        this.waveOffset = 0;
        
        Matter.Body.setPosition(this.body, {
            x: this.width / 2,
            y: this.currentY - this.height / 2
        });
        
        console.log('Hazard reset to starting position');
    }
    
    // Clean up physics body
    destroy() {
        this.physics.removeBody(this.body);
    }
}