class Rope {
    constructor(physicsManager) {
        this.physicsManager = physicsManager;
        
        this.states = {
            DETACHED: 'detached',
            ATTACHED: 'attached'
        };
        
        this.currentState = this.states.DETACHED;
        this.maxRange = 400;
        this.minPivotDistance = 15; // Minimum distance between pivot points
        
        // Multi-segment rope data
        this.segments = []; // Array of rope segments: [{start, end, constraint, length}]
        this.pivotPoints = []; // Array of pivot points: [{x, y, body}]
        this.attachmentPoint = null;
        this.attachedBody = null;
        this.totalRopeLength = 0;
        this.playerBody = null; // Reference to player body for multi-segment constraints
        
        // Stability controls
        this.lastPivotChangeFrame = 0;
        this.minFramesBetweenChanges = 5; // Minimum frames between pivot changes
        this.frameCounter = 0;
        
        // Legacy single constraint (will be removed when segments are active)
        this.constraint = null;
        
        //console.log('Multi-segment rope system initialized with max range:', this.maxRange);
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
        } else {
            // Handle A/D key swing controls while attached
            this.handleSwingControls(player, input);
            
            // Check for environmental collisions and update pivot points
            this.updateEnvironmentalCollision(player);
        }
    }
    
    handleSwingControls(player, input) {
        if (!this.isAttached() || !this.attachmentPoint) return;
        
        const playerPos = player.getPosition();
        const swingForce = 0.0005; // Tunable swing force magnitude
        
        // Handle rope length control (W/S keys)
        this.handleRopeLengthControl(input);
        
        // Calculate angle from attachment point to player
        const deltaX = playerPos.x - this.attachmentPoint.x;
        const deltaY = playerPos.y - this.attachmentPoint.y;
        const angle = Math.atan2(deltaY, deltaX);
        
        // Calculate perpendicular force direction for angular momentum
        let forceX = 0;
        let forceY = 0;
        
        if (input.isKeyPressed('KeyA')) {
            // A key: Clockwise rotation around attachment point
            // Force perpendicular to rope in clockwise direction
            forceX = -Math.sin(angle) * swingForce;  // Perpendicular X component
            forceY = Math.cos(angle) * swingForce;   // Perpendicular Y component
            console.log('A key: Applying clockwise swing force');
        }
        
        if (input.isKeyPressed('KeyD')) {
            // D key: Counterclockwise rotation around attachment point
            // Force perpendicular to rope in counterclockwise direction
            forceX = Math.sin(angle) * swingForce;   // Perpendicular X component
            forceY = -Math.cos(angle) * swingForce;  // Perpendicular Y component
            //console.log('D key: Applying counterclockwise swing force');
        }
        
        // Apply the calculated swing force to the player
        if (forceX !== 0 || forceY !== 0) {
            Matter.Body.applyForce(player.getBody(), playerPos, { x: forceX, y: forceY });
            
            // Debug: Log swing force application
            //console.log(`Swing force applied: (${Math.round(forceX * 10000)/10000}, ${Math.round(forceY * 10000)/10000}) at angle ${Math.round(angle * 180/Math.PI)}°`);
        }
    }
    
    handleRopeLengthControl(input) {
        if (!this.isAttached()) return;
        
        const lengthChangeRate = 2; // Pixels per frame to change rope length
        const minLength = 20; // Minimum rope length
        const maxLength = this.maxRange; // Maximum rope length (same as max range)
        
        let lengthChange = 0;
        
        if (input.isKeyPressed('KeyW')) {
            // W key: Shorten rope (increases swing speed due to angular momentum conservation)
            lengthChange = -lengthChangeRate;
            //console.log('W key: Shortening rope');
        }
        
        if (input.isKeyPressed('KeyS')) {
            // S key: Lengthen rope (decreases swing speed, allows wider swings)
            lengthChange = lengthChangeRate;
            //console.log('S key: Lengthening rope');
        }
        
        if (lengthChange !== 0) {
            if (this.segments.length > 0) {
                // Multi-segment rope: distribute length change proportionally across all segments
                this.adjustMultiSegmentLength(lengthChange, minLength, maxLength);
            } else if (this.constraint) {
                // Single segment rope: adjust single constraint
                this.adjustSingleSegmentLength(lengthChange, minLength, maxLength);
            }
        }
    }
    
    adjustSingleSegmentLength(lengthChange, minLength, maxLength) {
        const currentLength = this.constraint.length;
        const newLength = Math.max(minLength, Math.min(maxLength, currentLength + lengthChange));
        
        if (newLength !== currentLength) {
            this.constraint.length = newLength;
            this.totalRopeLength = newLength;
            
            //console.log(`Single rope length changed from ${Math.round(currentLength)} to ${Math.round(newLength)}`);
            
            // Log the effect on angular momentum for debugging
            const playerBody = this.constraint.bodyA;
            const velocity = playerBody.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            //console.log(`Player speed after length change: ${Math.round(speed * 10)/10}`);
        }
    }
    
    adjustMultiSegmentLength(lengthChange, minLength, maxLength) {
        if (this.segments.length === 0) {
            //console.log('No segments available for length adjustment');
            return;
        }
        
        // Calculate current total length
        const currentTotalLength = this.segments.reduce((total, segment) => total + segment.length, 0);
        const newTotalLength = Math.max(minLength, Math.min(maxLength, currentTotalLength + lengthChange));
        
        if (newTotalLength !== currentTotalLength) {
            // Calculate scaling factor for all segments
            const scaleFactor = newTotalLength / currentTotalLength;
            
            // Apply scaling to all segment constraints
            for (let i = 0; i < this.segments.length; i++) {
                const segment = this.segments[i];
                const newSegmentLength = segment.length * scaleFactor;
                
                if (segment.constraint) {
                    segment.constraint.length = newSegmentLength;
                    segment.length = newSegmentLength;
                    
                    // Force constraint update by removing and re-adding
                    this.physicsManager.removeConstraint(segment.constraint);
                    this.physicsManager.addConstraint(segment.constraint);
                }
            }
            
            this.totalRopeLength = newTotalLength;
            
            //console.log(`Multi-segment rope length changed from ${Math.round(currentTotalLength)} to ${Math.round(newTotalLength)} across ${this.segments.length} segments`);
        }
    }
    
    attemptAttachment(player, input, camera) {
        const playerPos = player.getPosition();
        const mousePos = input.getMousePosition();
        
        //console.log('=== ROPE FIRING DEBUG ===');
        //console.log('Player position:', playerPos);
        //console.log('Mouse screen position:', mousePos);
        
        // Convert mouse screen coordinates to world coordinates
        const worldMousePos = camera.screenToWorld(mousePos.x, mousePos.y);
        //console.log('Mouse world position:', worldMousePos);
        
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
        //console.log('Raycast from:', playerPos, 'to:', rayEnd, 'distance:', raycastDistance);
        
        // Perform raycast
        const raycastResult = this.performRaycast(playerPos, rayEnd);
        
        if (raycastResult.hit) {
            //console.log('Raycast hit detected, creating attachment');
            this.createAttachment(raycastResult.point, raycastResult.body, player);
        } else {
            //console.log('No raycast hit detected');
        }
        //console.log('=== END ROPE FIRING DEBUG ===');
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
            //console.log('Rope raycast hit:', closestHit.point, 'on body:', closestHit.body.label, 'distance:', closestHit.distance);
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
    
    lineIntersection(p1, p2, p3, p4, eps = 1e-6) {
        const x1 = p1.x, y1 = p1.y,
              x2 = p2.x, y2 = p2.y,
              x3 = p3.x, y3 = p3.y,
              x4 = p4.x, y4 = p4.y;
      
        const denom = (x1 - x2) * (y3 - y4) -
                      (y1 - y2) * (x3 - x4);
      
        // parallel or collinear
        if (Math.abs(denom) < eps) {
          // are they collinear?
          const col = Math.abs(
            (x1 - x3) * (y1 - y2) -
            (y1 - y3) * (x1 - x2)
          ) < eps;
          if (!col) return null;          // parallel but distinct
      
          // 1-D overlap test
          const overlapX =
            Math.max(Math.min(x1, x2), Math.min(x3, x4)) <=
            Math.min(Math.max(x1, x2), Math.max(x3, x4));
          const overlapY =
            Math.max(Math.min(y1, y2), Math.min(y3, y4)) <=
            Math.min(Math.max(y1, y2), Math.max(y3, y4));
      
          return overlapX && overlapY ? { x: x3, y: y3 } : null;
        }
      
        // proper intersection (end-points excluded)
        const t = ((x1 - x3) * (y3 - y4) -
                   (y1 - y3) * (x3 - x4)) / denom;
        const u = (-(x1 - x2) * (y1 - y3) +
                   (y1 - y2) * (x1 - x3)) / denom;
      
        if (t > eps && t < 1 - eps && u > eps && u < 1 - eps) {
          return { x: x1 + t * (x2 - x1),
                   y: y1 + t * (y2 - y1) };
        }
        return null;
      }
    
    createAttachment(attachmentPoint, attachedBody, player) {
        const playerPos = player.getPosition();
        //console.log('=== ROPE ATTACHMENT DEBUG ===');
        //console.log('Player position before attachment:', playerPos);
        //console.log('Attachment point:', attachmentPoint);
        //console.log('Attached body label:', attachedBody.label);
        
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
            // Store player body reference for multi-segment system
            this.playerBody = player.getBody();
            this.totalRopeLength = calculatedLength;
            
            // Create Matter.js constraint with tuned parameters for realistic swing
            this.constraint = Matter.Constraint.create({
                bodyA: this.playerBody,
                pointA: { x: 0, y: 0 }, // Center of player body
                pointB: this.attachmentPoint,
                stiffness: 1.0,  // High stiffness for rope-like behavior
                damping: 0.05,   // Low damping for natural pendulum motion
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
            //console.error('Error creating rope constraint:', error);
            this.constraint = null;
            return;
        }
        
        // Check player position after constraint creation
        const playerPosAfter = player.getPosition();
        //console.log('Player position after attachment:', playerPosAfter);
        //console.log('Position change:');
        // Removed incomplete object literal
        //console.log('=== END ROPE ATTACHMENT DEBUG ===');
    }
    
    releaseRope() {
        if (this.constraint) {
            // Log player velocity before release for momentum conservation verification
            const playerBody = this.constraint.bodyA;
            const velocityBeforeRelease = { ...playerBody.velocity };
            
            //console.log('=== ROPE RELEASE DEBUG ===');
            //console.log('Player velocity before release:', velocityBeforeRelease);
            
            // Remove constraint (momentum should be naturally conserved by Matter.js)
            this.physicsManager.removeConstraint(this.constraint);
            this.constraint = null;
            
            // Log velocity after release to verify momentum conservation
            const velocityAfterRelease = { ...playerBody.velocity };
            //console.log('Player velocity after release:', velocityAfterRelease);
            
            const velocityChange = {
                dx: velocityAfterRelease.x - velocityBeforeRelease.x,
                dy: velocityAfterRelease.y - velocityBeforeRelease.y
            };
            //console.log('Velocity change:', velocityChange);
            //console.log('=== END ROPE RELEASE DEBUG ===');
        }
        
        // Clear multi-segment data
        this.clearAllConstraints();
        this.pivotPoints = [];
        this.segments = [];
        this.attachmentPoint = null;
        this.attachedBody = null;
        this.playerBody = null;
        this.totalRopeLength = 0;
        this.currentState = this.states.DETACHED;
        
        //console.log('Rope released - momentum conserved');
    }
    
    calculateRopeLength(playerPos, attachmentPoint) {
        return Math.sqrt(
            Math.pow(attachmentPoint.x - playerPos.x, 2) + 
            Math.pow(attachmentPoint.y - playerPos.y, 2)
        );
    }
    
    updateEnvironmentalCollision(player) {
        if (!this.isAttached() || !this.attachmentPoint) return;
        
        this.frameCounter++;
        
        // Only make pivot changes if enough frames have passed since last change
        if (this.frameCounter - this.lastPivotChangeFrame < this.minFramesBetweenChanges) {
            return;
        }
        
        const playerPos = player.getPosition();
        
        // First, check if existing pivots are still needed (unwrapping)
        this.checkPivotRemoval(playerPos);
        
        // Then, check for new intersections (wrapping)
        const staticBodies = this.getStaticBodies();
        const ropeSegments = this.getCurrentRopeSegments(playerPos);
        
        for (let segmentIndex = 0; segmentIndex < ropeSegments.length; segmentIndex++) {
            const segment = ropeSegments[segmentIndex];
            this.checkSegmentCollision(segment, staticBodies, segmentIndex);
        }
    }
    
    checkPivotRemoval(playerPos) {
        if (this.pivotPoints.length === 0) return;
        
        /*
        //No direct path detection as it breaks wrapping around an object fully
        // Check if we can create a direct line from player to attachment without any pivots
        const directPath = !this.lineIntersectsAnyObstacle(playerPos, this.attachmentPoint);
        
        if (directPath) {
            // Remove all pivots - direct path is clear
            //console.log('Direct path clear - removing all pivots');
            this.pivotPoints = [];
            this.rebuildConstraintSystem();
            this.lastPivotChangeFrame = this.frameCounter;
            return;
        }
        */
        
        // Check each pivot to see if it's still needed
        for (let i = this.pivotPoints.length - 1; i >= 0; i--) {
            if (this.isPivotObsolete(i, playerPos)) {
                //console.log('Removing obsolete pivot at:', this.pivotPoints[i]);
                this.pivotPoints.splice(i, 1);
                this.rebuildConstraintSystem();
                this.lastPivotChangeFrame = this.frameCounter;
                break; // Only remove one pivot per frame for stability
            }
        }
    }
    
    lineIntersectsAnyObstacle(start, end) {
        const staticBodies = this.getStaticBodies();
        for (const body of staticBodies) {
          if (this.calculateBodyIntersection(start, end, body)) return true;
        }
        return false;
      }
      
    // minimal tweak of the previous implementation
    isPivotObsolete(pivotIndex, playerPos) {
        const currentPivot = this.pivotPoints[pivotIndex];
    
        const isFirst   = pivotIndex === 0;
        const prevPoint = isFirst
            ? playerPos
            : this.pivotPoints[pivotIndex - 1];
        const nextPoint = pivotIndex < this.pivotPoints.length - 1
            ? this.pivotPoints[pivotIndex + 1]
            : this.attachmentPoint;
    
        // 1.  Is the direct line around this pivot free of obstacles?
        //     (ignore the wall *at the pivot itself*, otherwise the line
        //      is considered blocked just because it touches that edge)
        const pathClear =
            !this.lineIntersectsAnyObstacle(prevPoint, nextPoint);
    
        // 2.  Is the rope almost straight through the pivot?
        const straightEnough =
            this.isAlmostStraight(prevPoint, currentPivot, nextPoint);
    
        if (pathClear && straightEnough) {
        // geometric criteria satisfied – pivot can go, even if the
        // player is still very close
        return true;
        }
    
        // 3.  Otherwise keep the pivot while the player is still nearby
        const playerDistance = Math.hypot(
            playerPos.x - currentPivot.x,
            playerPos.y - currentPivot.y
        );
  
        const minRemovalDistance = 10;        // was 30
        return playerDistance >= minRemovalDistance && pathClear && straightEnough;
    }
      
    isAlmostStraight(prevPos, pivotPos, nextPos, maxDeviationDeg = 25) {
        const v1 = {
          x: prevPos.x - pivotPos.x,
          y: prevPos.y - pivotPos.y
        };
        const v2 = {
          x: nextPos.x - pivotPos.x,
          y: nextPos.y - pivotPos.y
        };
      
        const len1 = Math.hypot(v1.x, v1.y);
        const len2 = Math.hypot(v2.x, v2.y);
        if (len1 === 0 || len2 === 0) return false;
      
        const dot = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
        const cosLimit =
          Math.cos((180 - maxDeviationDeg) * Math.PI / 180); // negative value
      
        return dot <= cosLimit;  // true when angle ≥ 180°−maxDeviationDeg
      }
    
    getCurrentRopeSegments(playerPos) {
        // Current implementation: single segment from player to attachment
        // TODO: Expand to multi-segment when pivot points are added
        if (this.pivotPoints.length === 0) {
            return [{
                start: playerPos,
                end: this.attachmentPoint,
                index: 0
            }];
        } else {
            // Multi-segment: player -> pivot1 -> pivot2 -> ... -> attachment
            const segments = [];
            let currentStart = playerPos;
            
            for (let i = 0; i < this.pivotPoints.length; i++) {
                segments.push({
                    start: currentStart,
                    end: this.pivotPoints[i],
                    index: i
                });
                currentStart = this.pivotPoints[i];
            }
            
            // Final segment from last pivot to attachment
            segments.push({
                start: currentStart,
                end: this.attachmentPoint,
                index: this.pivotPoints.length
            });
            
            return segments;
        }
    }
    
    checkSegmentCollision(segment, staticBodies, segmentIndex) {
        for (const body of staticBodies) {
            const intersection = this.calculateBodyIntersection(segment.start, segment.end, body);
            
            if (intersection) {
                if (this.shouldCreatePivot(intersection, segmentIndex)) {
                    this.createPivotPoint(intersection, body, segmentIndex);
                    this.lastPivotChangeFrame = this.frameCounter;
                    //console.log('Created pivot point at:', intersection);
                    break; // Only create one pivot per segment per frame
                }
            }
        }
    }
    
    shouldCreatePivot(intersectionPoint, segmentIndex) {
        // Check if this intersection point is far enough from existing pivots
        for (const pivot of this.pivotPoints) {
            const distance = Math.sqrt(
                Math.pow(intersectionPoint.x - pivot.x, 2) + 
                Math.pow(intersectionPoint.y - pivot.y, 2)
            );
            
            if (distance < this.minPivotDistance) {
                return false; // Too close to existing pivot
            }
        }
        
        return true;
    }
    
    createPivotPoint(point, body, segmentIndex) {
        const newPivot = {
            x: point.x,
            y: point.y,
            body: body
        };
        
        // Insert pivot at the correct position in the array
        this.pivotPoints.splice(segmentIndex, 0, newPivot);
        
        // Rebuild constraint system with new pivot
        this.rebuildConstraintSystem();
    }
    
    rebuildConstraintSystem() {
        // Remove all existing constraints
        this.clearAllConstraints();
        
        // For now, still use single constraint while testing
        // TODO: Implement full multi-segment constraints
        if (this.pivotPoints.length === 0) {
            // No pivots: use original single constraint system
            this.createSingleConstraint();
        } else {
            // Has pivots: use multi-segment constraint system
            this.createMultiSegmentConstraints();
        }
    }
    
    clearAllConstraints() {
        if (this.constraint) {
            this.physicsManager.removeConstraint(this.constraint);
            this.constraint = null;
        }
        
        // Clear any multi-segment constraints
        for (const segment of this.segments) {
            if (segment.constraint) {
                this.physicsManager.removeConstraint(segment.constraint);
            }
        }
        this.segments = [];
    }
    
    createSingleConstraint() {
        // Use the existing single constraint creation logic
        const playerBody = this.getCurrentPlayerBody();
        if (playerBody && this.attachmentPoint) {
            this.constraint = Matter.Constraint.create({
                bodyA: playerBody,
                pointA: { x: 0, y: 0 },
                pointB: this.attachmentPoint,
                stiffness: 1.0,
                damping: 0.05,
                length: this.totalRopeLength || this.calculateRopeLength(
                    { x: playerBody.position.x, y: playerBody.position.y }, 
                    this.attachmentPoint
                )
            });
            
            this.physicsManager.addConstraint(this.constraint);
        }
    }
    
    createMultiSegmentConstraints() {
        const playerBody = this.getCurrentPlayerBody();
        if (!playerBody) return;
        
        const allPoints = [
            { x: playerBody.position.x, y: playerBody.position.y, body: playerBody },
            ...this.pivotPoints,
            { x: this.attachmentPoint.x, y: this.attachmentPoint.y, body: null }
        ];
        
        // Create constraints between consecutive points
        for (let i = 0; i < allPoints.length - 1; i++) {
            const startPoint = allPoints[i];
            const endPoint = allPoints[i + 1];
            
            const segmentLength = Math.sqrt(
                Math.pow(endPoint.x - startPoint.x, 2) + 
                Math.pow(endPoint.y - startPoint.y, 2)
            );
            
            const constraint = Matter.Constraint.create({
                bodyA: startPoint.body,
                pointA: startPoint.body ? { x: 0, y: 0 } : null,
                pointB: endPoint.body ? endPoint : { x: endPoint.x, y: endPoint.y },
                stiffness: 1.0,
                damping: 0.05,
                length: segmentLength
            });
            
            this.physicsManager.addConstraint(constraint);
            
            this.segments.push({
                start: startPoint,
                end: endPoint,
                constraint: constraint,
                length: segmentLength
            });
        }
        
        //console.log(`Created ${this.segments.length} rope segments with ${this.pivotPoints.length} pivots`);
    }
    
    getCurrentPlayerBody() {
        // Use stored player body reference
        return this.playerBody;
    }
    
    getStaticBodies() {
        const bodies = Matter.Composite.allBodies(this.physicsManager.getWorld());
        return bodies.filter(body => body.isStatic);
    }
    
    findClosestIntersection(intersections, startPoint) {
        if (intersections.length === 0) return null;
        
        let closest = intersections[0];
        let minDistance = Math.sqrt(
            Math.pow(closest.x - startPoint.x, 2) + 
            Math.pow(closest.y - startPoint.y, 2)
        );
        
        for (let i = 1; i < intersections.length; i++) {
            const distance = Math.sqrt(
                Math.pow(intersections[i].x - startPoint.x, 2) + 
                Math.pow(intersections[i].y - startPoint.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = intersections[i];
            }
        }
        
        return closest;
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
        if (this.segments.length > 0) {
            // Multi-segment: sum all segment lengths
            return this.segments.reduce((total, segment) => total + segment.length, 0);
        } else {
            // Single segment: use constraint length
            return this.constraint ? this.constraint.length : 0;
        }
    }
    
    // New getters for multi-segment rendering
    getPivotPoints() {
        return this.pivotPoints;
    }
    
    getRopeSegments(playerPos) {
        if (!this.isAttached()) return [];
        return this.getCurrentRopeSegments(playerPos);
    }
}