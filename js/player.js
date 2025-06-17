class Player {
    constructor(x, y, physicsManager) {
        this.physicsManager = physicsManager;
        this.radius = 8;
        
        this.states = {
            FALLING: 'falling',
            ROPE_ATTACHED: 'rope_attached',
            DEAD: 'dead'
        };
        
        this.currentState = this.states.FALLING;
        
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            density: 0.001,
            frictionAir: 0.01,
            restitution: 0.3,
            friction: 0.1
        });
        
        this.physicsManager.addBody(this.body);
        
        //console.log('Player created at:', x, y, 'with radius:', this.radius);
    }
    
    update(deltaTime, input) {
        this.handleTestingControls(input);
        this.updateState();
        this.checkBounds();
        this.logDebugInfo();
    }
    
    checkBounds() {
        const pos = this.getPosition();
        const vel = this.getVelocity();
        
        // Check if player is going off-screen or has extreme velocity
        const isOffScreen = pos.x < -100 || pos.x > 900 || pos.y < -100 || pos.y > 700;
        const hasExtremeVelocity = Math.abs(vel.x) > 50 || Math.abs(vel.y) > 50;
        
        if (isOffScreen) {
            //console.error('PLAYER OFF-SCREEN! Position:', pos, 'Velocity:', vel);
        }
        
        if (hasExtremeVelocity) {
            //console.warn('EXTREME PLAYER VELOCITY! Position:', pos, 'Velocity:', vel);
        }
    }
    
    logDebugInfo() {
        const pos = this.getPosition();
        const vel = this.getVelocity();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        
        if (speed > 0.1) {
            // Debug: Log player position and velocity - disabled for now to reduce console noise
            //console.log(`Player - State: ${this.currentState}, Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)}), Vel: (${Math.round(vel.x * 10)/10}, ${Math.round(vel.y * 10)/10}), Speed: ${Math.round(speed * 10)/10}`);
        }
    }
    
    handleTestingControls(input) {
        // Removed HJUK test controls - rope swing controls (A/D) are now primary movement
        // Test controls were temporary for Phase 1/2 development
    }
    
    updateState() {
        switch (this.currentState) {
            case this.states.FALLING:
                break;
            case this.states.ROPE_ATTACHED:
                break;
            case this.states.DEAD:
                break;
        }
    }
    
    setState(newState) {
        if (this.states[newState.toUpperCase()]) {
            this.currentState = this.states[newState.toUpperCase()];
            //console.log('Player state changed to:', this.currentState);
        }
    }
    
    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y
        };
    }
    
    getVelocity() {
        return {
            x: this.body.velocity.x,
            y: this.body.velocity.y
        };
    }
    
    getState() {
        return this.currentState;
    }
    
    getRadius() {
        return this.radius;
    }
    
    getBody() {
        return this.body;
    }
    
    isDead() {
        return this.currentState === this.states.DEAD;
    }
}