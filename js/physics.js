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
        
        // Higher ceiling sections for extended vertical testing
        const ceiling3 = Matter.Bodies.rectangle(250, -100, 140, 20, {
            isStatic: true,
            label: 'ceiling3'
        });
        
        const ceiling4 = Matter.Bodies.rectangle(550, -150, 160, 20, {
            isStatic: true,
            label: 'ceiling4'
        });
        
        const ceiling5 = Matter.Bodies.rectangle(200, -250, 120, 20, {
            isStatic: true,
            label: 'ceiling5'
        });
        
        const ceiling6 = Matter.Bodies.rectangle(600, -300, 100, 20, {
            isStatic: true,
            label: 'ceiling6'
        });
        
        // High platforms for rope attachment testing
        const highPlatform1 = Matter.Bodies.rectangle(400, -50, 100, 20, {
            isStatic: true,
            label: 'highPlatform1'
        });
        
        const highPlatform2 = Matter.Bodies.rectangle(180, -180, 80, 20, {
            isStatic: true,
            label: 'highPlatform2'
        });
        
        const highPlatform3 = Matter.Bodies.rectangle(620, -220, 90, 20, {
            isStatic: true,
            label: 'highPlatform3'
        });
        
        const highPlatform4 = Matter.Bodies.rectangle(300, -350, 110, 20, {
            isStatic: true,
            label: 'highPlatform4'
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
        
        // Higher vertical pillars for rope wrapping testing
        const highPillar1 = Matter.Bodies.rectangle(150, -80, 20, 160, {
            isStatic: true,
            label: 'highPillar1'
        });
        
        const highPillar2 = Matter.Bodies.rectangle(650, -120, 20, 140, {
            isStatic: true,
            label: 'highPillar2'
        });
        
        const highPillar3 = Matter.Bodies.rectangle(380, -200, 20, 100, {
            isStatic: true,
            label: 'highPillar3'
        });
        
        this.boundaries = [
            ground, leftWall, rightWall,
            platform1, platform2, platform3, platform4,
            ceiling1, ceiling2, ceiling3, ceiling4, ceiling5, ceiling6,
            highPlatform1, highPlatform2, highPlatform3, highPlatform4,
            pillar1, pillar2, highPillar1, highPillar2, highPillar3
        ];
        
        this.boundaries.forEach(boundary => {
            Matter.World.add(this.world, boundary);
        });
        
        //console.log('Enhanced environment created with platforms, ceilings, and pillars');
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