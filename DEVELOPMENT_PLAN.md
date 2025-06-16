# Detailed Rope Ascend Development Plan

## Phase 1: Project Foundation & Basic Structure
**Goal**: Establish working HTML5 Canvas environment with Matter.js integration

### Step 1.1: Project Structure Setup
- Create `index.html` with canvas element (800x600px), Matter.js CDN link for physics engine
- Create `css/style.css` with canvas centering, body margins reset
- Create `js/` folder structure: main.js, physics.js, renderer.js, input.js, camera.js, player.js, rope.js, world.js
- **Verification**: Open index.html, see centered canvas, Matter.js loads, no console errors

### Step 1.2: Core Architecture Foundation
- `js/main.js`: Game class with state management (MENU, PLAYING, GAMEOVER), game loop with requestAnimationFrame
- `js/physics.js`: Matter.js engine initialization, world setup with gravity (0, 0.8)
- `js/renderer.js`: Canvas context setup, clear/render cycle, basic drawing functions
- **Verification**: Game loop runs at 60fps, Matter.js world exists, canvas clears each frame

### Step 1.3: Input System Foundation
- `js/input.js`: Mouse position tracking, button state management, keyboard state tracking
- Event listeners for mousemove, mousedown, mouseup, keydown, keyup
- Mouse coordinate conversion to world space
- **Verification**: Console logs mouse coordinates, key states update correctly

## Phase 2: Player Character & Basic Physics
**Goal**: Physics-driven player character that falls and interacts with world

### Step 2.1: Player Implementation
- `js/player.js`: Player class with Matter.js circular body (radius: 8px)
- Player states: FALLING, ROPE_ATTACHED, DEAD
- Position/velocity tracking, state management
- **Verification**: Player circle spawns, falls with gravity, physics body works

### Step 2.2: Camera System (Upward-Only Scrolling)
- `js/camera.js`: Camera that only moves upward when player approaches top 25% of screen
- Smooth vertical scrolling (no horizontal following)
- Camera never moves downward once it has scrolled up
- **Verification**: Camera stays put when player swings around, only scrolls up when needed

### Step 2.3: Basic World Boundaries
- Static ground body and side walls in physics.js
- Simple rectangular rendering for boundaries
- **Verification**: Player bounces off walls, boundaries render correctly

## Phase 3: Rope System Core Implementation
**Goal**: Functional rope attachment, swinging, and release mechanics

### Step 3.1: Rope Attachment System
- `js/rope.js`: Rope class with raycast-based attachment detection
- Raycast from player to mouse position (max distance: 200px)
- Matter.js constraint creation between player and attachment point on LMB hold
- **Verification**: Rope visually connects player to wall intersection, attachment works

### Step 3.2: Rope Physics & Constraint Management
- Proper constraint stiffness and damping for realistic swing
- Rope release on LMB release with momentum conservation
- Constraint cleanup and state management
- **Verification**: Natural pendulum swing, clean release with proper trajectory

### Step 3.3: Rope Length Control
- W key: Shorten rope (increases swing speed due to angular momentum)
- S key: Lengthen rope (decreases swing speed, allows wider swings)
- Smooth length transitions with proper physics feedback
- **Verification**: Length changes affect swing behavior predictably

## Phase 4: Procedural World Generation
**Goal**: Infinite vertical world with strategic attachment points

### Step 4.1: Basic Wall Generation
- `js/world.js`: Chunk-based world generation (400px chunks)
- Simple algorithm creating varied wall surfaces with attachment points
- Coordinate array generation for wall geometry
- **Verification**: Consistent wall generation with predictable patterns

### Step 4.2: Physics Body Integration
- Convert coordinate arrays to Matter.js static bodies
- Proper collision detection with generated walls
- Handle complex polygon shapes for realistic walls
- **Verification**: Generated walls have collision, rope attaches correctly

### Step 4.3: World Streaming System
- Generate chunks ahead of camera (2 screen heights)
- Remove chunks behind camera (2 screen heights below)
- Memory management for active chunks
- **Verification**: Seamless world generation, stable memory usage

### Step 4.4: Strategic Anchor Point Placement
- Ensure attachment points within rope range every 100-150px vertically
- Add outcroppings and ceiling sections for varied gameplay
- Guarantee playable paths through generated world
- **Verification**: Player can always progress upward, no impossible sections

## Phase 5: Complete Game Mechanics
**Goal**: Full playable game with hazard, scoring, and game states

### Step 5.1: Rising Hazard System
- Hazard that rises from bottom at constant speed (adjustable)
- Visual representation and collision detection
- Game over trigger on player contact
- **Verification**: Hazard creates pressure, game over works correctly

### Step 5.2: Scoring System
- Height-based scoring (maximum altitude reached)
- Score persistence with localStorage
- Game over screen with restart functionality
- **Verification**: Score tracks correctly, persists between sessions

### Step 5.3: Game State Management
- Complete game flow: menu → playing → game over → restart
- Proper state transitions and cleanup
- Basic UI for score display and game states
- **Verification**: Full game loop works, smooth state transitions

## Phase 6: Polish & Optimization
**Goal**: Smooth 60fps gameplay with satisfying feel

### Step 6.1: Physics Tuning
- Optimize Matter.js engine settings for performance
- Fine-tune player mass, gravity, rope stiffness for best feel
- Ensure consistent 60fps with complex rope physics
- **Verification**: Smooth gameplay, responsive controls, stable framerate

### Step 6.2: Visual Polish
- Screen shake on impact (velocity-based)  
- Rope visual effects (tension, stretch)
- Improved rendering with better colors and effects
- **Verification**: Visual feedback enhances gameplay without performance cost

### Step 6.3: Performance Optimization
- Viewport culling for rendering efficiency
- Physics body sleeping and memory cleanup
- Profiling and optimization of bottlenecks
- **Verification**: Stable performance over extended play sessions

### Step 6.4: Final Gameplay Tuning
- Hazard rise speed balancing
- World generation parameter tuning
- Control responsiveness refinement
- **Verification**: Satisfying difficulty curve, intuitive controls

## Success Criteria:
- **Phase 1**: Project loads without errors, basic structure works
- **Phase 2**: Player physics work, camera scrolls upward only  
- **Phase 3**: Rope system enables basic swinging gameplay
- **Phase 4**: Infinite world generation with guaranteed playability
- **Phase 5**: Complete game with win/lose conditions and scoring
- **Phase 6**: Polished 60fps experience with satisfying rope physics

Each phase builds incrementally with clear verification before proceeding.