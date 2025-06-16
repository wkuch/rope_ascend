class Rope {
    constructor(physicsManager) {
        this.physicsManager = physicsManager;
        
        this.states = {
            DETACHED: 'detached',
            ATTACHED: 'attached'
        };
        
        this.currentState = this.states.DETACHED;
        this.maxRange = 200;
        
        // Attachment data
        this.attachmentPoint = null;
        this.constraint = null;
        this.attachedBody = null;
        
        console.log('Rope system initialized with max range:', this.maxRange);
    }
    
    update(player, input, camera) {
        switch (this.currentState) {
            case this.states.DETACHED:
                this.handleDetachedState(player, input, camera);
                break;
            case this.states.ATTACHED:
                this.handleAttachedState(player, input);
                break;
        }
    }
    
    handleDetachedState(player, input, camera) {
        if (input.isMouseDown()) {
            this.attemptAttachment(player, input, camera);
        }
    }
    
    handleAttachedState(player, input) {
        if (!input.isMouseDown()) {
            this.releaseRope();
        }
    }
    
    attemptAttachment(player, input, camera) {
        const playerPos = player.getPosition();
        const mousePos = input.getMousePosition();
        
        console.log('=== ROPE FIRING DEBUG ===');
        console.log('Player position:', playerPos);
        console.log('Mouse screen position:', mousePos);
        
        // Convert mouse screen coordinates to world coordinates
        const worldMousePos = camera.screenToWorld(mousePos.x, mousePos.y);
        console.log('Mouse world position:', worldMousePos);
        
        // Calculate direction vector from player to mouse
        const direction = {
            x: worldMousePos.x - playerPos.x,
            y: worldMousePos.y - playerPos.y
        };
        
        // Calculate distance and normalize direction
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        console.log('Distance to mouse:', distance);
        
        if (distance === 0) {
            console.log('Distance is zero, canceling rope fire');
            return; // Avoid division by zero
        }
        
        const normalizedDir = {
            x: direction.x / distance,
            y: direction.y / distance
        };
        console.log('Normalized direction:', normalizedDir);
        
        // Limit raycast to max range
        const raycastDistance = Math.min(distance, this.maxRange);
        const rayEnd = {
            x: playerPos.x + normalizedDir.x * raycastDistance,
            y: playerPos.y + normalizedDir.y * raycastDistance
        };
        console.log('Raycast from:', playerPos, 'to:', rayEnd, 'distance:', raycastDistance);
        
        // Perform raycast
        const raycastResult = this.performRaycast(playerPos, rayEnd);
        
        if (raycastResult.hit) {
            console.log('Raycast hit detected, creating attachment');
            this.createAttachment(raycastResult.point, raycastResult.body, player);
        } else {
            console.log('No raycast hit detected');
        }
        console.log('=== END ROPE FIRING DEBUG ===');
    }
    
    performRaycast(startPoint, endPoint) {
        const bodies = Matter.Composite.allBodies(this.physicsManager.getWorld());
        
        // Filter to only check static bodies (walls, boundaries)
        const staticBodies = bodies.filter(body => body.isStatic);
        
        // Use Matter.js built-in collision detection for a more reliable approach
        let closestHit = null;
        let closestDistance = Infinity;
        
        for (const body of staticBodies) {
            // Check if the line intersects with the body's bounds first (optimization)
            const bounds = body.bounds;
            if (this.lineIntersectsBounds(startPoint, endPoint, bounds)) {
                // Calculate intersection point with the body's edges
                const intersectionPoint = this.calculateBodyIntersection(startPoint, endPoint, body);
                
                if (intersectionPoint) {
                    const distance = Math.sqrt(
                        Math.pow(intersectionPoint.x - startPoint.x, 2) + 
                        Math.pow(intersectionPoint.y - startPoint.y, 2)
                    );
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestHit = {
                            point: intersectionPoint,
                            body: body,
                            distance: distance
                        };
                    }
                }
            }
        }
        
        if (closestHit) {
            console.log('Rope raycast hit:', closestHit.point, 'on body:', closestHit.body.label, 'distance:', closestHit.distance);
            return {
                hit: true,
                point: closestHit.point,
                body: closestHit.body
            };
        }
        
        return { hit: false };
    }
    
    lineIntersectsBounds(start, end, bounds) {
        // Simple bounds check - does the line potentially intersect the rectangle?
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        return !(maxX < bounds.min.x || minX > bounds.max.x || maxY < bounds.min.y || minY > bounds.max.y);
    }
    
    calculateBodyIntersection(start, end, body) {
        // For rectangular bodies (our walls), calculate intersection with edges
        const bounds = body.bounds;
        const intersections = [];
        
        // Check intersection with each edge of the rectangle
        const edges = [
            { p1: { x: bounds.min.x, y: bounds.min.y }, p2: { x: bounds.max.x, y: bounds.min.y } }, // top
            { p1: { x: bounds.max.x, y: bounds.min.y }, p2: { x: bounds.max.x, y: bounds.max.y } }, // right
            { p1: { x: bounds.max.x, y: bounds.max.y }, p2: { x: bounds.min.x, y: bounds.max.y } }, // bottom
            { p1: { x: bounds.min.x, y: bounds.max.y }, p2: { x: bounds.min.x, y: bounds.min.y } }  // left
        ];
        
        for (const edge of edges) {
            const intersection = this.lineIntersection(start, end, edge.p1, edge.p2);
            if (intersection) {
                intersections.push(intersection);
            }
        }
        
        // Return the closest intersection point
        if (intersections.length > 0) {
            intersections.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - start.x, 2) + Math.pow(a.y - start.y, 2));
                const distB = Math.sqrt(Math.pow(b.x - start.x, 2) + Math.pow(b.y - start.y, 2));
                return distA - distB;
            });
            return intersections[0];
        }
        
        return null;
    }
    
    lineIntersection(p1, p2, p3, p4) {
        // Calculate intersection of two line segments
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 1e-10) return null; // Lines are parallel
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        
        return null;
    }
    
    createAttachment(attachmentPoint, attachedBody, player) {
        const playerPos = player.getPosition();
        console.log('=== ROPE ATTACHMENT DEBUG ===');
        console.log('Player position before attachment:', playerPos);
        console.log('Attachment point:', attachmentPoint);
        console.log('Attached body label:', attachedBody.label);
        
        this.attachmentPoint = { ...attachmentPoint };
        this.attachedBody = attachedBody;
        
        // Calculate rope length with validation
        const calculatedLength = this.calculateRopeLength(playerPos, this.attachmentPoint);
        console.log('Calculated rope length:', calculatedLength);
        
        // Validate attachment point is not too close (inside wall)
        if (calculatedLength < 5) {
            console.warn('Attachment point too close to player, skipping attachment');
            return;
        }
        
        // Validate attachment point is not too far
        if (calculatedLength > this.maxRange) {
            console.warn('Attachment point too far from player, skipping attachment');
            return;
        }
        
        try {
            // Create Matter.js constraint with safer parameters
            this.constraint = Matter.Constraint.create({
                bodyA: player.getBody(),
                pointA: { x: 0, y: 0 }, // Center of player body
                pointB: this.attachmentPoint,
                stiffness: 0.3, // Reduced from 0.8 for stability
                damping: 0.3,   // Increased from 0.1 for stability
                length: calculatedLength
            });
            
            console.log('Constraint created with parameters:', {
                stiffness: this.constraint.stiffness,
                damping: this.constraint.damping,
                length: this.constraint.length
            });
            
            this.physicsManager.addConstraint(this.constraint);
            this.currentState = this.states.ATTACHED;
        } catch (error) {
            console.error('Error creating rope constraint:', error);
            this.constraint = null;
            return;
        }
        
        // Check player position after constraint creation
        const playerPosAfter = player.getPosition();
        console.log('Player position after attachment:', playerPosAfter);
        console.log('Position change:', {
            dx: playerPosAfter.x - playerPos.x,
            dy: playerPosAfter.y - playerPos.y
        });
        console.log('=== END ROPE ATTACHMENT DEBUG ===');
    }
    
    releaseRope() {
        if (this.constraint) {
            this.physicsManager.removeConstraint(this.constraint);
            this.constraint = null;
        }
        
        this.attachmentPoint = null;
        this.attachedBody = null;
        this.currentState = this.states.DETACHED;
        
        console.log('Rope released');
    }
    
    calculateRopeLength(playerPos, attachmentPoint) {
        return Math.sqrt(
            Math.pow(attachmentPoint.x - playerPos.x, 2) + 
            Math.pow(attachmentPoint.y - playerPos.y, 2)
        );
    }
    
    // Getters for rendering and state checking
    isAttached() {
        return this.currentState === this.states.ATTACHED;
    }
    
    getAttachmentPoint() {
        return this.attachmentPoint;
    }
    
    getState() {
        return this.currentState;
    }
    
    getRopeLength() {
        return this.constraint ? this.constraint.length : 0;
    }
}