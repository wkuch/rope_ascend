class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        console.log('Renderer initialized with canvas:', canvas.width, 'x', canvas.height);
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
    
    render(camera, player, physics, rope) {
        this.clear();
        
        // Render game world with camera transform
        this.ctx.save();
        const transform = camera.getTransform();
        this.ctx.translate(transform.x, transform.y);
        
        this.renderBoundaries(physics.getBoundaries());
        this.renderPlayer(player);
        this.renderRope(player, rope);
        this.renderVelocityArrow(player);
        
        this.ctx.restore();
        
        // Render debug UI in screen space (no camera transform)
        this.renderDebugUI(camera, player, rope);
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
    
    renderDebugUI(camera, player, rope) {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '14px monospace';
        
        const pos = player.getPosition();
        const vel = player.getVelocity();
        const camPos = camera.getPosition();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        
        const debugInfo = [
            `Player State: ${player.getState()}`,
            `Player Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})`,
            `Player Vel: (${Math.round(vel.x * 10)/10}, ${Math.round(vel.y * 10)/10})`,
            `Player Speed: ${Math.round(speed * 10)/10}`,
            `Camera Pos: (${Math.round(camPos.x)}, ${Math.round(camPos.y)})`,
            `Rope State: ${rope.getState()}`,
            `Rope Length: ${rope.isAttached() ? Math.round(rope.getRopeLength()) : 'N/A'}`,
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
    
    renderPlayer(player) {
        const pos = player.getPosition();
        this.drawCircle(pos.x, pos.y, player.getRadius(), '#e74c3c');
    }
}