class PhysicsManager {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        this.engine.world.gravity.x = 0;
        this.engine.world.gravity.y = 0.8;
        
        this.createBoundaries();
        
        //console.log('Physics engine initialized with gravity:', this.engine.world.gravity);
    }
    
    createBoundaries() {
        // No static boundaries - world is now fully procedurally generated
        this.boundaries = [];
        
        //console.log('Physics initialized - using procedural world generation only');
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
    
    addConstraint(constraint) {
        Matter.World.add(this.world, constraint);
    }
    
    removeConstraint(constraint) {
        Matter.World.remove(this.world, constraint);
    }
    
    getWorld() {
        return this.world;
    }
    
    getEngine() {
        return this.engine;
    }
    
    getBoundaries() {
        return this.boundaries;
    }
}