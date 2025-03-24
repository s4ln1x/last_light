import * as THREE from 'three';

export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Input state
        this.keys = {};
        this.mousePosition = new THREE.Vector2();
        this.touchPosition = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        
        // Track if touch input was detected
        this.isTouchDevice = false;
        
        // Interaction state
        this.hoveredObject = null;
        this.selectedGridCell = null;
        
        // DOM elements
        this.interactionButton = null;
    }
    
    init() {
        // Set up event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Get interaction button element
        this.interactionButton = document.getElementById('interaction-button');
        
        if (this.interactionButton) {
            this.interactionButton.addEventListener('click', this.onInteractionButtonClick.bind(this));
            this.interactionButton.addEventListener('touchend', this.onInteractionButtonClick.bind(this));
        }
        
        // Detect touch device
        this.detectTouchDevice();
    }
    
    detectTouchDevice() {
        this.isTouchDevice = ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0) || 
                             (navigator.msMaxTouchPoints > 0);
        
        // Set up appropriate interaction mode
        if (this.isTouchDevice) {
            this.setupTouchInterface();
        } else {
            this.setupMouseKeyboardInterface();
        }
    }
    
    setupTouchInterface() {
        // Show interaction button for touch devices
        if (this.interactionButton) {
            this.interactionButton.style.display = 'flex';
        }
        
        // Add touch-specific styles
        document.body.classList.add('touch-device');
    }
    
    setupMouseKeyboardInterface() {
        // Hide interaction button for mouse/keyboard
        if (this.interactionButton) {
            this.interactionButton.style.display = 'none';
        }
        
        // Add mouse-specific styles
        document.body.classList.add('mouse-device');
    }
    
    // Keyboard input handling
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Process movement keys
        this.processMovementKeys();
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    processMovementKeys() {
        // Only process if in movement state
        if (this.game.state.getState() !== this.game.state.GAME_STATE.PLAYING) {
            return;
        }
        
        // Get level grid
        const grid = this.game.level.getCurrentGrid();
        if (!grid) return;
        
        // Get current position
        const currentPos = this.game.state.state.player.position;
        let newX = currentPos.x;
        let newZ = currentPos.z;
        
        // Process WASD or Arrow keys
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            newZ -= 1;
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            newZ += 1;
        } else if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            newX -= 1;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            newX += 1;
        } else {
            // No movement key pressed
            return;
        }
        
        // Check if the new position is valid
        if (this.isValidMove(grid, newX, newZ)) {
            // Move the player
            this.game.level.movePlayer(newX, newZ);
        }
        
        // Clear keys to prevent continuous movement
        if (this.keys['KeyW']) this.keys['KeyW'] = false;
        if (this.keys['ArrowUp']) this.keys['ArrowUp'] = false;
        if (this.keys['KeyS']) this.keys['KeyS'] = false;
        if (this.keys['ArrowDown']) this.keys['ArrowDown'] = false;
        if (this.keys['KeyA']) this.keys['KeyA'] = false;
        if (this.keys['ArrowLeft']) this.keys['ArrowLeft'] = false;
        if (this.keys['KeyD']) this.keys['KeyD'] = false;
        if (this.keys['ArrowRight']) this.keys['ArrowRight'] = false;
    }
    
    // Mouse input handling
    onMouseMove(event) {
        // Update mouse position
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // Check for grid cell hover
        this.checkGridCellHover();
    }
    
    onClick(event) {
        // Only process if in playing state
        if (this.game.state.getState() !== this.game.state.GAME_STATE.PLAYING) {
            return;
        }
        
        // Check for grid cell click
        if (this.selectedGridCell) {
            const gridPos = this.selectedGridCell.userData.gridPosition;
            
            // Get level grid
            const grid = this.game.level.getCurrentGrid();
            if (!grid) return;
            
            // Check if the selected position is valid
            if (this.isValidMove(grid, gridPos.x, gridPos.z)) {
                // Move the player
                this.game.level.movePlayer(gridPos.x, gridPos.z);
            }
        }
        
        // Check for interactive object click
        if (this.hoveredObject && this.hoveredObject.userData.interactive) {
            this.interactWithObject(this.hoveredObject);
        }
    }
    
    // Touch input handling
    onTouchStart(event) {
        event.preventDefault();
        this.isTouchDevice = true;
        
        if (event.touches.length > 0) {
            // Update touch position
            this.touchPosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.touchPosition.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
            
            // Check for grid cell touch
            this.checkGridCellHover(true);
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            // Update touch position
            this.touchPosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.touchPosition.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
            
            // Check for grid cell hover
            this.checkGridCellHover(true);
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        
        // Only process if in playing state
        if (this.game.state.getState() !== this.game.state.GAME_STATE.PLAYING) {
            return;
        }
        
        // Check for grid cell touch
        if (this.selectedGridCell) {
            const gridPos = this.selectedGridCell.userData.gridPosition;
            
            // Get level grid
            const grid = this.game.level.getCurrentGrid();
            if (!grid) return;
            
            // Check if the selected position is valid
            if (this.isValidMove(grid, gridPos.x, gridPos.z)) {
                // Move the player
                this.game.level.movePlayer(gridPos.x, gridPos.z);
            }
        }
    }
    
    onInteractionButtonClick(event) {
        event.preventDefault();
        
        // Only process if in playing state
        if (this.game.state.getState() !== this.game.state.GAME_STATE.PLAYING) {
            return;
        }
        
        // Interact with closest interactive object
        const interactiveObject = this.game.level.getClosestInteractiveObject();
        if (interactiveObject) {
            this.interactWithObject(interactiveObject);
        }
    }
    
    // Raycasting for grid cells and interactive objects
    checkGridCellHover(isTouch = false) {
        // Only process if in playing state
        if (this.game.state.getState() !== this.game.state.GAME_STATE.PLAYING) {
            return;
        }
        
        // Get camera and scene
        const camera = this.game.renderer.getCamera();
        const scene = this.game.renderer.scene;
        
        // Update raycaster
        this.raycaster.setFromCamera(
            isTouch ? this.touchPosition : this.mousePosition, 
            camera
        );
        
        // Get visible grid cells
        const gridCells = [];
        scene.traverse(obj => {
            if (obj.userData && obj.userData.isGridCell) {
                gridCells.push(obj);
            }
        });
        
        // Find intersected objects
        const intersects = this.raycaster.intersectObjects(gridCells, false);
        
        // Reset previous selected cell
        if (this.selectedGridCell) {
            this.selectedGridCell.material.emissive.setHex(0x000000);
            this.selectedGridCell = null;
        }
        
        // Check for new selected cell
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Highlight cell with brighter color
            object.material.emissive.setHex(0x777777);
            // Add pulsing effect
            object.userData.pulseTime = 0;
            object.userData.isPulsing = true;
            this.selectedGridCell = object;
        }
        
        // Get interactive objects
        const interactiveObjects = [];
        scene.traverse(obj => {
            if (obj.userData && obj.userData.interactive) {
                interactiveObjects.push(obj);
            }
        });
        
        // Find intersected interactive objects
        const interactiveIntersects = this.raycaster.intersectObjects(interactiveObjects, true);
        
        // Reset previous hovered object
        if (this.hoveredObject && this.hoveredObject.userData.hoverEffect) {
            this.hoveredObject.userData.hoverEffect(false);
            this.hoveredObject = null;
        }
        
        // Check for new hovered object
        if (interactiveIntersects.length > 0) {
            let object = interactiveIntersects[0].object;
            
            // Find parent with interactive flag
            while (object && !object.userData.interactive) {
                object = object.parent;
            }
            
            if (object && object.userData.interactive) {
                // Apply hover effect
                if (object.userData.hoverEffect) {
                    object.userData.hoverEffect(true);
                }
                this.hoveredObject = object;
            }
        }
    }
    
    // Check if a move is valid on the grid
    isValidMove(grid, x, z) {
        // Check if position is within grid bounds
        if (x < 0 || x >= grid.length || z < 0 || z >= grid[0].length) {
            return false;
        }
        
        // Check if position is walkable
        return grid[x][z] === 1;
    }
    
    // Handle interaction with objects
    interactWithObject(object) {
        if (object.userData.interactionType === 'terminal') {
            // Open terminal
            this.game.state.setState(this.game.state.GAME_STATE.TERMINAL);
            this.game.ui.openTerminal(object.userData.terminalId);
        } else if (object.userData.interactionType === 'oxygen') {
            // Collect oxygen
            this.game.state.addOxygen(object.userData.amount || 20);
            this.game.level.removeInteractiveObject(object);
        } else if (object.userData.interactionType === 'evidence') {
            // Collect evidence
            this.game.state.collectEvidence();
            this.game.level.removeInteractiveObject(object);
        } else if (object.userData.interactionType === 'log') {
            // Discover log
            this.game.state.discoverLog(object.userData.logId);
            this.game.ui.showLog(object.userData.logId);
        } else if (object.userData.interactionType === 'door') {
            // Try to use door
            const roomId = object.userData.targetRoom;
            const doorId = object.userData.doorId;
            
            // Check if door is unlocked
            if (this.game.state.isDoorUnlocked(this.game.state.state.player.currentRoom, doorId)) {
                // Change to new room
                this.game.level.changeRoom(roomId);
            } else {
                // Door is locked
                this.game.ui.showMessage('This door is locked.');
            }
        } else if (object.userData.interactionType === 'escapePod') {
            // Try to use escape pod
            if (this.game.state.state.player.hasEvidence) {
                // Victory with evidence
                this.game.state.setState(this.game.state.GAME_STATE.VICTORY);
                this.game.ui.showVictory(true);
            } else {
                // Victory without evidence
                this.game.state.setState(this.game.state.GAME_STATE.VICTORY);
                this.game.ui.showVictory(false);
            }
        }
    }
}