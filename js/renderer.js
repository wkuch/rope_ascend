class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Disable anti-aliasing to prevent gaps between tiles
        this.ctx.imageSmoothingEnabled = false;
        
        // Sprite loading system
        this.sprites = {};
        this.spritesLoaded = false;
        this.loadSprites();
        
        // Procedural texture cache
        this.textureCache = new Map();
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        //console.log('Renderer initialized with canvas:', canvas.width, 'x', canvas.height);
    }
    
    loadSprites() {
        const spriteList = [
            { name: 'player_idle', src: 'assets/idle.png' },
            { name: 'player_swing', src: 'assets/swing.png' },
            { name: 'kunai', src: 'assets/kunai.png' },
            { name: 'obstacle_corner', src: 'assets/corner.png' },
            { name: 'obstacle_inside', src: 'assets/inside.png' },
            { name: 'obstacle_side', src: 'assets/side.png' }
        ];
        
        let loadedCount = 0;
        const totalSprites = spriteList.length;
        
        spriteList.forEach(sprite => {
            const img = new Image();
            img.onload = () => {
                this.sprites[sprite.name] = img;
                loadedCount++;
                
                if (loadedCount === totalSprites) {
                    this.spritesLoaded = true;
                    console.log('All sprites loaded successfully');
                }
            };
            img.onerror = () => {
                console.error('Failed to load sprite:', sprite.src);
            };
            img.src = sprite.src;
        });
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawRect(x, y, width, height, color = '#3498db') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    drawCircle(x, y, radius, color = '#e74c3c') {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawLine(x1, y1, x2, y2, color = '#2c3e50', width = 2) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    drawKunaiAttachment(attachmentPoint, playerPos, pivotPoints = []) {
        // Fall back to circle if sprites aren't loaded yet
        if (!this.spritesLoaded || !this.sprites.kunai) {
            this.drawCircle(attachmentPoint.x, attachmentPoint.y, 4, '#FF6B35');
            return;
        }
        
        // Only rotate kunai if there are no pivot points (rope is straight)
        let angle = 0;
        if (pivotPoints.length === 0) {
            // Calculate angle from player to attachment point for straight rope
            const dx = attachmentPoint.x - playerPos.x;
            const dy = attachmentPoint.y - playerPos.y;
            angle = Math.atan2(dy, dx);
        } else {
            // When rope is wrapped, use a fixed angle or the angle from last pivot
            const lastPivot = pivotPoints[pivotPoints.length - 1];
            const dx = attachmentPoint.x - lastPivot.x;
            const dy = attachmentPoint.y - lastPivot.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Position kunai outside the object it's attached to
        const offset = 11; // Distance to pull kunai out from the wall
        const kunaiX = attachmentPoint.x - Math.cos(angle) * offset;
        const kunaiY = attachmentPoint.y - Math.sin(angle) * offset;
        
        // Draw kunai sprite rotated to point away from player
        this.ctx.save();
        this.ctx.translate(kunaiX, kunaiY);
        this.ctx.rotate(angle + Math.PI * 132 / 180); // Add 200 degrees clockwise
        
        // Draw kunai at reduced size to match game scale
        const kunaiSize = 24; // Smaller than the 48x48 planned size
        // Since tip is at top-left corner, offset so tip points toward attachment
        this.ctx.drawImage(
            this.sprites.kunai,
            -12, // Move kunai left to better align with attachment point
            -kunaiSize / 2, // Center vertically
            kunaiSize,
            kunaiSize
        );
        
        this.ctx.restore();
    }
    
    render(camera, player, physics, rope, world, hazard, gameState, scoring) {
        this.clear();
        
        
        switch (gameState) {
            case 'menu':
                this.renderMenuScreen(scoring);
                break;
            case 'gameOver':
                this.renderGameOverScreen(player, hazard, scoring);
                break;
            case 'playing':
            default:
                // Render game world with camera transform
                this.ctx.save();
                const transform = camera.getTransform();
                this.ctx.translate(transform.x, transform.y);
                
                this.renderBoundaries(physics.getBoundaries());
                this.renderWorld(world);
                this.renderHazard(hazard);
                this.renderPlayer(player);
                this.renderRope(player, rope);
                this.renderVelocityArrow(player);
                
                this.ctx.restore();
                
                // Render UI in screen space (no camera transform)
                this.renderGameUI(scoring);
                this.renderDebugUI(camera, player, rope, world, hazard);
                break;
        }
    }
    
    renderVelocityArrow(player) {
        const pos = player.getPosition();
        const vel = player.getVelocity();
        const scale = 10;
        
        if (Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
            const endX = pos.x + vel.x * scale;
            const endY = pos.y + vel.y * scale;
            
            this.drawLine(pos.x, pos.y, endX, endY, '#f39c12', 3);
            
            const arrowSize = 5;
            const angle = Math.atan2(vel.y, vel.x);
            const arrowX1 = endX - arrowSize * Math.cos(angle - Math.PI/6);
            const arrowY1 = endY - arrowSize * Math.sin(angle - Math.PI/6);
            const arrowX2 = endX - arrowSize * Math.cos(angle + Math.PI/6);
            const arrowY2 = endY - arrowSize * Math.sin(angle + Math.PI/6);
            
            this.drawLine(endX, endY, arrowX1, arrowY1, '#f39c12', 3);
            this.drawLine(endX, endY, arrowX2, arrowY2, '#f39c12', 3);
        }
    }
    
    renderRope(player, rope) {
        if (rope.isAttached()) {
            const playerPos = player.getPosition();
            const attachmentPoint = rope.getAttachmentPoint();
            const ropeLength = rope.getRopeLength();
            const pivotPoints = rope.getPivotPoints();
            const ropeSegments = rope.getRopeSegments(playerPos);
            
            // Draw rope thickness based on total length
            const ropeThickness = Math.max(2, Math.min(5, ropeLength / 50));
            
            // Draw multi-segment rope
            if (ropeSegments.length > 0) {
                for (const segment of ropeSegments) {
                    this.drawLine(
                        segment.start.x, 
                        segment.start.y, 
                        segment.end.x, 
                        segment.end.y, 
                        '#8B4513', // Brown color for rope
                        ropeThickness
                    );
                }
            } else {
                // Fallback: single segment rope
                this.drawLine(
                    playerPos.x, 
                    playerPos.y, 
                    attachmentPoint.x, 
                    attachmentPoint.y, 
                    '#8B4513', // Brown color for rope
                    ropeThickness
                );
            }
            
            // Pivot points are visually represented by the rope line wrapping around corners
            // No need for additional visual indicators
            
            // Draw attachment point as kunai
            this.drawKunaiAttachment(attachmentPoint, playerPos, pivotPoints);
            
            // Draw rope length indicator near attachment point
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(
                `${Math.round(ropeLength)}px`, 
                attachmentPoint.x + 8, 
                attachmentPoint.y - 8
            );
            
            // Debug: Show number of segments and pivots
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(
                `Segments: ${ropeSegments.length} | Pivots: ${pivotPoints.length}`, 
                10, 
                150
            );
        }
    }
    
    renderHazard(hazard) {
        if (!hazard) return;
        
        const visualData = hazard.getVisualData();
        
        // Draw main hazard body with wave effect
        this.ctx.fillStyle = visualData.color;
        this.ctx.fillRect(
            visualData.x,
            visualData.y,
            visualData.width,
            visualData.height
        );
        
        // Draw animated wave effect on top
        this.ctx.strokeStyle = '#ff6666';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        const waveY = visualData.y;
        const numWaves = 20;
        const waveStep = visualData.width / numWaves;
        
        for (let i = 0; i <= numWaves; i++) {
            const x = visualData.x + i * waveStep;
            const waveHeight = Math.sin(i * visualData.waveFrequency + visualData.waveOffset) * visualData.waveAmplitude;
            const y = waveY + waveHeight;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Add danger text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'DANGER',
            visualData.width / 2,
            visualData.y + visualData.height / 2 + 8
        );
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    renderGameUI(scoring) {
        if (!scoring) return;
        
        const scoreData = scoring.getScoreData();
        
        // Current score display (top right)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Height: ${scoreData.current}`, this.canvas.width - 20, 30);
        
        // High score display (top right, below current)
        this.ctx.fillStyle = '#ffdd44';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Best: ${scoreData.high}`, this.canvas.width - 20, 55);
        
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    renderMenuScreen(scoring) {
        // Dark background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 56px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ROPE ASCEND', this.canvas.width / 2, this.canvas.height / 2 - 120);
        
        // Game description
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '20px monospace';
        this.ctx.fillText('Escape the rising hazard using only your grappling rope!', this.canvas.width / 2, this.canvas.height / 2 - 70);
        
        // Controls
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('LMB: Fire Rope    A/D: Swing    W/S: Rope Length', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // High score display
        if (scoring) {
            const highScore = scoring.getHighScore();
            if (highScore > 0) {
                this.ctx.fillStyle = '#ffdd44';
                this.ctx.font = 'bold 24px monospace';
                this.ctx.fillText(`Best Height: ${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            }
        }
        
        // Start instructions
        this.ctx.fillStyle = '#44ff44';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.fillText('Press SPACE or ENTER to start', this.canvas.width / 2, this.canvas.height / 2 + 80);
        
        // Credits
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('Physics: Matter.js', this.canvas.width / 2, this.canvas.height - 40);
        this.ctx.fillText('Inspired by Worms Armageddon Ninja Rope', this.canvas.width / 2, this.canvas.height - 20);
        
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    renderGameOverScreen(player, hazard, scoring) {
        // Semi-transparent dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const scoreData = scoring ? scoring.getScoreData() : { current: 0, high: 0, isNewHigh: false };
        
        // Game Over title
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        // Death message
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px monospace';
        this.ctx.fillText('Consumed by the rising hazard!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Final score
        this.ctx.fillStyle = scoreData.isNewHigh ? '#44ff44' : '#ffffff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(`Final Height: ${scoreData.current}`, this.canvas.width / 2, this.canvas.height / 2 - 5);
        
        // New high score message
        if (scoreData.isNewHigh) {
            this.ctx.fillStyle = '#44ff44';
            this.ctx.font = 'bold 24px monospace';
            this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 25);
        }
        
        // Previous high score
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '18px monospace';
        this.ctx.fillText(`Previous Best: ${scoreData.high}`, this.canvas.width / 2, this.canvas.height / 2 + 55);
        
        // Action instructions
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#ffdd44';
        this.ctx.fillText('Press R or SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + 90);
        
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Press M or ESC for main menu', this.canvas.width / 2, this.canvas.height / 2 + 115);
        
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    renderDebugUI(camera, player, rope, world, hazard) {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '14px monospace';
        
        const pos = player.getPosition();
        const vel = player.getVelocity();
        const camPos = camera.getPosition();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        const stats = world ? world.getStreamingStats() : {};
        const hazardY = hazard ? Math.round(hazard.getCurrentY()) : 'N/A';
        const hazardDistance = hazard ? Math.round(pos.y - hazard.getCurrentY()) : 'N/A';
        
        const clusterInfo = stats.clusterStats ? 
            `S:${stats.clusterStats.stair} O:${stats.clusterStats.overhang} T:${stats.clusterStats.stack} C:${stats.clusterStats.scattered} R:${stats.clusterStats.strategic}` :
            'N/A';
        
        const debugInfo = [
            `Player State: ${player.getState()}`,
            `Player Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})`,
            `Player Vel: (${Math.round(vel.x * 10)/10}, ${Math.round(vel.y * 10)/10})`,
            `Player Speed: ${Math.round(speed * 10)/10}`,
            `Camera Pos: (${Math.round(camPos.x)}, ${Math.round(camPos.y)})`,
            `Rope State: ${rope.getState()}`,
            `Rope Length: ${rope.isAttached() ? Math.round(rope.getRopeLength()) : 'N/A'}`,
            `Hazard Y: ${hazardY} | Distance: ${hazardDistance}`,
            `Active Chunks: ${stats.activeChunks || 0} | Bodies: ${stats.totalPhysicsBodies || 0}`,
            `Generated: ${stats.totalGenerated || 0} | Removed: ${stats.totalRemoved || 0}`,
            `Emergency: ${stats.emergencyPlatforms || 0} | Boundary: ${stats.boundaryPlatforms || 0}`,
            `Clusters: ${clusterInfo}`,
            `Controls: LMB=Fire Rope, A/D=Swing, W=Shorten, S=Lengthen`
        ];
        
        debugInfo.forEach((text, index) => {
            this.ctx.fillText(text, 10, 20 + index * 18);
        });
    }
    
    renderBoundaries(boundaries) {
        boundaries.forEach(boundary => {
            const pos = boundary.position;
            const bounds = boundary.bounds;
            const width = bounds.max.x - bounds.min.x;
            const height = bounds.max.y - bounds.min.y;
            
            this.drawRect(
                pos.x - width/2, 
                pos.y - height/2, 
                width, 
                height, 
                '#34495e'
            );
        });
    }
    
    renderWorld(world) {
        if (!world) return;
        
        const chunks = world.getActiveChunks();
        
        chunks.forEach(chunk => {
            // Render wall coordinates as connected lines (visual guide)
            this.renderWallCoordinates(chunk.leftWallCoords, '#34495e');
            this.renderWallCoordinates(chunk.rightWallCoords, '#34495e');
            
            // Render platforms with textures
            chunk.platforms.forEach(platform => {
                // Render platform with stone texture
                this.renderEnhancedPlatform(platform);
            });
            
            // Render ceilings
            chunk.ceilings.forEach(ceiling => {
                // Use center positioning to match physics bodies
                const centerX = ceiling.x;
                const centerY = ceiling.y;
                
                // Use procedural texture for ceilings
                this.drawProceduralTexture('ceiling', centerX, centerY, ceiling.width, ceiling.height, ceiling);
                
                // Add subtle border
                const x = centerX - ceiling.width/2;
                const y = centerY - ceiling.height/2;
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, ceiling.width, ceiling.height);
            });
            
            // Debug visualization - only show platform and ceiling bodies
            chunk.physicsBodies.forEach(body => {
                const pos = body.position;
                const bounds = body.bounds;
                const width = bounds.max.x - bounds.min.x;
                const height = bounds.max.y - bounds.min.y;
                
                // Filter to only show platform and ceiling bodies
                if (body.label && (body.label.includes('platform_') || body.label.includes('ceiling_'))) {
                    // Use different colors for different types
                    if (body.label.includes('platform_')) {
                        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Red for platforms
                    } else if (body.label.includes('ceiling_')) {
                        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Green for ceilings
                    }
                    
                    this.ctx.fillRect(
                        pos.x - width/2,
                        pos.y - height/2,
                        width,
                        height
                    );
                    
                    // Add label text for debugging
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '10px monospace';
                    this.ctx.fillText(
                        `${Math.round(width)}x${Math.round(height)}`,
                        pos.x - width/2 + 2,
                        pos.y - height/2 + 12
                    );
                }
            });
        });
    }
    
    renderWallCoordinates(coords, color) {
        if (coords.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        this.ctx.moveTo(coords[0].x, coords[0].y);
        for (let i = 1; i < coords.length; i++) {
            this.ctx.lineTo(coords[i].x, coords[i].y);
        }
        
        this.ctx.stroke();
    }
    
    renderEnhancedPlatform(platform) {
        // Use center positioning to match physics bodies
        const centerX = platform.x;
        const centerY = platform.y;
        const width = platform.width;
        const height = platform.height;
        
        // Debug: Check if platform dimensions are consistent
        const platformId = `${Math.round(centerX)}_${Math.round(centerY)}`;
        if (platformId === '425_-1150' || platformId === '453_800') {
            console.log('renderEnhancedPlatform:', {
                platformId,
                centerX, centerY, width, height,
                originalPlatform: { x: platform.x, y: platform.y, width: platform.width, height: platform.height }
            });
        }
        
        // Platform rendering is now handled by procedural generation
        
        // Use procedural texture generation with center positioning
        this.drawProceduralTexture('platform', centerX, centerY, width, height, platform);
        
        // Add very subtle border to define platform edges (optional)
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; // Very light semi-transparent black border
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Add cluster type indicators for debugging (small text)
        if (platform.clusterType && platform.clusterType !== 'emergency') {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '8px monospace';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeText(
                platform.clusterType.charAt(0).toUpperCase(), 
                x + 4, 
                y + height - 4
            );
            this.ctx.fillText(
                platform.clusterType.charAt(0).toUpperCase(), 
                x + 4, 
                y + height - 4
            );
        }
    }
    
    adjustColor(color, amount) {
        // Simple color adjustment function
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    
    drawProceduralTexture(obstacleType, centerX, centerY, width, height, platform = null) {
        // Use single stone texture for all obstacles
        const textureType = platform?.emergency ? 'emergency' : platform?.boundary ? 'boundary' : 'stone';
        
        // Simplified cache key without biome
        const cacheKey = `${obstacleType}_${width}_${height}_${textureType}`;
        
        // Debug logging - log specific platforms consistently
        const platformId = `${Math.round(platform?.x || 0)}_${Math.round(platform?.y || 0)}`;
        if (platform && (platformId === '425_-1150' || platformId === '453_800' || Math.random() < 0.01)) {
            console.log('Platform rendering:', {
                platformId,
                centerX: Math.round(centerX),
                centerY: Math.round(centerY), 
                width: Math.round(width),
                height: Math.round(height),
                platformX: Math.round(platform.x),
                platformY: Math.round(platform.y),
                platformWidth: Math.round(platform.width),
                platformHeight: Math.round(platform.height),
                calculatedTopLeftX: Math.round(centerX - width / 2),
                calculatedTopLeftY: Math.round(centerY - height / 2),
                textureType,
                cacheKey,
                cacheHit: this.textureCache.has(cacheKey)
            });
        }
        
        // Check if texture is already cached
        let texture = this.textureCache.get(cacheKey);
        if (!texture) {
            // Generate new texture
            texture = this.generateObstacleTexture(obstacleType, width, height, platform, 'stone');
            this.textureCache.set(cacheKey, texture);
        }
        
        // Draw the cached texture at top-left position (convert from center positioning)
        // Ensure the texture is drawn at the exact size specified
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        this.ctx.drawImage(texture, x, y, width, height);
        
        // Debug: Add a colored border to each rendered platform to see overlaps
        if (platform && (platformId === '425_-1150' || platformId === '453_800')) {
            this.ctx.strokeStyle = platformId === '425_-1150' ? 'yellow' : 'cyan';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
        }
    }
    
    getBiomeForHeight(worldY) {
        // Determine biome based on world height
        // Lower Y values = higher altitude (since Y increases downward)
        
        if (worldY < -2000) {
            return 'crystal'; // Very high altitude - crystal/ice
        } else if (worldY < -1000) {
            return 'stone'; // High altitude - stone
        } else if (worldY < 0) {
            return 'metal'; // Mid altitude - metal/industrial
        } else if (worldY < 1000) {
            return 'wood'; // Low altitude - wood/organic
        } else {
            return 'rock'; // Ground level - rock/earth
        }
    }
    
    generateObstacleTexture(obstacleType, width, height, platform = null, biome = 'stone') {
        // Set up off-screen canvas for texture generation
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
        const ctx = this.offscreenCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Determine texture style based on obstacle type, platform properties, and biome
        const textureStyle = this.getTextureStyle(obstacleType, platform, biome);
        
        // Generate base texture
        this.drawBaseTexture(ctx, width, height, textureStyle);
        
        // Add surface details
        this.drawSurfaceDetails(ctx, width, height, textureStyle);
        
        // Add borders and edges
        this.drawBordersAndEdges(ctx, width, height, textureStyle);
        
        // Add size-appropriate details
        this.drawSizeAppropriateDetails(ctx, width, height, textureStyle);
        
        return this.offscreenCanvas;
    }
    
    getTextureStyle(obstacleType, platform, biome) {
        // Emergency and boundary platforms override biome styling
        if (platform?.emergency) {
            return {
                type: 'emergency',
                baseColor: '#ff6b35',
                accentColor: '#ffff00',
                pattern: 'warning'
            };
        }
        
        if (platform?.boundary) {
            return {
                type: 'boundary', 
                baseColor: '#e74c3c',
                accentColor: '#c0392b',
                pattern: 'solid'
            };
        }
        
        // Use biome to determine material and colors
        switch (biome) {
            case 'crystal':
                return {
                    type: 'crystal',
                    baseColor: '#3498db',
                    accentColor: '#2980b9',
                    pattern: 'crystal'
                };
                
            case 'stone':
                return {
                    type: 'stone',
                    baseColor: '#7f8c8d',
                    accentColor: '#95a5a6',
                    pattern: 'stone'
                };
                
            case 'metal':
                return {
                    type: 'metal',
                    baseColor: '#34495e',
                    accentColor: '#2c3e50',
                    pattern: 'metal'
                };
                
            case 'wood':
                return {
                    type: 'wood',
                    baseColor: '#8b4513',
                    accentColor: '#a0522d',
                    pattern: 'wood'
                };
                
            case 'rock':
                return {
                    type: 'rock',
                    baseColor: '#696969',
                    accentColor: '#808080',
                    pattern: 'rock'
                };
                
            default:
                return {
                    type: 'stone',
                    baseColor: '#7f8c8d',
                    accentColor: '#95a5a6',
                    pattern: 'stone'
                };
        }
    }
    
    drawBaseTexture(ctx, width, height, style) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, this.lightenColor(style.baseColor, 20));
        gradient.addColorStop(0.5, style.baseColor);
        gradient.addColorStop(1, this.darkenColor(style.baseColor, 20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add texture pattern based on style
        this.drawTexturePattern(ctx, width, height, style);
    }
    
    drawTexturePattern(ctx, width, height, style) {
        ctx.save();
        
        switch (style.pattern) {
            case 'stone':
                this.drawStonePattern(ctx, width, height, style);
                break;
            case 'metal':
                this.drawMetalPattern(ctx, width, height, style);
                break;
            case 'wood':
                this.drawWoodPattern(ctx, width, height, style);
                break;
            case 'rock':
                this.drawRockPattern(ctx, width, height, style);
                break;
            case 'crystal':
                this.drawCrystalPattern(ctx, width, height, style);
                break;
            case 'warning':
                this.drawWarningPattern(ctx, width, height, style);
                break;
        }
        
        ctx.restore();
    }
    
    drawStonePattern(ctx, width, height, style) {
        // Draw stone-like cracks and texture
        ctx.strokeStyle = this.darkenColor(style.baseColor, 30);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        // Draw random cracks
        for (let i = 0; i < Math.floor(width / 30); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const length = 10 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        // Add speckled texture
        ctx.fillStyle = this.darkenColor(style.baseColor, 40);
        for (let i = 0; i < Math.floor(width * height / 200); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawMetalPattern(ctx, width, height, style) {
        // Draw metallic horizontal lines
        ctx.strokeStyle = this.lightenColor(style.baseColor, 30);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        
        for (let y = 0; y < height; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Add rivets for larger platforms
        if (width > 100) {
            ctx.fillStyle = this.darkenColor(style.baseColor, 40);
            const rivetSize = 3;
            const rivetSpacing = 40;
            
            for (let x = rivetSpacing; x < width - rivetSpacing; x += rivetSpacing) {
                for (let y = rivetSpacing; y < height - rivetSpacing; y += rivetSpacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, rivetSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Highlight
                    ctx.fillStyle = this.lightenColor(style.baseColor, 50);
                    ctx.beginPath();
                    ctx.arc(x - 1, y - 1, rivetSize * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = this.darkenColor(style.baseColor, 40);
                }
            }
        }
    }
    
    drawWoodPattern(ctx, width, height, style) {
        // Draw wood grain
        ctx.strokeStyle = this.darkenColor(style.baseColor, 20);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        
        // Horizontal grain lines
        for (let y = 0; y < height; y += 2 + Math.random() * 3) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            
            // Create wavy grain line
            for (let x = 0; x < width; x += 5) {
                const waveY = y + Math.sin(x * 0.1) * 2;
                ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
        
        // Add wood knots for larger platforms
        if (width > 80) {
            ctx.fillStyle = this.darkenColor(style.baseColor, 40);
            const knotCount = Math.floor(width / 60);
            
            for (let i = 0; i < knotCount; i++) {
                const x = (i + 0.5) * (width / knotCount);
                const y = height / 2 + (Math.random() - 0.5) * (height * 0.4);
                const size = 3 + Math.random() * 4;
                
                ctx.beginPath();
                ctx.ellipse(x, y, size, size * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawRockPattern(ctx, width, height, style) {
        // Draw rough rock texture
        ctx.fillStyle = this.darkenColor(style.baseColor, 30);
        ctx.globalAlpha = 0.5;
        
        // Create irregular shapes
        for (let i = 0; i < Math.floor(width * height / 300); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 2 + Math.random() * 4;
            
            ctx.beginPath();
            // Create irregular shape
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                const radius = size * (0.8 + Math.random() * 0.4);
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                
                if (j === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawCrystalPattern(ctx, width, height, style) {
        // Draw crystal-like facets
        ctx.strokeStyle = this.lightenColor(style.baseColor, 40);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        
        // Draw facet lines
        const facetCount = Math.floor(width / 20);
        for (let i = 0; i < facetCount; i++) {
            const x = (i + 0.5) * (width / facetCount);
            const topY = Math.random() * height * 0.3;
            const bottomY = height - Math.random() * height * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.stroke();
            
            // Add diagonal facets
            if (i > 0) {
                const prevX = (i - 0.5) * (width / facetCount);
                ctx.beginPath();
                ctx.moveTo(prevX, height * 0.2);
                ctx.lineTo(x, height * 0.8);
                ctx.stroke();
            }
        }
        
        // Add sparkle effect
        ctx.fillStyle = this.lightenColor(style.baseColor, 60);
        for (let i = 0; i < Math.floor(width * height / 400); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawWarningPattern(ctx, width, height, style) {
        // Draw warning stripes
        ctx.fillStyle = style.accentColor;
        const stripeWidth = 8;
        const stripeSpacing = 16;
        
        for (let x = 0; x < width + height; x += stripeSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - height, height);
            ctx.lineTo(x - height + stripeWidth, height);
            ctx.lineTo(x + stripeWidth, 0);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawSurfaceDetails(ctx, width, height, style) {
        // Add subtle surface noise
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = this.darkenColor(style.baseColor, 50);
        
        for (let i = 0; i < Math.floor(width * height / 100); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawBordersAndEdges(ctx, width, height, style) {
        // Draw border
        ctx.strokeStyle = this.darkenColor(style.baseColor, 40);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Add top highlight
        ctx.strokeStyle = this.lightenColor(style.baseColor, 40);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();
        
        // Add left highlight
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
    }
    
    drawSizeAppropriateDetails(ctx, width, height, style) {
        // Add more details to larger platforms
        if (width > 150) {
            // Add additional decorative elements for large platforms
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.lightenColor(style.baseColor, 30);
            
            // Add corner decorations
            const cornerSize = 8;
            const positions = [
                { x: cornerSize, y: cornerSize },
                { x: width - cornerSize, y: cornerSize },
                { x: cornerSize, y: height - cornerSize },
                { x: width - cornerSize, y: height - cornerSize }
            ];
            
            positions.forEach(pos => {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, cornerSize / 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
    
    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    darkenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    renderPlayer(player) {
        const pos = player.getPosition();
        
        // Fall back to circle if sprites aren't loaded yet
        if (!this.spritesLoaded) {
            this.drawCircle(pos.x, pos.y, player.getRadius(), '#e74c3c');
            return;
        }
        
        // Determine which sprite to use based on player state and velocity
        const playerState = player.getState();
        const velocity = player.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        let spriteName = 'player_idle'; // Default
        
        // Use idle sprite when player is nearly stationary (resting on platform)
        if (speed < 0.5) {
            spriteName = 'player_idle';
        } else {
            // Use swing sprite when moving (falling, swinging, or moving fast)
            switch (playerState) {
                case 'falling':
                    spriteName = 'player_swing';
                    break;
                case 'rope_attached':
                    spriteName = 'player_swing';
                    break;
                case 'dead':
                    spriteName = 'player_swing';
                    break;
                default:
                    spriteName = 'player_swing'; // Default to swing when moving
            }
        }
        
        const sprite = this.sprites[spriteName];
        if (sprite) {
            // Draw sprite centered on player position, scaled down to match game scale
            const spriteSize = 32; // Display at 32x32 (half the original size)
            
            // Only apply directional flip when using swing sprite (when moving)
            const shouldFlip = spriteName === 'player_swing' && velocity.x > 0; // Flip when moving right
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            
            if (shouldFlip) {
                this.ctx.scale(-1, 1); // Flip horizontally
            }
            
            this.ctx.drawImage(
                sprite,
                -spriteSize / 2,
                -spriteSize / 2,
                spriteSize,
                spriteSize
            );
            
            this.ctx.restore();
        } else {
            // Fallback to circle if sprite not found
            this.drawCircle(pos.x, pos.y, player.getRadius(), '#e74c3c');
        }
    }
}