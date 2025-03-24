import * as THREE from 'three';
import { RenderManager } from './core/RenderManager.js';
import { StateManager } from './core/StateManager.js';
import { InputManager } from './core/InputManager.js';
import { LevelManager } from './core/LevelManager.js';
import { UIManager } from './core/UIManager.js';

class Game {
    constructor() {
        // Core system managers
        this.renderer = new RenderManager();
        this.state = new StateManager();
        this.input = new InputManager(this);
        this.level = new LevelManager(this);
        this.ui = new UIManager(this);
        
        // Game properties
        this.isRunning = false;
        this.lastTime = 0;
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Initialize systems
        this.renderer.init();
        this.state.init();
        this.input.init();
        
        // Load initial assets
        this.loadInitialAssets()
            .then(() => {
                // Hide loading screen
                document.getElementById('loading').style.display = 'none';
                
                // Start the game
                this.start();
            })
            .catch(error => {
                console.error('Failed to load initial assets:', error);
            });
    }
    
    async loadInitialAssets() {
        // Start with entry room only
        await this.level.loadInitialRoom();
        
        // Initialize UI after assets are loaded
        this.ui.init();
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // Start oxygen countdown
        this.state.startOxygenCountdown();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render the scene
        this.renderer.render();
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // Update game state
        this.state.update(deltaTime);
        
        // Update level
        this.level.update(deltaTime);
        
        // Update UI
        this.ui.update(deltaTime);
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});