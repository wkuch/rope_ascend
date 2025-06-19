class GameStateManager {
    constructor() {
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing', 
            GAME_OVER: 'gameOver'
        };
        
        this.currentState = this.states.MENU;
        this.previousState = null;
        
        console.log('GameStateManager initialized in MENU state');
    }
    
    setState(newState) {
        // Handle the state name mapping
        let stateKey = newState.toUpperCase();
        if (newState === 'gameOver') {
            stateKey = 'GAME_OVER';
        }
        
        if (this.states[stateKey]) {
            this.previousState = this.currentState;
            this.currentState = this.states[stateKey];
            return true;
        }
        console.warn(`Invalid state: ${newState}`);
        return false;
    }
    
    getState() {
        return this.currentState;
    }
    
    getPreviousState() {
        return this.previousState;
    }
    
    isState(state) {
        return this.currentState === this.states[state.toUpperCase()];
    }
    
    canTransitionTo(targetState) {
        // Define valid state transitions
        const validTransitions = {
            [this.states.MENU]: [this.states.PLAYING],
            [this.states.PLAYING]: [this.states.GAME_OVER, this.states.MENU],
            [this.states.GAME_OVER]: [this.states.PLAYING, this.states.MENU]
        };
        
        // Convert targetState to match our state values
        let targetStateValue = targetState;
        if (targetState === 'gameOver') {
            targetStateValue = this.states.GAME_OVER;
        } else if (targetState === 'playing') {
            targetStateValue = this.states.PLAYING;
        } else if (targetState === 'menu') {
            targetStateValue = this.states.MENU;
        }
        
        return validTransitions[this.currentState] && 
               validTransitions[this.currentState].includes(targetStateValue);
    }
    
    transitionTo(targetState) {
        if (this.canTransitionTo(targetState)) {
            this.setState(targetState);
            return true;
        }
        console.warn(`Invalid transition from ${this.currentState} to ${targetState}`);
        return false;
    }
}