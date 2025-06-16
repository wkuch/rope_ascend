class PhysicsManager {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        this.engine.world.gravity.x = 0;
        this.engine.world.gravity.y = 0.8;
        
        this.createBoundaries();
        
        console.log('Physics engine initialized with gravity:', this.engine.world.gravity);
    }
    
    createBoundaries() {
        // Ground
        const ground = Matter.Bodies.rectangle(400, 580, 800, 40, { 
            isStatic: true,
            label: 'ground'
        });
        
        // Main walls - made taller for better rope attachment
        const leftWall = Matter.Bodies.rectangle(20, 200, 40, 800, { 
            isStatic: true,
            label: 'leftWall'
        });
        
        const rightWall = Matter.Bodies.rectangle(780, 200, 40, 800, { 
            isStatic: true,
            label: 'rightWall'
        });
        
        // Additional platforms and obstacles for rope attachment
        const platform1 = Matter.Bodies.rectangle(200, 450, 120, 20, {
            isStatic: true,
            label: 'platform1'
        });
        
        const platform2 = Matter.Bodies.rectangle(600, 350, 80, 20, {
            isStatic: true,
            label: 'platform2'
        });
        
        const platform3 = Matter.Bodies.rectangle(150, 280, 100, 20, {
            isStatic: true,
            label: 'platform3'
        });
        
        const platform4 = Matter.Bodies.rectangle(650, 200, 90, 20, {
            isStatic: true,
            label: 'platform4'
        });
        
        // Ceiling sections for overhead attachment
        const ceiling1 = Matter.Bodies.rectangle(300, 50, 150, 20, {
            isStatic: true,
            label: 'ceiling1'
        });
        
        const ceiling2 = Matter.Bodies.rectangle(500, 80, 120, 20, {
            isStatic: true,
            label: 'ceiling2'
        });
        
        // Vertical pillars for varied attachment
        const pillar1 = Matter.Bodies.rectangle(350, 380, 20, 140, {
            isStatic: true,
            label: 'pillar1'
        });
        
        const pillar2 = Matter.Bodies.rectangle(450, 250, 20, 120, {
            isStatic: true,
            label: 'pillar2'
        });
        
        this.boundaries = [
            ground, leftWall, rightWall,
            platform1, platform2, platform3, platform4,
            ceiling1, ceiling2,
            pillar1, pillar2
        ];
        
        this.boundaries.forEach(boundary => {
            Matter.World.add(this.world, boundary);
        });
        
        console.log('Enhanced environment created with platforms, ceilings, and pillars');
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