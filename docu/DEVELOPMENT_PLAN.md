# Detailed Rope Ascend Development Plan

## IMPORTANT: Phase-by-Phase Development Approach

**Critical Development Rule**: Each phase must be completed and verified before proceeding to the next phase. This approach prevents complex debugging across multiple systems and ensures each foundation is solid.

**Phase Completion Process**:
1. Complete ALL tasks in the current phase
2. Verify the phase meets its success criteria
3. Test thoroughly to catch errors early
4. Get confirmation before proceeding to next phase
5. DO NOT implement features from future phases early

**Why This Matters**:
- Prevents debugging complex interactions between incomplete systems
- Ensures each foundation is stable before building on it
- Makes it easier to isolate and fix issues
- Allows for course correction if design assumptions are wrong
- Creates clear milestones and progress tracking

---

## Phase 1: Project Foundation & Basic Structure
**Goal**: Establish working HTML5 Canvas environment with Matter.js integration

**PHASE 1 SCOPE LIMITS**: This phase should ONLY implement the basic framework. No player, no rope, no world generation - just the foundation that future phases will build upon.

### Step 1.1: Project Structure Setup
- Create `index.html` with canvas element (800x600px), Matter.js CDN link for physics engine
- Create `css/style.css` with canvas centering, body margins reset
- Create `js/` folder structure: main.js, physics.js, renderer.js, input.js
- **Verification**: Open index.html, see centered canvas, Matter.js loads, no console errors

### Step 1.2: Core Architecture Foundation
- `js/main.js`: Game class with basic state management, game loop with requestAnimationFrame
- `js/physics.js`: Matter.js engine initialization, world setup with gravity (0, 0.8)
- `js/renderer.js`: Canvas context setup, clear/render cycle, basic drawing functions
- **Verification**: Game loop runs at 60fps, Matter.js world exists, canvas clears each frame

### Step 1.3: Input System Foundation
- `js/input.js`: Mouse position tracking, button state management, keyboard state tracking
- Event listeners for mousemove, mousedown, mouseup, keydown, keyup
- Basic mouse coordinate conversion
- **Verification**: Console logs mouse coordinates, key states update correctly

**PHASE 1 SUCCESS CRITERIA**:
- HTML page loads without errors
- Canvas element displays properly (800x600px, centered)
- Matter.js library loads successfully
- Game loop runs at 60fps with proper timing
- Input system captures mouse/keyboard events correctly
- Basic renderer can clear canvas and draw simple shapes
- Physics engine initializes and runs without errors
- No console errors or warnings

**PHASE 1 TESTING CHECKLIST**:
- [x] Open index.html in browser - no errors
- [x] Canvas appears centered with correct dimensions
- [x] Console shows no errors from Matter.js loading
- [x] Game loop runs smoothly (check with console.log FPS counter)
- [x] Mouse coordinates log correctly when moving over canvas
- [x] Keyboard events trigger correctly (test with console.log)
- [x] Canvas clears properly each frame
- [x] Basic shapes can be drawn (test with simple rectangle)

## Phase 2: Player Character & Basic Physics
**Goal**: Physics-driven player character that falls and interacts with world

**PHASE 2 SCOPE LIMITS**: Add only player character, camera, and basic boundaries. No rope system yet.

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

**PHASE 2 SUCCESS CRITERIA**:
- Player character spawns and is visible as red circle
- Player falls with realistic gravity physics
- Player bounces off ground and walls correctly
- Camera follows player upward but never moves down
- Camera only scrolls when player reaches top 25% of screen
- Player position and velocity are tracked accurately
- No console errors with physics interactions

**PHASE 2 TESTING CHECKLIST**:
- [x] Player spawns at correct starting position
- [x] Player falls with gravity when game starts
- [x] Player bounces realistically off ground
- [x] Player bounces off left and right walls
- [x] Camera stays fixed when player moves horizontally
- [x] Camera scrolls up when player reaches top 25% of screen
- [x] Camera never scrolls downward once it has moved up
- [x] Player state changes are logged correctly
- [x] Physics interactions are smooth and stable

## Phase 3: Rope System Core Implementation
**Goal**: Functional rope attachment, swinging, and release mechanics

**PHASE 3 SCOPE LIMITS**: Implement only the rope system. No world generation or procedural content yet.

### Step 3.1: Rope Attachment System
- `js/rope.js`: Rope class with raycast-based attachment detection
- Raycast from player to mouse position (max distance: 200px)
- Matter.js constraint creation between player and attachment point on LMB hold
- **Verification**: Rope visually connects player to wall intersection, attachment works

### Step 3.2: Rope Physics & Constraint Management
- Proper constraint stiffness and damping for realistic swing
- **A/D Key Swing Controls** (Enhancement added during development):
  - A key: Clockwise angular momentum around attachment point
  - D key: Counterclockwise angular momentum around attachment point
  - Active swing control for building momentum while attached
- Rope release on LMB release with momentum conservation
- Constraint cleanup and state management
- **Verification**: Natural pendulum swing with active A/D control, clean release with proper trajectory

### Step 3.3: Rope Length Control
- W key: Shorten rope (increases swing speed due to angular momentum)
- S key: Lengthen rope (decreases swing speed, allows wider swings)
- Smooth length transitions with proper physics feedback
- **Verification**: Length changes affect swing behavior predictably

### Step 3.4: Environmental Rope Interaction
**Goal**: Rope wraps around corners and obstacles for realistic environmental collision

#### Step 3.4.1: Multi-Segment Rope Architecture
- Replace single constraint with dynamic rope segment system
- Rope data structure: array of points [player, pivot1, pivot2, ..., attachment]
- Each segment has individual Matter.js constraint
- Maintain total rope length across all segments
- **Verification**: Rope represented as connected segments, length control works across segments

#### Step 3.4.2: Intersection Detection System  
- Implement line-rectangle intersection for rope segments vs obstacles
- Continuous collision detection during rope movement
- Extensible system for future obstacle types (circles, polygons)
- Minimum intersection distance to prevent micro-collisions
- **Verification**: System detects when rope segments intersect walls/platforms

#### Step 3.4.3: Dynamic Pivot Point Management
- Create pivot points when rope intersects obstacle corners/edges
- Validate pivot points lie on obstacle boundaries
- Remove obsolete pivots when rope unwraps (no longer needed)
- Maintain minimum spacing between pivots to prevent clustering
- **Verification**: Rope wraps around corners, unwraps when player swings back

#### Step 3.4.4: Constraint System Integration
- Smoothly transition from single to multi-segment constraints
- Distribute rope length changes (W/S keys) across all segments  
- Ensure swing physics (A/D keys) work with multi-segment rope
- Handle constraint creation/removal without physics glitches
- **Verification**: All rope controls work identically with environmental collision

#### Step 3.4.5: Visual Rendering Updates
- Update rope renderer to draw multi-segment rope following pivots
- Show rope bending realistically around obstacles
- Maintain rope length indicators and visual feedback
- Debug visualization for pivot points and segments
- **Verification**: Rope visually wraps around geometry, looks natural

**PHASE 3 SUCCESS CRITERIA**:
- Mouse cursor aims rope direction correctly
- Left mouse button fires and attaches rope to walls
- Rope creates realistic pendulum swing physics
- A key provides clockwise swing control for momentum building
- D key provides counterclockwise swing control for momentum building
- Player maintains momentum when rope is released
- W key shortens rope and increases swing speed
- S key lengthens rope and decreases swing speed
- Rope length changes are smooth and responsive
- **Rope wraps around corners and obstacles realistically**
- **Rope unwraps when player swings back (no permanent tangling)**
- **Multi-segment rope maintains same physics feel as single constraint**
- Rope attachment point is visually clear
- No physics glitches or constraint errors

**PHASE 3 TESTING CHECKLIST**:
- [x] Rope fires in direction of mouse cursor
- [x] Rope attaches to walls within 200px range
- [x] Rope attachment creates visible line from player to wall
- [x] Player swings naturally in pendulum motion
- [x] A key provides clockwise swing control around attachment point
- [x] D key provides counterclockwise swing control around attachment point
- [x] Swing controls build momentum for faster/higher swings
- [x] Releasing mouse button launches player with correct momentum
- [x] W key shortens rope and speeds up swing
- [x] S key lengthens rope and slows down swing
- [x] Rope length changes are visually smooth
- [x] Multiple rope attach/release cycles work correctly
- [x] No rope constraint errors in console
- [x] Rope wraps around platform corners when swinging
- [x] Rope wraps around multiple obstacles in sequence
- [x] Rope unwraps correctly when player swings back
- [x] Multi-segment rope maintains smooth swing physics
- [x] W/S length control works with wrapped rope
- [x] A/D swing control works with wrapped rope
- [x] Rope visual rendering follows all pivot points
- [x] No rope getting permanently stuck on geometry
- [x] Constraint creation/removal is smooth and glitch-free
- [x] Rope behaves correctly when fully wrapping around an obstacle

## Phase 4: Procedural World Generation
**Goal**: Infinite vertical world with strategic attachment points

**PHASE 4 SCOPE LIMITS**: Implement world generation and streaming. No hazards or scoring yet.

### Step 4.0: 
- remove the test obstacles
- and walls for testing in earlier phases from the world

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

### Step 4.5: reate more interesting obstacles
 

**PHASE 4 SUCCESS CRITERIA**:
- Procedural walls generate consistently and look natural
- Generated walls have proper physics collision
- Rope can attach to all generated wall surfaces
- World chunks stream in/out based on camera position
- Memory usage remains stable during extended play
- Player can always find rope attachment points to progress
- No gaps exist that would make progression impossible
- Wall generation algorithm creates varied but playable terrain

**PHASE 4 TESTING CHECKLIST**:
- [ ] Walls generate with natural-looking variation
- [ ] Generated walls have solid collision detection
- [ ] Rope attaches correctly to all generated surfaces
- [ ] New chunks appear smoothly as camera moves up
- [ ] Old chunks are removed to prevent memory leaks
- [ ] Player can always find attachment points within rope range
- [ ] No impossible gaps that block upward progress
- [ ] Outcroppings and ceiling sections generate correctly
- [ ] World generation performance is consistent
- [ ] No visual artifacts at chunk boundaries

## Phase 5: Complete Game Mechanics
**Goal**: Full playable game with hazard, scoring, and game states

**PHASE 5 SCOPE LIMITS**: Add game mechanics to make it a complete playable experience. No polish or optimization yet.

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

**PHASE 5 SUCCESS CRITERIA**:
- Rising hazard appears and moves upward at constant speed
- Player dies instantly when touching hazard
- Score increases as player climbs higher
- High score persists between game sessions
- Game over screen displays current and best scores
- Restart functionality works correctly
- Game states transition smoothly without errors
- All UI elements display correctly
- Complete gameplay loop from start to end works

**PHASE 5 TESTING CHECKLIST**:
- [ ] Hazard appears at bottom of screen
- [ ] Hazard rises at appropriate constant speed
- [ ] Hazard has clear visual representation
- [ ] Player dies immediately upon touching hazard
- [ ] Score increases correctly as player climbs
- [ ] High score is saved and persists after refresh
- [ ] Game over screen shows current score and high score
- [ ] Restart button works and resets game properly
- [ ] All game states (menu, playing, game over) work
- [ ] State transitions are smooth without glitches
- [ ] UI elements are readable and properly positioned

## Phase 6: Polish & Optimization
**Goal**: Smooth 60fps gameplay with satisfying feel

**PHASE 6 SCOPE LIMITS**: Final polish and optimization. This is the final phase before release.

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

**PHASE 6 SUCCESS CRITERIA**:
- Game runs consistently at 60fps
- Controls feel responsive and satisfying
- Visual effects enhance gameplay without distracting
- Screen shake provides good impact feedback
- Rope physics feel realistic and enjoyable
- Difficulty curve is challenging but fair
- Performance is stable over long play sessions
- All systems work together harmoniously
- Game is ready for release

**PHASE 6 TESTING CHECKLIST**:
- [ ] Frame rate stays consistently at 60fps
- [ ] No frame drops during intense rope swinging
- [ ] Controls respond instantly to player input
- [ ] Screen shake feels satisfying on impacts
- [ ] Rope visual effects look good and perform well
- [ ] Physics feel realistic and fun to play with
- [ ] Hazard speed creates appropriate pressure
- [ ] World generation creates interesting challenges
- [ ] Memory usage is stable over extended play
- [ ] No performance degradation after long sessions
- [ ] Game feels polished and complete

## Success Criteria:
- **Phase 1**: Project loads without errors, basic structure works
- **Phase 2**: Player physics work, camera scrolls upward only  
- **Phase 3**: Rope system enables basic swinging gameplay
- **Phase 4**: Infinite world generation with guaranteed playability
- **Phase 5**: Complete game with win/lose conditions and scoring
- **Phase 6**: Polished 60fps experience with satisfying rope physics

Each phase builds incrementally with clear verification before proceeding.