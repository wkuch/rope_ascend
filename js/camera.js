class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.x = 0;
        this.y = 0;
        this.maxY = 0;
        
        this.followThreshold = canvasHeight * 0.25;
        this.smoothing = 0.1;
        
        //console.log('Camera initialized with threshold:', this.followThreshold);
    }
    
    update(playerPosition) {
        const oldY = this.y;
        const playerScreenY = playerPosition.y - this.y;
        
        if (playerScreenY < this.followThreshold) {
            const targetY = playerPosition.y - this.followThreshold;
            
            if (targetY < this.maxY) {
                this.y = targetY;
                this.maxY = this.y;
            }
        }
        
        if (this.y !== oldY) {
            //console.log(`Camera moved up from ${Math.round(oldY)} to ${Math.round(this.y)} (player at ${Math.round(playerPosition.y)})`);
        }
    }
    
    getTransform() {
        return {
            x: -this.x,
            y: -this.y
        };
    }
    
    getPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }
    
    getViewport() {
        return {
            left: this.x,
            right: this.x + this.canvasWidth,
            top: this.y,
            bottom: this.y + this.canvasHeight
        };
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}