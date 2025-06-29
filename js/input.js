class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            pressed: false,
            released: false
        };
        
        this.keys = {};
        this.prevKeys = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = true;
                this.mouse.pressed = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
                this.mouse.released = true;
            }
        });
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update() {
        if (this.mouse.isDown || Object.values(this.keys).some(key => key)) {
            //console.log(`Mouse: (${Math.round(this.mouse.x)}, ${Math.round(this.mouse.y)}), Down: ${this.mouse.isDown}`);
            const activeKeys = Object.keys(this.keys).filter(key => this.keys[key]);
            if (activeKeys.length > 0) {
                //console.log('Active keys:', activeKeys);
            }
        }
    }
    
    endFrame() {
        // Reset mouse state flags at end of frame
        this.prevKeys = { ...this.keys };
        this.mouse.pressed = false;
        this.mouse.released = false;
    }
    
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    isMouseDown() {
        return this.mouse.isDown;
    }
    
    isMousePressed() {
        return this.mouse.pressed;
    }
    
    isMouseReleased() {
        return this.mouse.released;
    }

    isKeyJustPressed(keyCode) {
        return this.keys[keyCode] && !this.prevKeys[keyCode];
    }
}