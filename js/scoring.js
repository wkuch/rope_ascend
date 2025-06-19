class ScoringSystem {
    constructor() {
        this.currentScore = 0;
        this.highScore = this.loadHighScore();
        this.startHeight = 550; // Ground level reference point
        
        console.log('Scoring system initialized. High score:', this.highScore);
    }
    
    updateScore(playerY) {
        // Calculate height-based score (higher is better, so invert Y coordinate)
        const height = Math.max(0, this.startHeight - playerY);
        this.currentScore = Math.round(height);
        
        return this.currentScore;
    }
    
    getCurrentScore() {
        return this.currentScore;
    }
    
    getHighScore() {
        return this.highScore;
    }
    
    isNewHighScore() {
        return this.currentScore > this.highScore;
    }
    
    saveHighScore() {
        if (this.isNewHighScore()) {
            this.highScore = this.currentScore;
            localStorage.setItem('ropeAscendHighScore', this.highScore.toString());
            console.log('New high score saved:', this.highScore);
            return true;
        }
        return false;
    }
    
    loadHighScore() {
        const savedScore = localStorage.getItem('ropeAscendHighScore');
        return savedScore ? parseInt(savedScore, 10) : 0;
    }
    
    reset() {
        this.currentScore = 0;
        console.log('Score reset for new game');
    }
    
    getScoreData() {
        return {
            current: this.currentScore,
            high: this.highScore,
            isNewHigh: this.isNewHighScore()
        };
    }
}