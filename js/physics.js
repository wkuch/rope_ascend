class PhysicsManager {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        this.engine.world.gravity.x = 0;
        this.engine.world.gravity.y = 0.8;
        
        console.log('Physics engine initialized with gravity:', this.engine.world.gravity);
    }
    
    update(deltaTime) {
        Matter.Engine.update(this.engine, deltaTime);
    }
    
    addBody(body) {
        Matter.World.add(this.world, body);
    }
    
    removeBody(body) {
        Matter.World.remove(this.world, body);
    }
    
    getWorld() {
        return this.world;
    }
    
    getEngine() {
        return this.engine;
    }
}