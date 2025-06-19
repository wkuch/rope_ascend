class WorldGenerator {
    constructor(physicsManager) {
        this.physics = physicsManager;
        this.chunkHeight = 400;
        this.chunkWidth = 800;
        this.activeChunks = new Map();
        this.chunkCounter = 0;
        
        // World generation parameters
        this.baseWallWidth = 60;
        this.maxWallVariation = 40;
        this.noiseScale = 0.01;
        this.minChasmWidth = 200;
        this.maxChasmWidth = 400;
        
        // Streaming performance tracking
        this.lastCameraY = 0;
        this.chunksGenerated = 0;
        this.chunksRemoved = 0;
        this.totalPhysicsBodies = 0;
        this.emergencyPlatforms = 0;
        this.boundaryPlatforms = 0;
        
        console.log('WorldGenerator initialized with chunk size:', this.chunkWidth, 'x', this.chunkHeight);
    }
    
    generateChunk(chunkY) {
        const chunkId = `chunk_${chunkY}`;
        
        // Don't regenerate existing chunks
        if (this.activeChunks.has(chunkId)) {
            return this.activeChunks.get(chunkId);
        }
        
        const chunk = {
            id: chunkId,
            y: chunkY,
            height: this.chunkHeight,
            leftWallCoords: [],
            rightWallCoords: [],
            platforms: [],
            ceilings: [],
            physicsBodies: []
        };
        
        // Generate wall coordinates for this chunk
        this.generateWallCoordinates(chunk);
        this.generatePlatforms(chunk);
        this.generateCeilings(chunk);
        
        // Validate and ensure strategic anchor point placement
        this.validateAnchorPoints(chunk);
        
        // Create physics bodies from generated geometry
        this.createPhysicsBodies(chunk);
        
        // Add chasm boundaries for this chunk
        this.createChasmBoundaries(chunk);
        
        this.activeChunks.set(chunkId, chunk);
        this.chunksGenerated++;
        this.totalPhysicsBodies += chunk.physicsBodies.length;
        
        console.log(`Generated chunk: ${chunkId} at y: ${chunkY} with ${chunk.physicsBodies.length} physics bodies`);
        
        return chunk;
    }
    
    generateWallCoordinates(chunk) {
        const numPoints = 20; // Points per chunk height
        const stepY = chunk.height / numPoints;
        
        for (let i = 0; i <= numPoints; i++) {
            const y = chunk.y + i * stepY;
            
            // Simple noise function for wall variation
            const noiseValue = this.noise(y * this.noiseScale);
            const variation = noiseValue * this.maxWallVariation;
            
            // Left wall coordinates (x increases inward)
            const leftX = this.baseWallWidth + variation;
            chunk.leftWallCoords.push({ x: leftX, y: y });
            
            // Right wall coordinates (x decreases inward)
            const rightX = this.chunkWidth - this.baseWallWidth - variation;
            chunk.rightWallCoords.push({ x: rightX, y: y });
        }
    }
    
    generatePlatforms(chunk) {
        // Generate strategic platforms ensuring attachment points every 100-150px
        const maxVerticalGap = 150; // Maximum gap between attachment points
        const targetPlatformSpacing = 120; // Ideal spacing between platforms
        const numPlatforms = Math.max(3, Math.ceil(chunk.height / targetPlatformSpacing));
        
        for (let i = 0; i < numPlatforms; i++) {
            const y = chunk.y + (i + 1) * (chunk.height / (numPlatforms + 1));
            
            // Alternate sides and occasionally place in center for variety
            const placementChoice = Math.random();
            let platformX, platformWidth;
            
            if (placementChoice < 0.4) {
                // Platform extending from left wall
                const wallX = this.getWallXAtY(chunk.leftWallCoords, y);
                platformWidth = 80 + Math.random() * 60;
                platformX = wallX + platformWidth / 2;
            } else if (placementChoice < 0.8) {
                // Platform extending from right wall
                const wallX = this.getWallXAtY(chunk.rightWallCoords, y);
                platformWidth = 80 + Math.random() * 60;
                platformX = wallX - platformWidth / 2;
            } else {
                // Center platform for strategic positioning
                platformWidth = 100 + Math.random() * 80;
                platformX = 300 + Math.random() * 200; // Center area of chasm
            }
            
            chunk.platforms.push({
                x: platformX,
                y: y,
                width: platformWidth,
                height: 20,
                type: 'platform'
            });
        }
    }
    
    generateCeilings(chunk) {
        // Generate strategic ceiling sections for overhead attachment
        const numCeilings = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < numCeilings; i++) {
            const y = chunk.y + (i + 0.5) * (chunk.height / (numCeilings + 1));
            
            // Vary ceiling placement for strategic value
            const placementType = Math.random();
            let centerX, width;
            
            if (placementType < 0.6) {
                // Center ceiling for overhead swinging
                centerX = 250 + Math.random() * 300;
                width = 120 + Math.random() * 160;
            } else {
                // Side ceiling extending into chasm
                const isLeftSide = Math.random() < 0.5;
                if (isLeftSide) {
                    centerX = 150 + Math.random() * 150;
                } else {
                    centerX = 500 + Math.random() * 150;
                }
                width = 100 + Math.random() * 120;
            }
            
            chunk.ceilings.push({
                x: centerX,
                y: y,
                width: width,
                height: 20,
                type: 'ceiling'
            });
        }
    }
    
    validateAnchorPoints(chunk) {
        // Ensure no vertical gaps exceed rope range (400px)
        const maxGap = 150; // Conservative gap to ensure reachability
        
        // Get all attachment points in chunk (platforms, ceilings, walls)
        const attachmentPoints = [];
        
        // Add platforms
        chunk.platforms.forEach(platform => {
            attachmentPoints.push({ x: platform.x, y: platform.y, type: 'platform' });
        });
        
        // Add ceilings
        chunk.ceilings.forEach(ceiling => {
            attachmentPoints.push({ x: ceiling.x, y: ceiling.y, type: 'ceiling' });
        });
        
        // Add wall points (sample every 50px for attachment validation)
        for (let y = chunk.y; y < chunk.y + chunk.height; y += 50) {
            const leftX = this.getWallXAtY(chunk.leftWallCoords, y);
            const rightX = this.getWallXAtY(chunk.rightWallCoords, y);
            attachmentPoints.push({ x: leftX, y: y, type: 'leftWall' });
            attachmentPoints.push({ x: rightX, y: y, type: 'rightWall' });
        }
        
        // Sort by Y coordinate
        attachmentPoints.sort((a, b) => a.y - b.y);
        
        // Check for gaps and add emergency platforms if needed
        for (let i = 0; i < attachmentPoints.length - 1; i++) {
            const gap = attachmentPoints[i + 1].y - attachmentPoints[i].y;
            
            if (gap > maxGap) {
                // Add emergency platform in the gap
                const emergencyY = attachmentPoints[i].y + gap / 2;
                const emergencyX = 300 + Math.random() * 200; // Center placement
                
                chunk.platforms.push({
                    x: emergencyX,
                    y: emergencyY,
                    width: 120,
                    height: 20,
                    type: 'emergency',
                    emergency: true
                });
                
                this.emergencyPlatforms++;
                console.log(`Added emergency platform at y=${Math.round(emergencyY)} to fill ${Math.round(gap)}px gap`);
            }
        }
        
        // Validate chunk boundaries with neighboring chunks
        this.validateChunkBoundaries(chunk);
    }
    
    validateChunkBoundaries(chunk) {
        // Ensure connectivity between chunks
        
        // Check if there are attachment points near chunk boundaries
        const topBoundary = chunk.y;
        const bottomBoundary = chunk.y + chunk.height;
        
        // Ensure attachment points near top and bottom of chunk
        const topPoints = chunk.platforms.concat(chunk.ceilings).filter(point => 
            Math.abs(point.y - topBoundary) < 100
        );
        
        const bottomPoints = chunk.platforms.concat(chunk.ceilings).filter(point => 
            Math.abs(point.y - bottomBoundary) < 100
        );
        
        // Add boundary platforms if needed
        if (topPoints.length === 0) {
            chunk.platforms.push({
                x: 250 + Math.random() * 300,
                y: topBoundary + 50,
                width: 100,
                height: 20,
                type: 'boundary',
                boundary: true
            });
            this.boundaryPlatforms++;
        }
        
        if (bottomPoints.length === 0) {
            chunk.platforms.push({
                x: 250 + Math.random() * 300,
                y: bottomBoundary - 50,
                width: 100,
                height: 20,
                type: 'boundary',
                boundary: true
            });
            this.boundaryPlatforms++;
        }
    }
    
    getWallXAtY(wallCoords, targetY) {
        // Linear interpolation between wall points
        for (let i = 0; i < wallCoords.length - 1; i++) {
            const p1 = wallCoords[i];
            const p2 = wallCoords[i + 1];
            
            if (targetY >= p1.y && targetY <= p2.y) {
                const t = (targetY - p1.y) / (p2.y - p1.y);
                return p1.x + t * (p2.x - p1.x);
            }
        }
        
        // Fallback to closest point
        return wallCoords[0].x;
    }
    
    createPhysicsBodies(chunk) {
        // Create physics bodies for platforms
        chunk.platforms.forEach(platform => {
            const body = Matter.Bodies.rectangle(
                platform.x,
                platform.y, 
                platform.width,
                platform.height,
                {
                    isStatic: true,
                    label: `platform_${chunk.id}`
                }
            );
            this.physics.addBody(body);
            chunk.physicsBodies.push(body);
        });
        
        // Create physics bodies for ceilings
        chunk.ceilings.forEach(ceiling => {
            const body = Matter.Bodies.rectangle(
                ceiling.x,
                ceiling.y,
                ceiling.width,
                ceiling.height,
                {
                    isStatic: true,
                    label: `ceiling_${chunk.id}`
                }
            );
            this.physics.addBody(body);
            chunk.physicsBodies.push(body);
        });
        
        // Create physics bodies for walls using coordinate points
        this.createWallPhysicsBodies(chunk, chunk.leftWallCoords, 'leftWall');
        this.createWallPhysicsBodies(chunk, chunk.rightWallCoords, 'rightWall');
    }
    
    createWallPhysicsBodies(chunk, wallCoords, wallType) {
        if (wallCoords.length < 2) return;
        
        // Create rectangular segments for each wall section
        for (let i = 0; i < wallCoords.length - 1; i++) {
            const p1 = wallCoords[i];
            const p2 = wallCoords[i + 1];
            
            const centerX = (p1.x + p2.x) / 2;
            const centerY = (p1.y + p2.y) / 2;
            const width = Math.abs(p2.x - p1.x) + 20; // Add thickness
            const height = Math.abs(p2.y - p1.y) + 20;
            
            // Skip very small segments
            if (width < 10 && height < 10) continue;
            
            const body = Matter.Bodies.rectangle(
                centerX,
                centerY,
                Math.max(width, 20),
                Math.max(height, 20),
                {
                    isStatic: true,
                    label: `${wallType}_${chunk.id}_${i}`
                }
            );
            
            this.physics.addBody(body);
            chunk.physicsBodies.push(body);
        }
    }
    
    createChasmBoundaries(chunk) {
        // Create left and right chasm walls based on generated coordinates
        const wallThickness = 50;
        
        // Create physics bodies for left wall segments
        for (let i = 0; i < chunk.leftWallCoords.length - 1; i++) {
            const p1 = chunk.leftWallCoords[i];
            const p2 = chunk.leftWallCoords[i + 1];
            
            const centerX = (p1.x + p2.x) / 2 - wallThickness / 2; // Position wall outside chasm
            const centerY = (p1.y + p2.y) / 2;
            const height = Math.abs(p2.y - p1.y) + 10;
            
            const leftWallBody = Matter.Bodies.rectangle(
                centerX,
                centerY,
                wallThickness,
                Math.max(height, 20),
                {
                    isStatic: true,
                    label: `leftChasmWall_${chunk.id}_${i}`
                }
            );
            
            this.physics.addBody(leftWallBody);
            chunk.physicsBodies.push(leftWallBody);
        }
        
        // Create physics bodies for right wall segments
        for (let i = 0; i < chunk.rightWallCoords.length - 1; i++) {
            const p1 = chunk.rightWallCoords[i];
            const p2 = chunk.rightWallCoords[i + 1];
            
            const centerX = (p1.x + p2.x) / 2 + wallThickness / 2; // Position wall outside chasm
            const centerY = (p1.y + p2.y) / 2;
            const height = Math.abs(p2.y - p1.y) + 10;
            
            const rightWallBody = Matter.Bodies.rectangle(
                centerX,
                centerY,
                wallThickness,
                Math.max(height, 20),
                {
                    isStatic: true,
                    label: `rightChasmWall_${chunk.id}_${i}`
                }
            );
            
            this.physics.addBody(rightWallBody);
            chunk.physicsBodies.push(rightWallBody);
        }
        
        // Add ground at bottom of chasm (only for chunks at or below ground level)
        if (chunk.y + chunk.height >= 550) {
            const groundBody = Matter.Bodies.rectangle(
                this.chunkWidth / 2,
                chunk.y + chunk.height + 20,
                this.chunkWidth,
                40,
                {
                    isStatic: true,
                    label: `ground_${chunk.id}`
                }
            );
            
            this.physics.addBody(groundBody);
            chunk.physicsBodies.push(groundBody);
        }
    }
    
    getActiveChunks() {
        return Array.from(this.activeChunks.values());
    }
    
    removeChunk(chunkId) {
        if (this.activeChunks.has(chunkId)) {
            const chunk = this.activeChunks.get(chunkId);
            
            // Remove all physics bodies associated with this chunk
            chunk.physicsBodies.forEach(body => {
                this.physics.removeBody(body);
            });
            
            this.totalPhysicsBodies -= chunk.physicsBodies.length;
            this.chunksRemoved++;
            this.activeChunks.delete(chunkId);
            
            console.log(`Removed chunk: ${chunkId} and ${chunk.physicsBodies.length} physics bodies`);
        }
    }
    
    // Simple noise function for wall variation
    noise(x) {
        return Math.sin(x * 2.7) * 0.3 + Math.sin(x * 5.1) * 0.2 + Math.sin(x * 8.3) * 0.1;
    }
    
    // Get chunks needed for current camera position
    getRequiredChunks(cameraY) {
        const chunks = [];
        const viewportHeight = 600;
        const bufferZone = 2; // Generate 2 chunks ahead and behind
        
        // Calculate which chunks we need
        const topChunk = Math.floor((cameraY - viewportHeight - bufferZone * this.chunkHeight) / this.chunkHeight) * this.chunkHeight;
        const bottomChunk = Math.floor((cameraY + viewportHeight + bufferZone * this.chunkHeight) / this.chunkHeight) * this.chunkHeight;
        
        for (let chunkY = topChunk; chunkY <= bottomChunk; chunkY += this.chunkHeight) {
            chunks.push(chunkY);
        }
        
        return chunks;
    }
    
    update(cameraY) {
        // Only update if camera has moved significantly (optimization)
        if (Math.abs(cameraY - this.lastCameraY) < 50) {
            return;
        }
        
        const requiredChunks = this.getRequiredChunks(cameraY);
        let newChunksGenerated = 0;
        let chunksRemoved = 0;
        
        // Generate new chunks if needed
        requiredChunks.forEach(chunkY => {
            const chunkId = `chunk_${chunkY}`;
            if (!this.activeChunks.has(chunkId)) {
                this.generateChunk(chunkY);
                newChunksGenerated++;
            }
        });
        
        // Remove chunks that are too far away
        const activeChunkIds = Array.from(this.activeChunks.keys());
        const requiredChunkIds = requiredChunks.map(y => `chunk_${y}`);
        
        activeChunkIds.forEach(chunkId => {
            if (!requiredChunkIds.includes(chunkId)) {
                this.removeChunk(chunkId);
                chunksRemoved++;
            }
        });
        
        // Update tracking
        this.lastCameraY = cameraY;
        
        // Log streaming activity
        if (newChunksGenerated > 0 || chunksRemoved > 0) {
            console.log(`World streaming: +${newChunksGenerated} chunks, -${chunksRemoved} chunks. Active: ${this.activeChunks.size}, Bodies: ${this.totalPhysicsBodies}`);
        }
    }
    
    // Get streaming statistics for debugging
    getStreamingStats() {
        return {
            activeChunks: this.activeChunks.size,
            totalGenerated: this.chunksGenerated,
            totalRemoved: this.chunksRemoved,
            totalPhysicsBodies: this.totalPhysicsBodies,
            emergencyPlatforms: this.emergencyPlatforms,
            boundaryPlatforms: this.boundaryPlatforms,
            lastCameraY: this.lastCameraY
        };
    }
}