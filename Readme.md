# Rope Ascend - Core idea
**The Concept:** 
A 2D single-player game that isolates the pure, physics-based joy of the ninja rope from Worms Armageddon and makes it the entire game.

**Core Gameplay:** The player controls a character in an endless, procedurally generated vertical chasm. The only goal is to climb as high as possible to escape a hazard constantly rising from the bottom of the screen.

**Movement:** Movement is accomplished exclusively with a grappling rope. The player aims and fires the rope to latch onto surfaces. They can then swing to build momentum before releasing, launching their character through the air. The core skill lies in chaining these actions together seamlessly—releasing a swing and firing the rope again mid-flight to catch a new anchor point, creating a fluid, acrobatic, and continuous ascent. It is a pure test of timing and physics mastery, with the only objective being to achieve a flow state and beat your own high score.

# Game Design details

1. Game Objective
The player's single objective is to climb as high as possible within an endless vertical chasm using only a grappling rope. The game ends when the player is consumed by a steadily rising hazard from below. The score is measured in the maximum height achieved.

2. The Player Character
The player controls a small, simple character. The character is always subject to gravity unless attached to the rope. The character itself has no intrinsic abilities like walking or jumping; all movement is generated via the rope.

3. Core Controls
The control scheme is updated to give the player direct control over the rope's length, which is central to building and controlling momentum.

    - Aiming: Mouse cursor aims the rope.
    - Fire & Attach (Hold Left Mouse Button): Press and hold LMB to fire the rope. It remains attached as long as the button is held.
    - Contract Rope (W Key):
        - While the rope is attached (LMB is held), holding the 'W' key will shorten the rope, pulling the character directly towards the anchor point at a constant speed.
        - Mechanical Impact: This is the primary tool for generating momentum. Contracting the rope while at the bottom of a swing dramatically increases your angular velocity (due to conservation of angular momentum), causing the character to whip around the anchor point much faster and achieve a higher, more powerful launch. It is also used to climb vertically up a rope hanging from a ceiling.

    - Lengthen Rope (S Key):
        - While the rope is attached, holding the 'S' key will lengthen the rope, letting the character out and away from the anchor point at a constant speed (up to a maximum rope length).
        - Mechanical Impact: This allows for controlled descents, fine-tuning the swing's radius, and dropping down to a lower position without having to detach. It's a tool for correction and setting up wider, more deliberate swings.

    - Release (Release Left Mouse Button): Releasing the LMB instantly detaches the rope, launching the character on their current trajectory.

4. The Core Gameplay Loop Explained
The game is a continuous cycle of four distinct phases that must be chained together fluidly.

    - The Shot: While falling or flying through the air, the player aims at a higher point on a wall or ceiling. They press and hold LMB to fire the rope.
    - The Latch: The rope connects, and the character's downward or outward momentum is converted into a swing. The physics must feel tangible; a long fall into a latch should result in a very fast initial swing.
    - The Swing: The player manages their pendulum motion. They can let it swing naturally or use the A/D keys to build more speed and height and W/S keys to contract or lengthen the rope to build momentum. The core skill is learning how to manipulate this swing to aim the next launch.
    - The Launch: At the optimal point in the swing—usually at the apex to maximize height or velocity—the player releases the LMB. They are now airborne, flying freely.

    The crucial element is that this loop repeats immediately. While airborne from a launch, the player is already aiming for their next anchor point, ready to fire the rope again before they lose too much altitude.

5. The Environment & The Hazard
    - The Chasm: The game takes place in a single, vertically scrolling chasm that is procedurally generated. The walls are not flat but feature various outcroppings, overhangs, and ceilings. This ensures every run is different and requires improvisation. All surfaces are initially considered standard "rock" that the rope can attach to.
    - The Hazard: A "kill plane" (visualized as lava, fog, etc.) perpetually rises from the bottom of the screen at a constant speed. Contact with this hazard results in an instant "Game Over." Its presence creates constant pressure, forcing the player to always prioritize upward momentum.