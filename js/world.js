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
        
        // Cluster statistics
        this.clusterStats = {
            stair: 0,
            overhang: 0,
            stack: 0,
            scattered: 0,
            strategic: 0
        };
        
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
            physicsBodies: [],
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
        // Generate very sparse platforms for challenging rope swinging gameplay
        const targetClusterSpacing = 350; // Even more spacing between clusters
        const numClusters = Math.max(1, Math.floor(chunk.height / targetClusterSpacing)); // Fewer clusters, sometimes none
        
        // Clear platforms array
        chunk.platforms = [];
        
        // 80% chance to generate platforms, 20% chance of completely empty chunk
        if (Math.random() < 0.8) {
            for (let i = 0; i < numClusters; i++) {
                const clusterCenterY = chunk.y + (i + 1) * (chunk.height / Math.max(1, numClusters));
                
                // 50% chance of cluster, 50% chance of single strategic platform
                if (Math.random() < 0.5) {
                    const clusterType = this.selectClusterType();
                    const clusterPlatforms = this.generateCluster(clusterType, clusterCenterY, chunk);
                    chunk.platforms.push(...clusterPlatforms);
                } else {
                    // Single strategic platform for long swings
                    const strategicPlatform = this.generateStrategicPlatform(clusterCenterY, chunk);
                    chunk.platforms.push(strategicPlatform);
                    this.clusterStats.strategic++; // Track strategic platforms
                }
            }
        }
        
        // Ensure minimum platform density for safety (very lenient for challenge)
        this.ensureMinimumPlatformDensity(chunk);
    }
    
    selectClusterType() {
        const types = ['stair', 'overhang', 'stack', 'scattered'];
        const weights = [0.25, 0.25, 0.25, 0.25]; // Equal probability for now
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return types[i];
            }
        }
        
        return types[types.length - 1];
    }
    
    generateCluster(clusterType, centerY, chunk) {
        // Track cluster generation statistics
        if (this.clusterStats[clusterType] !== undefined) {
            this.clusterStats[clusterType]++;
        }
        
        switch (clusterType) {
            case 'stair':
                return this.generateStairCluster(centerY, chunk);
            case 'overhang':
                return this.generateOverhangCluster(centerY, chunk);
            case 'stack':
                return this.generateStackCluster(centerY, chunk);
            case 'scattered':
                return this.generateScatteredCluster(centerY, chunk);
            default:
                return this.generateScatteredCluster(centerY, chunk);
        }
    }
    
    generateStairCluster(centerY, chunk) {
        const platforms = [];
        const numSteps = 2; // Fixed 2 steps for minimal challenge
        const stepSpacingY = 80 + Math.random() * 60; // 80-140px vertical spacing (more challenge)
        const stepSpacingX = 100 + Math.random() * 80; // 100-180px horizontal spacing (wider gaps)
        const ascending = Math.random() < 0.5; // Random direction
        
        const startX = 250 + Math.random() * 300; // Start position in chasm
        const startY = centerY - (numSteps - 1) * stepSpacingY / 2;
        
        for (let i = 0; i < numSteps; i++) {
            const stepX = startX + (ascending ? i : -i) * stepSpacingX;
            const stepY = startY + i * stepSpacingY;
            const size = this.generatePlatformSize('medium');
            
            platforms.push({
                x: stepX,
                y: stepY,
                width: size.width,
                height: size.height,
                type: 'stair',
                clusterType: 'stair',
                stepIndex: i
            });
        }
        
        return platforms;
    }
    
    generateOverhangCluster(centerY, chunk) {
        const platforms = [];
        const numPlatforms = Math.random() < 0.7 ? 1 : 2; // Mostly 1 platform, rarely 2
        const isLeftSide = Math.random() < 0.5;
        
        const baseWallX = isLeftSide ? 
            this.getWallXAtY(chunk.leftWallCoords, centerY) :
            this.getWallXAtY(chunk.rightWallCoords, centerY);
        
        for (let i = 0; i < numPlatforms; i++) {
            const platformY = centerY - 50 + i * 100; // Even more vertical spread
            const extension = 120 + i * 50; // Extend further for challenge
            // 30% chance of large platforms in overhangs for better visibility
            const sizeType = Math.random() < 0.3 ? 'large' : 'medium';
            const size = this.generatePlatformSize(sizeType);
            
            const platformX = isLeftSide ?
                baseWallX + extension :
                baseWallX - extension;
            
            platforms.push({
                x: platformX,
                y: platformY,
                width: size.width,
                height: size.height,
                type: 'overhang',
                clusterType: 'overhang',
                extension: extension
            });
        }
        
        return platforms;
    }
    
    generateStackCluster(centerY, chunk) {
        const platforms = [];
        const numPlatforms = 2; // Fixed 2 platforms (reduced)
        const baseX = 300 + Math.random() * 200; // Center area
        const verticalSpacing = 80 + Math.random() * 40; // 80-120px spacing (increased)
        
        for (let i = 0; i < numPlatforms; i++) {
            const platformY = centerY - (numPlatforms - 1) * verticalSpacing / 2 + i * verticalSpacing;
            const horizontalOffset = (Math.random() - 0.5) * 100; // ±50px offset (increased)
            // 40% chance of large platforms in stacks for more interesting shapes
            const sizeType = Math.random() < 0.4 ? 'large' : 'medium';
            const size = this.generatePlatformSize(sizeType);
            
            platforms.push({
                x: baseX + horizontalOffset,
                y: platformY,
                width: size.width,
                height: size.height,
                type: 'stack',
                clusterType: 'stack',
                stackLevel: i
            });
        }
        
        return platforms;
    }
    
    generateScatteredCluster(centerY, chunk) {
        const platforms = [];
        const numPlatforms = Math.random() < 0.6 ? 2 : 3; // Mostly 2 platforms, rarely 3
        const spreadRadius = 150; // Even wider spread for challenge
        
        for (let i = 0; i < numPlatforms; i++) {
            const angle = (i / numPlatforms) * Math.PI * 2; // Distribute around circle
            const distance = 80 + Math.random() * spreadRadius;
            // Use varied sizes for scattered platforms to create more visual interest
            const size = this.generatePlatformSize('varied');
            
            const platformX = 400 + Math.cos(angle) * distance; // Center around chasm middle
            const platformY = centerY + Math.sin(angle) * distance * 0.3; // Flatten vertically even more
            
            platforms.push({
                x: platformX,
                y: platformY,
                width: size.width,
                height: size.height,
                type: 'scattered',
                clusterType: 'scattered',
                scatterIndex: i
            });
        }
        
        return platforms;
    }
    
    generatePlatformSize(sizeHint = 'varied') {
        let width, height;
        
        switch (sizeHint) {
            case 'small':
                width = 60 + Math.random() * 40; // 60-100px
                height = 15 + Math.random() * 10; // 15-25px
                break;
            case 'medium':
                width = 90 + Math.random() * 60; // 90-150px
                height = 20 + Math.random() * 15; // 20-35px
                break;
            case 'large':
                width = 140 + Math.random() * 60; // 140-200px
                height = 25 + Math.random() * 15; // 25-40px
                break;
            case 'extra_large':
                width = 200 + Math.random() * 150; // 200-350px (much larger)
                height = 40 + Math.random() * 60; // 40-100px (much taller)
                break;
            default: // 'varied'
                // 20% chance of extra large, 30% large, 30% medium, 20% small
                const sizeRoll = Math.random();
                if (sizeRoll < 0.2) {
                    width = 200 + Math.random() * 150; // 200-350px
                    height = 40 + Math.random() * 60; // 40-100px
                } else if (sizeRoll < 0.5) {
                    width = 140 + Math.random() * 60; // 140-200px
                    height = 25 + Math.random() * 15; // 25-40px
                } else if (sizeRoll < 0.8) {
                    width = 90 + Math.random() * 60; // 90-150px
                    height = 20 + Math.random() * 15; // 20-35px
                } else {
                    width = 60 + Math.random() * 40; // 60-100px
                    height = 15 + Math.random() * 10; // 15-25px
                }
        }
        
        return { width, height };
    }
    
    generateStrategicPlatform(centerY, chunk) {
        // Single well-placed platform for long swings
        const placement = Math.random();
        let platformX;
        const size = this.generatePlatformSize('medium');
        
        if (placement < 0.4) {
            // Wall-attached platform
            const isLeftSide = Math.random() < 0.5;
            const wallX = isLeftSide ? 
                this.getWallXAtY(chunk.leftWallCoords, centerY) :
                this.getWallXAtY(chunk.rightWallCoords, centerY);
            platformX = isLeftSide ? wallX + 80 : wallX - 80;
        } else {
            // Center area platform for maximum swing potential
            platformX = 300 + Math.random() * 200;
        }
        
        return {
            x: platformX,
            y: centerY,
            width: size.width,
            height: size.height,
            type: 'strategic',
            clusterType: 'strategic'
        };
    }
    
    ensureMinimumPlatformDensity(chunk) {
        // Check if we have sufficient platform coverage (very lenient for challenge)
        const platformsByY = chunk.platforms.slice().sort((a, b) => a.y - b.y);
        const maxGap = 300; // Much larger gaps allowed for challenging gameplay
        
        // Add emergency platforms only if gaps are impossibly large
        for (let i = 0; i < platformsByY.length - 1; i++) {
            const gap = platformsByY[i + 1].y - platformsByY[i].y;
            
            // Only add emergency platform if gap is truly impossible (> 300px)
            if (gap > maxGap) {
                const emergencyY = platformsByY[i].y + gap / 2;
                const emergencyX = 300 + Math.random() * 200;
                const size = this.generatePlatformSize('small'); // Small emergency platforms
                
                chunk.platforms.push({
                    x: emergencyX,
                    y: emergencyY,
                    width: size.width,
                    height: size.height,
                    type: 'emergency',
                    clusterType: 'emergency',
                    emergency: true
                });
                
                this.emergencyPlatforms++;
            }
        }
    }
    
    generateCeilings(chunk) {
        // Generate very sparse ceiling sections for overhead attachment
        const numCeilings = Math.random() < 0.6 ? 0 : 1; // 60% chance of no ceiling, 40% chance of 1 ceiling
        
        for (let i = 0; i < numCeilings; i++) {
            const y = chunk.y + chunk.height * (0.3 + Math.random() * 0.4); // Place in middle area
            
            // Vary ceiling placement for strategic value
            const placementType = Math.random();
            let centerX, width;
            
            if (placementType < 0.7) {
                // Center ceiling for overhead swinging (more common)
                centerX = 300 + Math.random() * 200;
                width = 100 + Math.random() * 120; // Smaller ceilings
            } else {
                // Side ceiling extending into chasm
                const isLeftSide = Math.random() < 0.5;
                if (isLeftSide) {
                    centerX = 150 + Math.random() * 100;
                } else {
                    centerX = 550 + Math.random() * 100;
                }
                width = 80 + Math.random() * 80; // Smaller side ceilings
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
    
    reset() {
        console.log('Resetting world generator...');
        
        // Remove all active chunks and their physics bodies
        const chunkIds = Array.from(this.activeChunks.keys());
        chunkIds.forEach(chunkId => {
            this.removeChunk(chunkId);
        });
        
        // Reset tracking variables
        this.lastCameraY = 0;
        this.chunksGenerated = 0;
        this.chunksRemoved = 0;
        this.totalPhysicsBodies = 0;
        this.emergencyPlatforms = 0;
        this.boundaryPlatforms = 0;
        
        // Reset cluster statistics
        this.clusterStats = {
            stair: 0,
            overhang: 0,
            stack: 0,
            scattered: 0,
            strategic: 0
        };
        
        console.log('World generator reset complete');
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
            clusterStats: this.clusterStats,
            lastCameraY: this.lastCameraY
        };
    }
}