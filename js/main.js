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
        
        // Add debug functionality
        this.setupDebugTools();
        
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
                
                // Show error message
                document.getElementById('loading').textContent = 'Error loading game: ' + error.message;
            });
    }
    
    setupDebugTools() {
        // Debug mode flag
        window.debugMode = false;
        
        // Add toggle debug function
        window.toggleDebug = () => {
            window.debugMode = !window.debugMode;
            
            // Toggle full scene illumination
            const debugLight = this.renderer.scene.getObjectByName('debugLight');
            if (window.debugMode && !debugLight) {
                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.name = 'debugLight';
                light.position.set(0, 10, 0);
                this.renderer.scene.add(light);
                console.log('Debug light added');
            } else if (!window.debugMode && debugLight) {
                this.renderer.scene.remove(debugLight);
                console.log('Debug light removed');
            }
            
            console.log('Debug mode:', window.debugMode);
        };
        
        // Add FPS counter
        this.stats = { fps: 0, frameCount: 0, lastFpsUpdate: 0 };
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.style.position = 'absolute';
        this.fpsDisplay.style.top = '10px';
        this.fpsDisplay.style.left = '10px';
        this.fpsDisplay.style.color = '#ff3030';
        this.fpsDisplay.style.fontFamily = 'monospace';
        this.fpsDisplay.style.display = 'none';
        document.body.appendChild(this.fpsDisplay);
        
        // Add event listeners for debug keys
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                window.toggleDebug();
                console.log('Debug mode toggled');
            } else if (e.key === 'F3') {
                this.fpsDisplay.style.display = 
                    this.fpsDisplay.style.display === 'none' ? 'block' : 'none';
                console.log('FPS display toggled');
            }
        });
    }
    
    async loadInitialAssets() {
        try {
            // Show loading progress
            this.updateLoadingMessage('Loading initial room...');
            
            // Add loading progress indicator
            const loadingBar = document.createElement('div');
            loadingBar.style.width = '200px';
            loadingBar.style.height = '10px';
            loadingBar.style.backgroundColor = '#333';
            loadingBar.style.marginTop = '10px';
            
            const loadingProgress = document.createElement('div');
            loadingProgress.style.width = '0%';
            loadingProgress.style.height = '100%';
            loadingProgress.style.backgroundColor = '#ff3030';
            loadingProgress.style.transition = 'width 0.3s';
            
            loadingBar.appendChild(loadingProgress);
            document.getElementById('loading').appendChild(loadingBar);
            
            // Update progress indicator
            loadingProgress.style.width = '30%';
            
            // Start with entry room only
            await this.level.loadInitialRoom();
            
            // Update progress indicator
            loadingProgress.style.width = '60%';
            this.updateLoadingMessage('Initializing UI...');
            
            // Initialize UI after assets are loaded
            this.ui.init();
            
            // Update progress indicator
            loadingProgress.style.width = '100%';
            this.updateLoadingMessage('Ready!');
            
            // Debug dump of scene hierarchy if debug mode
            if (window.debugMode) {
                console.log('Initial scene hierarchy:');
                this.renderer.dumpSceneHierarchy();
            }
            
            return true;
        } catch (error) {
            console.error('Error during initialization:', error);
            this.updateLoadingMessage(`Error: ${error.message}`);
            throw error; // Re-throw so the caller can handle it
        }
    }
    
    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            // Keep existing content (like the loading bar) and prepend the message
            const existingBar = loadingElement.querySelector('div');
            loadingElement.innerHTML = message;
            if (existingBar) {
                loadingElement.appendChild(existingBar);
            }
        }
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
        
        // Update FPS counter
        this.updateFps(currentTime);
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    updateFps(currentTime) {
        this.stats.frameCount++;
        
        // Update FPS once per second
        if (currentTime - this.stats.lastFpsUpdate >= 1000) {
            this.stats.fps = Math.round(this.stats.frameCount * 1000 / (currentTime - this.stats.lastFpsUpdate));
            this.stats.frameCount = 0;
            this.stats.lastFpsUpdate = currentTime;
            
            // Update display
            this.fpsDisplay.textContent = `FPS: ${this.stats.fps}`;
            
            // Additional debug info when debug mode is on
            if (window.debugMode) {
                const rendererInfo = this.renderer.renderer.info;
                this.fpsDisplay.textContent += ` | Draw calls: ${rendererInfo.render.calls}`;
                this.fpsDisplay.textContent += ` | Triangles: ${rendererInfo.render.triangles}`;
            }
        }
    }
    
    update(deltaTime) {
        // Update game state
        this.state.update(deltaTime);
        
        // Update level
        this.level.update(deltaTime);
        
        // Update UI
        this.ui.update(deltaTime);
        
        // Update pulsing effect for selected grid cell
        this.updatePulsingEffect(deltaTime);
    }
    
    updatePulsingEffect(deltaTime) {
        // Update pulsing effect for selected grid cell
        if (this.input.selectedGridCell && this.input.selectedGridCell.userData.isPulsing) {
            // Update pulse time
            this.input.selectedGridCell.userData.pulseTime += deltaTime * 4;
            
            // Calculate pulse intensity (oscillating between 0.5 and 1.0)
            const pulseIntensity = 0.5 + 0.5 * Math.sin(this.input.selectedGridCell.userData.pulseTime);
            
            // Apply pulsing to emissive intensity
            const baseColor = 0x777777;
            const pulseColor = new THREE.Color(baseColor);
            pulseColor.multiplyScalar(pulseIntensity);
            
            this.input.selectedGridCell.material.emissive.set(pulseColor);
        }
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});