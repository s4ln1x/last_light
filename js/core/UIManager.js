export class UIManager {
    constructor(game) {
        this.game = game;
        
        // UI elements
        this.elements = {
            loadingScreen: null,
            oxygenMeter: null,
            oxygenBar: null,
            interactionButton: null,
            terminal: null,
            messageBox: null
        };
        
        // Terminal state
        this.terminalState = {
            currentId: null,
            currentPuzzle: null,
            commandHistory: []
        };
        
        // Terminal puzzles (normally would be loaded from JSON)
        this.terminalPuzzles = {
            entry: {
                type: 'password',
                prompt: 'EMERGENCY SYSTEM REBOOT\n\nEnter maintenance password to unlock corridor access:',
                answer: 'override',
                hint: 'Hint: Standard emergency protocol code (8 letters)',
                successMessage: 'Access granted. Corridor door unlocked.',
                rewardDoorId: 'corridor1'
            },
            lab: {
                type: 'sequence',
                prompt: 'LABORATORY CONTAINMENT SYSTEM\n\nExecute correct shutdown sequence to unlock escape pod access:',
                sequence: ['purge', 'verify', 'confirm'],
                currentStep: 0,
                hints: [
                    'Hint: First step involves removing all traces',
                    'Hint: Second step requires validation',
                    'Hint: Final step needs executive approval'
                ],
                successMessage: 'Shutdown sequence completed. Escape pod access granted.',
                rewardDoorId: 'escapePod'
            }
        };
        
        // Message timeout
        this.messageTimeout = null;
    }
    
    init() {
        // Get UI elements
        this.elements.loadingScreen = document.getElementById('loading');
        this.elements.oxygenMeter = document.getElementById('oxygen-meter');
        this.elements.oxygenBar = document.getElementById('oxygen-bar');
        this.elements.interactionButton = document.getElementById('interaction-button');
        this.elements.terminal = document.getElementById('terminal');
        
        // Create message box
        this.createMessageBox();
        
        // Register event listeners
        this.game.state.on('oxygenUpdated', this.updateOxygenMeter.bind(this));
        this.game.state.on('stateChanged', this.handleStateChange.bind(this));
        this.game.state.on('logDiscovered', this.handleLogDiscovered.bind(this));
        
        // Show oxygen meter
        this.elements.oxygenMeter.style.display = 'block';
        this.updateOxygenMeter(this.game.state.state.player.oxygen);
        
        // Setup terminal input
        this.setupTerminalInput();
    }
    
    createMessageBox() {
        // Create message box element
        const messageBox = document.createElement('div');
        messageBox.id = 'message-box';
        messageBox.style.position = 'absolute';
        messageBox.style.top = '50%';
        messageBox.style.left = '50%';
        messageBox.style.transform = 'translate(-50%, -50%)';
        messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageBox.style.color = '#ff3030';
        messageBox.style.padding = '20px';
        messageBox.style.borderRadius = '5px';
        messageBox.style.maxWidth = '80%';
        messageBox.style.textAlign = 'center';
        messageBox.style.fontFamily = 'monospace';
        messageBox.style.display = 'none';
        messageBox.style.zIndex = '100';
        
        // Add to DOM
        document.body.appendChild(messageBox);
        
        // Store reference
        this.elements.messageBox = messageBox;
    }
    
    setupTerminalInput() {
        // Set up terminal input
        this.elements.terminal.innerHTML = '<div id="terminal-output"></div>' +
            '<div id="terminal-input-line">' +
            '<span id="terminal-prompt">></span> ' +
            '<input type="text" id="terminal-input" autocomplete="off">' +
            '</div>';
        
        // Get input element
        const input = document.getElementById('terminal-input');
        
        // Add event listener
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                // Get command
                const command = input.value.trim().toLowerCase();
                
                // Add to history
                this.terminalState.commandHistory.push(command);
                
                // Process command
                this.processTerminalCommand(command);
                
                // Clear input
                input.value = '';
            }
        });
    }
    
    updateOxygenMeter(oxygen) {
        // Update oxygen bar width
        this.elements.oxygenBar.style.width = `${oxygen}%`;
        
        // Change color based on oxygen level
        if (oxygen <= 20) {
            this.elements.oxygenBar.style.backgroundColor = '#ff0000';
        } else if (oxygen <= 50) {
            this.elements.oxygenBar.style.backgroundColor = '#ffff00';
        } else {
            this.elements.oxygenBar.style.backgroundColor = '#ff3030';
        }
    }
    
    handleStateChange(stateData) {
        const { oldState, newState } = stateData;
        
        // Handle state changes
        switch (newState) {
            case this.game.state.GAME_STATE.PLAYING:
                // Hide terminal if coming from terminal state
                if (oldState === this.game.state.GAME_STATE.TERMINAL) {
                    this.elements.terminal.style.display = 'none';
                    
                    // Resume oxygen countdown
                    this.game.state.startOxygenCountdown();
                }
                break;
                
            case this.game.state.GAME_STATE.TERMINAL:
                // Show terminal
                this.elements.terminal.style.display = 'block';
                
                // Pause oxygen countdown while in terminal
                this.game.state.pauseOxygenCountdown();
                break;
                
            case this.game.state.GAME_STATE.GAME_OVER:
                // Show game over message
                this.showMessage('OXYGEN DEPLETED - MISSION FAILED', true);
                break;
                
            case this.game.state.GAME_STATE.VICTORY:
                // Victory is handled by showVictory method
                break;
        }
    }
    
    handleLogDiscovered(logId) {
        // Show log message
        this.showLog(logId);
    }
    
    showMessage(message, persistent = false) {
        // Clear previous timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        
        // Set message
        this.elements.messageBox.textContent = message;
        this.elements.messageBox.style.display = 'block';
        
        // Auto-hide message if not persistent
        if (!persistent) {
            this.messageTimeout = setTimeout(() => {
                this.elements.messageBox.style.display = 'none';
            }, 3000);
        }
    }
    
    hideMessage() {
        // Clear timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        
        // Hide message
        this.elements.messageBox.style.display = 'none';
    }
    
    showLog(logId) {
        // Get log data
        const log = this.game.level.logs[logId];
        if (!log) return;
        
        // Show as message
        this.showMessage(`${log.title}\n\n${log.content}`, true);
        
        // Add dismiss button
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'CLOSE';
        dismissButton.style.marginTop = '20px';
        dismissButton.style.padding = '5px 10px';
        dismissButton.style.backgroundColor = '#ff3030';
        dismissButton.style.color = '#000';
        dismissButton.style.border = 'none';
        dismissButton.style.cursor = 'pointer';
        
        // Clear previous buttons
        const existingButton = this.elements.messageBox.querySelector('button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Add button
        this.elements.messageBox.appendChild(dismissButton);
        
        // Add event listener
        dismissButton.addEventListener('click', () => {
            this.hideMessage();
        });
    }
    
    openTerminal(terminalId) {
        // Get terminal data
        const terminalPuzzle = this.terminalPuzzles[terminalId];
        if (!terminalPuzzle) {
            console.error(`Terminal puzzle not found for ${terminalId}`);
            return;
        }
        
        // Check if terminal is already solved
        if (this.game.state.state.terminals[terminalId] && 
            this.game.state.state.terminals[terminalId].solved) {
            // Terminal already solved - show success message
            const output = document.getElementById('terminal-output');
            output.innerHTML = `<div class="terminal-line"><span class="success">ACCESS ALREADY GRANTED</span></div>`;
            
            // Add exit option
            output.innerHTML += `<div class="terminal-line">Type 'exit' to close terminal</div>`;
            
            // Update terminal state
            this.terminalState.currentId = terminalId;
            this.terminalState.currentPuzzle = null;
            
            return;
        }
        
        // Set terminal state
        this.terminalState.currentId = terminalId;
        this.terminalState.currentPuzzle = { ...terminalPuzzle };
        
        // Display puzzle
        const output = document.getElementById('terminal-output');
        
        // Clear previous content
        output.innerHTML = '';
        
        // Add prompt
        output.innerHTML += `<div class="terminal-line">${terminalPuzzle.prompt.replace(/\n/g, '<br>')}</div>`;
        
        // Add type-specific content
        if (terminalPuzzle.type === 'password') {
            output.innerHTML += `<div class="terminal-line">${terminalPuzzle.hint}</div>`;
        } else if (terminalPuzzle.type === 'sequence') {
            output.innerHTML += `<div class="terminal-line">Current step: ${terminalPuzzle.currentStep + 1} of ${terminalPuzzle.sequence.length}</div>`;
            output.innerHTML += `<div class="terminal-line">${terminalPuzzle.hints[terminalPuzzle.currentStep]}</div>`;
        }
        
        // Add help text
        output.innerHTML += `<div class="terminal-line">Type 'help' for commands</div>`;
        
        // Focus input
        document.getElementById('terminal-input').focus();
    }
    
    processTerminalCommand(command) {
        // Get terminal output element
        const output = document.getElementById('terminal-output');
        
        // Add command to output
        output.innerHTML += `<div class="terminal-line"><span class="prompt">></span> ${command}</div>`;
        
        // Process command
        if (command === 'help') {
            // Show help
            output.innerHTML += `<div class="terminal-line">Available commands:</div>`;
            output.innerHTML += `<div class="terminal-line">- help: Show this help</div>`;
            output.innerHTML += `<div class="terminal-line">- exit: Close terminal</div>`;
            output.innerHTML += `<div class="terminal-line">- hint: Get a hint</div>`;
            
            if (this.terminalState.currentPuzzle && this.terminalState.currentPuzzle.type === 'sequence') {
                output.innerHTML += `<div class="terminal-line">- status: Show current sequence status</div>`;
            }
        } else if (command === 'exit') {
            // Exit terminal
            this.game.state.setState(this.game.state.GAME_STATE.PLAYING);
        } else if (command === 'hint') {
            // Show hint
            if (this.terminalState.currentPuzzle) {
                if (this.terminalState.currentPuzzle.type === 'password') {
                    output.innerHTML += `<div class="terminal-line">${this.terminalState.currentPuzzle.hint}</div>`;
                } else if (this.terminalState.currentPuzzle.type === 'sequence') {
                    const currentStep = this.terminalState.currentPuzzle.currentStep;
                    output.innerHTML += `<div class="terminal-line">${this.terminalState.currentPuzzle.hints[currentStep]}</div>`;
                }
            }
        } else if (command === 'status' && 
                  this.terminalState.currentPuzzle && 
                  this.terminalState.currentPuzzle.type === 'sequence') {
            // Show sequence status
            const currentStep = this.terminalState.currentPuzzle.currentStep;
            const totalSteps = this.terminalState.currentPuzzle.sequence.length;
            
            output.innerHTML += `<div class="terminal-line">Current step: ${currentStep + 1} of ${totalSteps}</div>`;
            
            // Show completed steps
            if (currentStep > 0) {
                output.innerHTML += `<div class="terminal-line">Completed steps:</div>`;
                for (let i = 0; i < currentStep; i++) {
                    output.innerHTML += `<div class="terminal-line">- Step ${i + 1}: <span class="success">${this.terminalState.currentPuzzle.sequence[i]}</span></div>`;
                }
            }
        } else {
            // Process puzzle-specific command
            if (this.terminalState.currentPuzzle) {
                if (this.terminalState.currentPuzzle.type === 'password') {
                    // Check password
                    if (command === this.terminalState.currentPuzzle.answer) {
                        // Correct password
                        output.innerHTML += `<div class="terminal-line"><span class="success">${this.terminalState.currentPuzzle.successMessage}</span></div>`;
                        
                        // Unlock door
                        const doorId = this.terminalState.currentPuzzle.rewardDoorId;
                        this.game.state.unlockDoor(this.game.state.state.player.currentRoom, doorId);
                        
                        // Mark terminal as solved
                        this.game.state.setTerminalSolved(this.terminalState.currentId, true);
                        
                        // Add exit option
                        output.innerHTML += `<div class="terminal-line">Type 'exit' to close terminal</div>`;
                        
                        // Clear puzzle
                        this.terminalState.currentPuzzle = null;
                    } else {
                        // Incorrect password
                        output.innerHTML += `<div class="terminal-line"><span class="error">ACCESS DENIED</span></div>`;
                    }
                } else if (this.terminalState.currentPuzzle.type === 'sequence') {
                    // Check sequence step
                    const currentStep = this.terminalState.currentPuzzle.currentStep;
                    const currentCommand = this.terminalState.currentPuzzle.sequence[currentStep];
                    
                    if (command === currentCommand) {
                        // Correct step
                        output.innerHTML += `<div class="terminal-line"><span class="success">Step ${currentStep + 1} completed successfully.</span></div>`;
                        
                        // Increment step
                        this.terminalState.currentPuzzle.currentStep++;
                        
                        // Check if sequence is complete
                        if (this.terminalState.currentPuzzle.currentStep >= this.terminalState.currentPuzzle.sequence.length) {
                            // Sequence complete
                            output.innerHTML += `<div class="terminal-line"><span class="success">${this.terminalState.currentPuzzle.successMessage}</span></div>`;
                            
                            // Unlock door
                            const doorId = this.terminalState.currentPuzzle.rewardDoorId;
                            this.game.state.unlockDoor(this.game.state.state.player.currentRoom, doorId);
                            
                            // Mark terminal as solved
                            this.game.state.setTerminalSolved(this.terminalState.currentId, true);
                            
                            // Add exit option
                            output.innerHTML += `<div class="terminal-line">Type 'exit' to close terminal</div>`;
                            
                            // Clear puzzle
                            this.terminalState.currentPuzzle = null;
                        } else {
                            // Show next step
                            const nextStep = this.terminalState.currentPuzzle.currentStep;
                            output.innerHTML += `<div class="terminal-line">Next step: ${nextStep + 1} of ${this.terminalState.currentPuzzle.sequence.length}</div>`;
                            output.innerHTML += `<div class="terminal-line">${this.terminalState.currentPuzzle.hints[nextStep]}</div>`;
                        }
                    } else {
                        // Incorrect step
                        output.innerHTML += `<div class="terminal-line"><span class="error">INVALID COMMAND</span></div>`;
                    }
                }
            } else {
                // No active puzzle
                output.innerHTML += `<div class="terminal-line"><span class="error">Unknown command: ${command}</span></div>`;
            }
        }
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
    }
    
    showVictory(withEvidence) {
        // Hide other UI elements
        this.elements.oxygenMeter.style.display = 'none';
        this.elements.interactionButton.style.display = 'none';
        
        // Create victory screen
        const victoryScreen = document.createElement('div');
        victoryScreen.style.position = 'absolute';
        victoryScreen.style.top = '0';
        victoryScreen.style.left = '0';
        victoryScreen.style.width = '100%';
        victoryScreen.style.height = '100%';
        victoryScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        victoryScreen.style.color = '#ff3030';
        victoryScreen.style.display = 'flex';
        victoryScreen.style.flexDirection = 'column';
        victoryScreen.style.justifyContent = 'center';
        victoryScreen.style.alignItems = 'center';
        victoryScreen.style.padding = '20px';
        victoryScreen.style.textAlign = 'center';
        victoryScreen.style.fontFamily = 'monospace';
        victoryScreen.style.zIndex = '200';
        
        // Add content based on ending
        let content = '';
        
        if (withEvidence) {
            content = `
                <h1>ESCAPE SUCCESSFUL</h1>
                <p>You managed to escape with evidence of corporate wrongdoing.</p>
                <p>Your whistleblowing will lead to investigations and justice.</p>
                <h2>TRUE ENDING</h2>
                <p>Time Survived: ${Math.floor(this.game.state.state.gameTime)} seconds</p>
                <p>Oxygen Remaining: ${Math.floor(this.game.state.state.player.oxygen)}%</p>
            `;
        } else {
            content = `
                <h1>ESCAPE SUCCESSFUL</h1>
                <p>You managed to escape with your life, but left the evidence behind.</p>
                <p>The corporation's secrets remain safe... for now.</p>
                <h2>NEUTRAL ENDING</h2>
                <p>Time Survived: ${Math.floor(this.game.state.state.gameTime)} seconds</p>
                <p>Oxygen Remaining: ${Math.floor(this.game.state.state.player.oxygen)}%</p>
            `;
        }
        
        // Add restart button
        content += `
            <button id="restart-button" style="margin-top: 30px; padding: 10px 20px; background-color: #ff3030; color: #000; border: none; cursor: pointer;">RESTART MISSION</button>
        `;
        
        // Set content
        victoryScreen.innerHTML = content;
        
        // Add to DOM
        document.body.appendChild(victoryScreen);
        
        // Add event listener for restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            // Reload page to restart
            window.location.reload();
        });
    }
    
    update(deltaTime) {
        // Update UI elements as needed
        
        // Check if player is near interactive object for mobile
        if (this.game.input.isTouchDevice && 
            this.game.state.getState() === this.game.state.GAME_STATE.PLAYING) {
            // Get closest interactive object
            const interactiveObject = this.game.level.getClosestInteractiveObject();
            
            // Show/hide interaction button
            if (interactiveObject) {
                this.elements.interactionButton.style.display = 'flex';
                
                // Set button text based on interaction type
                if (interactiveObject.userData.interactionType === 'terminal') {
                    this.elements.interactionButton.textContent = 'USE';
                } else if (interactiveObject.userData.interactionType === 'oxygen') {
                    this.elements.interactionButton.textContent = 'TAKE';
                } else if (interactiveObject.userData.interactionType === 'evidence') {
                    this.elements.interactionButton.textContent = 'TAKE';
                } else if (interactiveObject.userData.interactionType === 'log') {
                    this.elements.interactionButton.textContent = 'READ';
                } else if (interactiveObject.userData.interactionType === 'door') {
                    this.elements.interactionButton.textContent = 'OPEN';
                } else if (interactiveObject.userData.interactionType === 'escapePod') {
                    this.elements.interactionButton.textContent = 'ESCAPE';
                }
            } else {
                this.elements.interactionButton.style.display = 'none';
            }
        }
        
        // Low oxygen warning
        if (this.game.state.state.player.oxygen <= 20 && 
            this.game.state.getState() === this.game.state.GAME_STATE.PLAYING) {
            // Flash oxygen meter
            const flash = Math.sin(this.game.state.state.gameTime * 5) > 0;
            this.elements.oxygenMeter.style.borderColor = flash ? '#ff0000' : '#ff3030';
        } else {
            this.elements.oxygenMeter.style.borderColor = '#ff3030';
        }
    }
}