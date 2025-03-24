export class StateManager {
    constructor() {
        // Game state constants
        this.GAME_STATE = {
            LOADING: 'loading',
            PLAYING: 'playing',
            TERMINAL: 'terminal',
            GAME_OVER: 'game_over',
            VICTORY: 'victory'
        };
        
        // Core game state
        this.state = {
            // Current game state
            currentState: this.GAME_STATE.LOADING,
            
            // Player state
            player: {
                position: { x: 0, z: 0 },
                currentRoom: 'entry',
                oxygen: 100, // Percentage
                hasEvidence: false
            },
            
            // Environment state
            rooms: {
                // Each room will be populated as discovered
                entry: {
                    visited: false,
                    unlockedDoors: ['corridor1'],
                    discoveredLogs: []
                }
            },
            
            // Puzzle states
            terminals: {
                entry: {
                    solved: false,
                    currentPuzzle: null
                }
            },
            
            // Narrative tracking
            discoveredLogs: [], // IDs of found logs
            
            // Game progression
            totalOxygenCollected: 0, // Additional oxygen tanks found
            evidenceCollected: 0, // Number of evidence pieces (for multiple endings)
            gameTime: 0 // Time played in seconds
        };
        
        // Event listeners
        this.eventListeners = {};
        
        // Oxygen depletion rate (percentage per second)
        this.oxygenDepletionRate = 1; // 1% per second = 100 seconds of oxygen
        
        // Is oxygen countdown active
        this.oxygenCountdownActive = false;
    }
    
    init() {
        // Load saved state from localStorage if available
        this.loadState();
        
        // Set up default state if fresh game
        if (this.state.currentState === this.GAME_STATE.LOADING) {
            this.resetState();
        }
    }
    
    resetState() {
        // Reset to initial values
        this.state.player.position = { x: 0, z: 0 };
        this.state.player.currentRoom = 'entry';
        this.state.player.oxygen = 100;
        this.state.player.hasEvidence = false;
        
        this.state.rooms = {
            entry: {
                visited: false,
                unlockedDoors: ['corridor1'],
                discoveredLogs: []
            }
        };
        
        this.state.terminals = {
            entry: {
                solved: false,
                currentPuzzle: null
            }
        };
        
        this.state.discoveredLogs = [];
        this.state.totalOxygenCollected = 0;
        this.state.evidenceCollected = 0;
        this.state.gameTime = 0;
    }
    
    saveState() {
        // Save current state to localStorage
        localStorage.setItem('lastLightSaveState', JSON.stringify(this.state));
    }
    
    loadState() {
        // Load state from localStorage
        const savedState = localStorage.getItem('lastLightSaveState');
        if (savedState) {
            try {
                this.state = JSON.parse(savedState);
            } catch (e) {
                console.error('Failed to parse saved state:', e);
                this.resetState();
            }
        }
    }
    
    update(deltaTime) {
        // Update game time
        this.state.gameTime += deltaTime;
        
        // Update oxygen level if countdown is active
        if (this.oxygenCountdownActive) {
            this.state.player.oxygen -= this.oxygenDepletionRate * deltaTime;
            
            // Clamp oxygen level
            this.state.player.oxygen = Math.max(0, this.state.player.oxygen);
            
            // Update UI
            this.trigger('oxygenUpdated', this.state.player.oxygen);
            
            // Check for oxygen depletion
            if (this.state.player.oxygen <= 0) {
                this.setState(this.GAME_STATE.GAME_OVER);
                this.trigger('oxygenDepleted');
            }
        }
        
        // Save state periodically (every 10 seconds)
        if (Math.floor(this.state.gameTime) % 10 === 0 && 
            Math.floor(this.state.gameTime - deltaTime) % 10 !== 0) {
            this.saveState();
        }
    }
    
    setState(newState) {
        const oldState = this.state.currentState;
        this.state.currentState = newState;
        
        // Trigger state change event
        this.trigger('stateChanged', { oldState, newState });
    }
    
    getState() {
        return this.state.currentState;
    }
    
    setPlayerPosition(x, z) {
        this.state.player.position.x = x;
        this.state.player.position.z = z;
        this.trigger('playerMoved', this.state.player.position);
    }
    
    setCurrentRoom(roomId) {
        const oldRoom = this.state.player.currentRoom;
        this.state.player.currentRoom = roomId;
        
        // Mark room as visited
        if (!this.state.rooms[roomId]) {
            this.state.rooms[roomId] = {
                visited: true,
                unlockedDoors: [],
                discoveredLogs: []
            };
        } else {
            this.state.rooms[roomId].visited = true;
        }
        
        // Trigger room changed event
        this.trigger('roomChanged', { oldRoom, newRoom: roomId });
    }
    
    // Oxygen methods
    startOxygenCountdown() {
        this.oxygenCountdownActive = true;
        this.trigger('oxygenCountdownStarted');
    }
    
    pauseOxygenCountdown() {
        this.oxygenCountdownActive = false;
        this.trigger('oxygenCountdownPaused');
    }
    
    addOxygen(amount) {
        this.state.player.oxygen = Math.min(100, this.state.player.oxygen + amount);
        this.state.totalOxygenCollected += amount;
        this.trigger('oxygenUpdated', this.state.player.oxygen);
    }
    
    // Evidence methods
    collectEvidence() {
        this.state.player.hasEvidence = true;
        this.state.evidenceCollected++;
        this.trigger('evidenceCollected', this.state.evidenceCollected);
    }
    
    // Log discovery methods
    discoverLog(logId) {
        if (!this.state.discoveredLogs.includes(logId)) {
            this.state.discoveredLogs.push(logId);
            
            // Add to room's discovered logs
            const roomId = this.state.player.currentRoom;
            if (!this.state.rooms[roomId].discoveredLogs.includes(logId)) {
                this.state.rooms[roomId].discoveredLogs.push(logId);
            }
            
            this.trigger('logDiscovered', logId);
        }
    }
    
    // Terminal methods
    setTerminalSolved(terminalId, solved = true) {
        if (!this.state.terminals[terminalId]) {
            this.state.terminals[terminalId] = {
                solved: solved,
                currentPuzzle: null
            };
        } else {
            this.state.terminals[terminalId].solved = solved;
        }
        
        this.trigger('terminalStateChanged', {
            terminalId,
            solved
        });
    }
    
    // Door methods
    unlockDoor(roomId, doorId) {
        if (!this.state.rooms[roomId]) {
            this.state.rooms[roomId] = {
                visited: false,
                unlockedDoors: [doorId],
                discoveredLogs: []
            };
        } else if (!this.state.rooms[roomId].unlockedDoors.includes(doorId)) {
            this.state.rooms[roomId].unlockedDoors.push(doorId);
        }
        
        this.trigger('doorUnlocked', { roomId, doorId });
    }
    
    isDoorUnlocked(roomId, doorId) {
        return this.state.rooms[roomId] && 
               this.state.rooms[roomId].unlockedDoors.includes(doorId);
    }
    
    // Event system methods
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }
    
    trigger(event, data) {
        if (!this.eventListeners[event]) return;
        
        for (const callback of this.eventListeners[event]) {
            callback(data);
        }
    }
}