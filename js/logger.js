class Logger {
    constructor(game) {
        this.game = game;
        this.history = [];
        this.logDuration = 10000; // 10 seconds in milliseconds
    }

    logState() {
        const now = performance.now();
        
        const state = {
            timestamp: now,
            player: {
                position: this.game.player.getPosition(),
                velocity: this.game.player.getVelocity(),
                state: this.game.player.getState()
            },
            rope: {
                isAttached: this.game.rope.isAttached(),
                attachmentPoint: this.game.rope.getAttachmentPoint(),
                ropeLength: this.game.rope.getRopeLength(),
                pivotPoints: this.game.rope.getPivotPoints().map(p => ({ x: p.x, y: p.y, bodyLabel: p.body.label }))
            },
            nearbyGeometry: this.getNearbyGeometry(),
            input: {
                mousePosition: this.game.input.getMousePosition(),
                isMouseDown: this.game.input.isMouseDown(),
                w_keyDown: this.game.input.isKeyPressed('KeyW'),
                s_keyDown: this.game.input.isKeyPressed('KeyS'),
                a_keyDown: this.game.input.isKeyPressed('KeyA'),
                d_keyDown: this.game.input.isKeyPressed('KeyD')
            }
        };

        this.history.push(state);

        // Prune history to keep it within the log duration
        while (this.history.length > 0 && now - this.history[0].timestamp > this.logDuration) {
            this.history.shift();
        }
    }

    getNearbyGeometry() {
        const playerPos = this.game.player.getPosition();
        const searchRadius = 200; // Log geometry within this radius of the player
        const bodies = Matter.Composite.allBodies(this.game.physics.getWorld());
        
        return bodies
            .filter(body => body.isStatic && Matter.Vector.magnitude(Matter.Vector.sub(body.position, playerPos)) < searchRadius)
            .map(body => ({
                label: body.label,
                position: body.position,
                vertices: body.vertices.map(v => ({ x: v.x, y: v.y }))
            }));
    }

    downloadLog() {
        const logData = JSON.stringify(this.history, null, 2);
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `rope_log_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Log file downloaded.');
    }
}
