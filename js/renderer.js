class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Sprite loading system
        this.sprites = {};
        this.spritesLoaded = false;
        this.loadSprites();
        
        //console.log('Renderer initialized with canvas:', canvas.width, 'x', canvas.height);
    }
    
    loadSprites() {
        const spriteList = [
            { name: 'player_idle', src: 'assets/idle.png' },
            { name: 'player_swing', src: 'assets/swing.png' }
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
                    console.log('All player sprites loaded successfully');
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
            
            // Draw pivot points
            for (const pivot of pivotPoints) {
                this.drawCircle(pivot.x, pivot.y, 6, '#FF0000'); // Red pivot points
            }
            
            // Draw attachment point indicator
            this.drawCircle(attachmentPoint.x, attachmentPoint.y, 4, '#FF6B35');
            
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
            
            // Render platforms with different colors based on cluster type
            chunk.platforms.forEach(platform => {
                let color = '#2c3e50'; // Default platform color
                
                // Emergency and boundary platforms take priority
                if (platform.emergency) {
                    color = '#e74c3c'; // Red for emergency platforms
                } else if (platform.boundary) {
                    color = '#f39c12'; // Orange for boundary platforms
                } else {
                    // Color by cluster type for visual variety
                    switch (platform.clusterType) {
                        case 'stair':
                            color = '#3498db'; // Blue for stair clusters
                            break;
                        case 'overhang':
                            color = '#9b59b6'; // Purple for overhang clusters
                            break;
                        case 'stack':
                            color = '#2ecc71'; // Green for stack clusters
                            break;
                        case 'scattered':
                            color = '#34495e'; // Dark gray for scattered clusters
                            break;
                        case 'strategic':
                            color = '#1abc9c'; // Teal for strategic platforms
                            break;
                        default:
                            color = '#2c3e50'; // Default gray
                    }
                }
                
                // Render platform with size-appropriate visual style
                this.renderEnhancedPlatform(platform, color);
            });
            
            // Render ceilings
            chunk.ceilings.forEach(ceiling => {
                this.drawRect(
                    ceiling.x - ceiling.width/2,
                    ceiling.y - ceiling.height/2,
                    ceiling.width,
                    ceiling.height,
                    '#2c3e50'
                );
            });
            
            // Debug: Render physics bodies with semi-transparent overlay
            chunk.physicsBodies.forEach(body => {
                const pos = body.position;
                const bounds = body.bounds;
                const width = bounds.max.x - bounds.min.x;
                const height = bounds.max.y - bounds.min.y;
                
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Semi-transparent red
                this.ctx.fillRect(
                    pos.x - width/2,
                    pos.y - height/2,
                    width,
                    height
                );
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
    
    renderEnhancedPlatform(platform, color) {
        const x = platform.x - platform.width / 2;
        const y = platform.y - platform.height / 2;
        const width = platform.width;
        const height = platform.height;
        
        // Base platform rectangle
        this.drawRect(x, y, width, height, color);
        
        // Add visual enhancements based on platform properties
        this.ctx.strokeStyle = this.adjustColor(color, -20); // Darker border
        this.ctx.lineWidth = Math.max(1, height / 10); // Thicker border for thicker platforms
        this.ctx.strokeRect(x, y, width, height);
        
        // Add highlight for thicker platforms
        if (height > 25) {
            this.ctx.fillStyle = this.adjustColor(color, 30); // Lighter highlight
            this.ctx.fillRect(x + 2, y + 2, width - 4, Math.max(4, height / 4));
        }
        
        // Add cluster type indicators for debugging (small text)
        if (platform.clusterType && platform.clusterType !== 'emergency') {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '8px monospace';
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