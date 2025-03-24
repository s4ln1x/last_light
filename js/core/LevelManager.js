import * as THREE from 'three';

export class LevelManager {
    constructor(game) {
        this.game = game;
        
        // Track loaded rooms
        this.loadedRooms = {};
        this.currentRoomId = null;
        
        // Track grid cells for the current room
        this.currentGrid = null;
        this.gridObjects = [];
        
        // Track player representation
        this.playerObject = null;
        
        // Track interactive objects
        this.interactiveObjects = [];
        
        // Room definitions (normally would be loaded from JSON)
        this.roomDefinitions = {
            entry: {
                size: { width: 5, height: 5 }, // Grid size
                grid: [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 0, 1, 0, 0]
                ],
                connections: [
                    {
                        doorId: 'corridor1',
                        position: { x: 2, z: 0 },
                        targetRoom: 'corridor1',
                        targetPosition: { x: 2, z: 4 }
                    }
                ],
                objects: [
                    {
                        type: 'terminal',
                        position: { x: 4, z: 2 },
                        terminalId: 'entry'
                    },
                    {
                        type: 'log',
                        position: { x: 0, z: 2 },
                        logId: 'entry_log1'
                    }
                ],
                startPosition: { x: 2, z: 3 }
            },
            corridor1: {
                size: { width: 5, height: 5 },
                grid: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0],
                    [0, 0, 1, 0, 0],
                    [0, 0, 1, 0, 0],
                    [0, 0, 1, 0, 0]
                ],
                connections: [
                    {
                        doorId: 'entry',
                        position: { x: 2, z: 4 },
                        targetRoom: 'entry',
                        targetPosition: { x: 2, z: 0 }
                    },
                    {
                        doorId: 'lab',
                        position: { x: 2, z: 0 },
                        targetRoom: 'lab',
                        targetPosition: { x: 2, z: 4 },
                        locked: true
                    }
                ],
                objects: [
                    {
                        type: 'oxygen',
                        position: { x: 2, z: 2 },
                        amount: 20
                    }
                ]
            },
            lab: {
                size: { width: 7, height: 7 },
                grid: [
                    [0, 0, 0, 1, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 1, 0],
                    [1, 1, 0, 0, 0, 1, 1],
                    [0, 1, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 1, 0],
                    [0, 0, 0, 1, 0, 0, 0]
                ],
                connections: [
                    {
                        doorId: 'corridor1',
                        position: { x: 3, z: 6 },
                        targetRoom: 'corridor1',
                        targetPosition: { x: 2, z: 0 }
                    },
                    {
                        doorId: 'escapePod',
                        position: { x: 3, z: 0 },
                        targetRoom: 'escapePod',
                        targetPosition: { x: 2, z: 4 },
                        locked: true
                    }
                ],
                objects: [
                    {
                        type: 'terminal',
                        position: { x: 1, z: 3 },
                        terminalId: 'lab'
                    },
                    {
                        type: 'evidence',
                        position: { x: 5, z: 3 }
                    },
                    {
                        type: 'log',
                        position: { x: 1, z: 1 },
                        logId: 'lab_log1'
                    },
                    {
                        type: 'log',
                        position: { x: 5, z: 5 },
                        logId: 'lab_log2'
                    }
                ]
            },
            escapePod: {
                size: { width: 5, height: 5 },
                grid: [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 0, 1, 0, 0]
                ],
                connections: [
                    {
                        doorId: 'lab',
                        position: { x: 2, z: 4 },
                        targetRoom: 'lab',
                        targetPosition: { x: 3, z: 0 }
                    }
                ],
                objects: [
                    {
                        type: 'escapePod',
                        position: { x: 2, z: 1 }
                    },
                    {
                        type: 'log',
                        position: { x: 4, z: 2 },
                        logId: 'escape_log'
                    }
                ]
            }
        };
        
        // Narratives and logs (would normally be loaded from JSON)
        this.logs = {
            entry_log1: {
                title: "System Reboot Required",
                content: "ALERT: Critical system failure detected. Station emergency protocols activated. All personnel evacuated to escape pods. Maintenance engineer required to ensure data purge before final evacuation."
            },
            lab_log1: {
                title: "Project Oversight Report",
                content: "CONFIDENTIAL: Recent experiment results show unstable reaction beyond safety parameters. Management insists on continuing despite objections from safety team. Recommend immediate shutdown and review."
            },
            lab_log2: {
                title: "Security Override",
                content: "Emergency evacuation in progress. All essential personnel accounted for. Maintenance engineer Ren Chen will complete final systems check and evidence disposal. No backup of experiment data permitted."
            },
            escape_log: {
                title: "Director's Final Orders",
                content: "URGENT: Ren - Complete the evidence destruction protocol immediately. Corporate cannot afford another incident investigation. The escape pod is programmed for automatic departure in T-minus 10 minutes. Ensure ALL records are purged before departure."
            }
        };
    }
    
    async loadInitialRoom() {
        // Load the entry room
        await this.loadRoom('entry');
        this.currentRoomId = 'entry';
        
        // Create player representation
        this.createPlayer();
        
        // Position player at start position
        const startPosition = this.roomDefinitions.entry.startPosition;
        this.movePlayer(startPosition.x, startPosition.z);
        
        // Update game state
        this.game.state.setCurrentRoom('entry');
    }
    
    async loadRoom(roomId) {
        // Check if room is already loaded
        if (this.loadedRooms[roomId]) {
            return;
        }
        
        // Get room definition
        const roomDef = this.roomDefinitions[roomId];
        if (!roomDef) {
            console.error(`Room definition not found for ${roomId}`);
            return;
        }
        
        // Create room container
        const roomContainer = new THREE.Group();
        roomContainer.name = `room_${roomId}`;
        
        // Create grid
        const grid = this.createGrid(roomDef.grid, roomId, roomContainer);
        
        // Create walls and floor
        this.createWallsAndFloor(roomDef, roomContainer);
        
        // Create connections (doors)
        this.createConnections(roomDef.connections, roomContainer);
        
        // Create interactive objects
        this.createInteractiveObjects(roomDef.objects, roomContainer);
        
        // Add emergency lights
        this.addEmergencyLights(roomDef, roomContainer);
        
        // Add room to scene but hide it initially
        this.game.renderer.addToScene(roomContainer);
        roomContainer.visible = false;
        
        // Store room
        this.loadedRooms[roomId] = {
            container: roomContainer,
            grid: roomDef.grid,
            connections: roomDef.connections
        };
        
        // Preload connected rooms (not awaiting to avoid blocking)
        for (const connection of roomDef.connections) {
            if (!this.loadedRooms[connection.targetRoom]) {
                this.loadRoom(connection.targetRoom);
            }
        }
    }
    
    createGrid(gridData, roomId, container) {
        // Create grid visualizations for debugging and interaction
        const gridGroup = new THREE.Group();
        gridGroup.name = `grid_${roomId}`;
        
        // Define grid cell size
        const cellSize = 1.0;
        const gridHeight = 0.01; // Just above floor level
        
        // Create grid cells
        for (let x = 0; x < gridData.length; x++) {
            for (let z = 0; z < gridData[x].length; z++) {
                // Only create cells for walkable areas
                if (gridData[x][z] === 1) {
                    // Create grid cell
                    const geometry = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9);
                    const material = new THREE.MeshStandardMaterial({
                        color: 0x333333,
                        transparent: true,
                        opacity: 0.1,
                        emissive: 0x000000
                    });
                    
                    const cell = new THREE.Mesh(geometry, material);
                    cell.rotation.x = -Math.PI / 2; // Rotate to be horizontal
                    cell.position.set(
                        x * cellSize - (gridData.length * cellSize / 2) + cellSize / 2,
                        gridHeight,
                        z * cellSize - (gridData[0].length * cellSize / 2) + cellSize / 2
                    );
                    
                    // Add metadata for interaction
                    cell.userData.isGridCell = true;
                    cell.userData.gridPosition = { x, z };
                    cell.userData.roomId = roomId;
                    
                    // Add to grid group
                    gridGroup.add(cell);
                    this.gridObjects.push(cell);
                }
            }
        }
        
        // Add grid to room container
        container.add(gridGroup);
        
        return gridData;
    }
    
    createWallsAndFloor(roomDef, container) {
        const { width, height } = roomDef.size;
        const grid = roomDef.grid;
        
        // Define cell size
        const cellSize = 1.0;
        
        // Calculate room dimensions
        const roomWidth = width * cellSize;
        const roomHeight = height * cellSize;
        
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        floor.position.y = 0;
        container.add(floor);
        
        // Create ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.7,
            metalness: 0.3
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2; // Rotate to be horizontal and face down
        ceiling.position.y = 2.5; // Ceiling height
        container.add(ceiling);
        
        // Create walls based on grid
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.6,
            metalness: 0.4
        });
        
        // Check each grid cell for walls
        for (let x = 0; x < grid.length; x++) {
            for (let z = 0; z < grid[x].length; z++) {
                const isWalkable = grid[x][z] === 1;
                
                // Skip walkable cells
                if (isWalkable) continue;
                
                // Check if cell should have a wall
                const hasWalkableNeighbor = this.hasWalkableNeighbor(grid, x, z);
                
                // If this non-walkable cell has a walkable neighbor, create a wall
                if (hasWalkableNeighbor) {
                    // Create wall
                    const wallGeometry = new THREE.BoxGeometry(cellSize, 2.5, cellSize);
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    
                    // Position wall
                    wall.position.set(
                        x * cellSize - (grid.length * cellSize / 2) + cellSize / 2,
                        2.5 / 2, // Half the wall height
                        z * cellSize - (grid[0].length * cellSize / 2) + cellSize / 2
                    );
                    
                    container.add(wall);
                }
            }
        }
    }
    
    hasWalkableNeighbor(grid, x, z) {
        // Check each adjacent cell (up, right, down, left)
        const directions = [
            { dx: 0, dz: -1 }, // Up
            { dx: 1, dz: 0 },  // Right
            { dx: 0, dz: 1 },  // Down
            { dx: -1, dz: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            
            // Check if neighbor is within grid bounds
            if (nx >= 0 && nx < grid.length && nz >= 0 && nz < grid[0].length) {
                // Check if neighbor is walkable
                if (grid[nx][nz] === 1) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    createConnections(connections, container) {
        if (!connections) return;
        
        // Define cell size
        const cellSize = 1.0;
        
        // Create doors for each connection
        for (const conn of connections) {
            // Get position in world space
            const worldX = conn.position.x * cellSize - (this.roomDefinitions[container.name.replace('room_', '')].size.width * cellSize / 2) + cellSize / 2;
            const worldZ = conn.position.z * cellSize - (this.roomDefinitions[container.name.replace('room_', '')].size.height * cellSize / 2) + cellSize / 2;
            
            // Create door frame
            const frameGeometry = new THREE.BoxGeometry(cellSize * 1.2, 2.2, 0.1);
            const frameMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                roughness: 0.5,
                metalness: 0.5
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(worldX, 1.1, worldZ);
            
            // Rotate frame based on position
            if (conn.position.z === 0 || conn.position.z === this.roomDefinitions[container.name.replace('room_', '')].size.height - 1) {
                frame.rotation.y = Math.PI / 2;
            }
            
            // Create door
            const doorGeometry = new THREE.PlaneGeometry(cellSize, 2);
            
            // Different material for locked/unlocked doors
            const doorMaterial = new THREE.MeshStandardMaterial({ 
                color: conn.locked ? 0xff3030 : 0x30ff30,
                emissive: conn.locked ? 0xff0000 : 0x00ff00,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(0, 0, 0.06); // Slightly in front of frame
            
            // Add metadata for interaction
            door.userData.interactive = true;
            door.userData.interactionType = 'door';
            door.userData.doorId = conn.doorId;
            door.userData.targetRoom = conn.targetRoom;
            door.userData.targetPosition = conn.targetPosition;
            door.userData.locked = conn.locked;
            
            // Add hover effect
            door.userData.hoverEffect = (isHovered) => {
                door.material.emissiveIntensity = isHovered ? 0.8 : 0.5;
            };
            
            // Add door to frame
            frame.add(door);
            
            // Add to container
            container.add(frame);
            
            // Add to interactive objects
            this.interactiveObjects.push(door);
        }
    }
    
    createInteractiveObjects(objects, container) {
        if (!objects) return;
        
        // Define cell size
        const cellSize = 1.0;
        
        // Create objects
        for (const obj of objects) {
            // Get position in world space
            const worldX = obj.position.x * cellSize - (this.roomDefinitions[container.name.replace('room_', '')].size.width * cellSize / 2) + cellSize / 2;
            const worldZ = obj.position.z * cellSize - (this.roomDefinitions[container.name.replace('room_', '')].size.height * cellSize / 2) + cellSize / 2;
            
            let interactiveObject;
            
            // Create object based on type
            switch (obj.type) {
                case 'terminal':
                    interactiveObject = this.createTerminal(worldX, worldZ, obj.terminalId);
                    break;
                    
                case 'oxygen':
                    interactiveObject = this.createOxygenTank(worldX, worldZ, obj.amount);
                    break;
                    
                case 'evidence':
                    interactiveObject = this.createEvidence(worldX, worldZ);
                    break;
                    
                case 'log':
                    interactiveObject = this.createLogDatapad(worldX, worldZ, obj.logId);
                    break;
                    
                case 'escapePod':
                    interactiveObject = this.createEscapePod(worldX, worldZ);
                    break;
            }
            
            if (interactiveObject) {
                container.add(interactiveObject);
                this.interactiveObjects.push(interactiveObject);
            }
        }
    }
    
    createTerminal(x, z, terminalId) {
        // Create terminal geometry
        const baseGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.8
        });
        const terminal = new THREE.Mesh(baseGeometry, baseMaterial);
        terminal.position.set(x, 0.6, z);
        
        // Create screen
        const screenGeometry = new THREE.PlaneGeometry(0.5, 0.4);
        const screenMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x30ff30,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.2, 0.151); // Position on front of terminal
        
        // Add screen to terminal
        terminal.add(screen);
        
        // Add metadata for interaction
        terminal.userData.interactive = true;
        terminal.userData.interactionType = 'terminal';
        terminal.userData.terminalId = terminalId;
        
        // Add hover effect
        terminal.userData.hoverEffect = (isHovered) => {
            screen.material.emissiveIntensity = isHovered ? 0.8 : 0.5;
        };
        
        return terminal;
    }
    
    createOxygenTank(x, z, amount) {
        // Create oxygen tank
        const tankGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
        const tankMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3030ff,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x0000ff,
            emissiveIntensity: 0.3
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(x, 0.25, z);
        
        // Add metadata for interaction
        tank.userData.interactive = true;
        tank.userData.interactionType = 'oxygen';
        tank.userData.amount = amount || 20;
        
        // Add hover effect
        tank.userData.hoverEffect = (isHovered) => {
            tank.material.emissiveIntensity = isHovered ? 0.6 : 0.3;
        };
        
        return tank;
    }
    
    createEvidence(x, z) {
        // Create evidence container
        const containerGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        const containerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffff30,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        const container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(x, 0.15, z);
        
        // Add metadata for interaction
        container.userData.interactive = true;
        container.userData.interactionType = 'evidence';
        
        // Add hover effect
        container.userData.hoverEffect = (isHovered) => {
            container.material.emissiveIntensity = isHovered ? 0.6 : 0.3;
        };
        
        return container;
    }
    
    createLogDatapad(x, z, logId) {
        // Create datapad
        const padGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.2);
        const padMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x30ffff,
            roughness: 0.4,
            metalness: 0.7,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3
        });
        const datapad = new THREE.Mesh(padGeometry, padMaterial);
        datapad.position.set(x, 0.03, z);
        
        // Add metadata for interaction
        datapad.userData.interactive = true;
        datapad.userData.interactionType = 'log';
        datapad.userData.logId = logId;
        
        // Add hover effect
        datapad.userData.hoverEffect = (isHovered) => {
            datapad.material.emissiveIntensity = isHovered ? 0.6 : 0.3;
        };
        
        return datapad;
    }
    
    createEscapePod(x, z) {
        // Create escape pod
        const podGroup = new THREE.Group();
        podGroup.position.set(x, 0, z);
        
        // Pod base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.3,
            metalness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        podGroup.add(base);
        
        // Pod capsule
        const capsuleGeometry = new THREE.CapsuleGeometry(0.7, 0.8, 8, 8);
        const capsuleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });
        const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
        capsule.rotation.x = Math.PI / 2;
        capsule.position.y = 0.9;
        podGroup.add(capsule);
        
        // Pod window
        const windowGeometry = new THREE.CircleGeometry(0.3, 16);
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x30ffff,
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0x00ffff,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.7
        });
        const podWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        podWindow.position.set(0, 0.9, 0.5);
        podGroup.add(podWindow);
        
        // Add metadata for interaction
        podGroup.userData.interactive = true;
        podGroup.userData.interactionType = 'escapePod';
        
        // Add hover effect
        podGroup.userData.hoverEffect = (isHovered) => {
            podWindow.material.emissiveIntensity = isHovered ? 0.7 : 0.4;
        };
        
        return podGroup;
    }
    
    createPlayer() {
        // Create player representation
        const playerGeometry = new THREE.CapsuleGeometry(0.3, 0.5, 4, 8);
        const playerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333399,
            emissive: 0x0000ff,
            emissiveIntensity: 0.3
        });
        this.playerObject = new THREE.Mesh(playerGeometry, playerMaterial);
        
        // Set initial position (will be updated by movePlayer)
        this.playerObject.position.y = 0.65; // Half player height
        
        // Add to scene
        this.game.renderer.addToScene(this.playerObject);
    }
    
    addEmergencyLights(roomDef, container) {
        // Add emergency lights based on room size
        const { width, height } = roomDef.size;
        
        // Add light to each corner (if room is large enough)
        if (width >= 5 && height >= 5) {
            // Top-left
            const light1 = this.game.renderer.createEmergencyLight(new THREE.Vector3(
                -width/2 + 1,
                2.4, // Near ceiling
                -height/2 + 1
            ));
            
            // Top-right
            const light2 = this.game.renderer.createEmergencyLight(new THREE.Vector3(
                width/2 - 1,
                2.4,
                -height/2 + 1
            ));
            
            // Bottom-left
            const light3 = this.game.renderer.createEmergencyLight(new THREE.Vector3(
                -width/2 + 1,
                2.4,
                height/2 - 1
            ));
            
            // Bottom-right
            const light4 = this.game.renderer.createEmergencyLight(new THREE.Vector3(
                width/2 - 1,
                2.4,
                height/2 - 1
            ));
            
            // Add lights to container (they'll be properly activated when room is shown)
            container.add(light1);
            container.add(light2);
            container.add(light3);
            container.add(light4);
        } else {
            // Smaller room - just add one central light
            const light = this.game.renderer.createEmergencyLight(new THREE.Vector3(
                0,
                2.4,
                0
            ));
            
            container.add(light);
        }
    }
    
    changeRoom(roomId) {
        // Check if room is loaded
        if (!this.loadedRooms[roomId]) {
            console.error(`Cannot change to room ${roomId} - not loaded`);
            return;
        }
        
        // Get connection details
        const connections = this.loadedRooms[this.currentRoomId].connections;
        const connection = connections.find(c => c.targetRoom === roomId);
        
        if (!connection) {
            console.error(`No connection from ${this.currentRoomId} to ${roomId}`);
            return;
        }
        
        // Hide current room
        if (this.currentRoomId && this.loadedRooms[this.currentRoomId]) {
            this.loadedRooms[this.currentRoomId].container.visible = false;
        }
        
        // Show new room
        this.loadedRooms[roomId].container.visible = true;
        
        // Update current room
        this.currentRoomId = roomId;
        this.currentGrid = this.loadedRooms[roomId].grid;
        
        // Position player at connection point
        if (connection.targetPosition) {
            this.movePlayer(connection.targetPosition.x, connection.targetPosition.z);
        }
        
        // Update game state
        this.game.state.setCurrentRoom(roomId);
        
        // Preload connected rooms
        const newConnections = this.loadedRooms[roomId].connections;
        for (const conn of newConnections) {
            if (!this.loadedRooms[conn.targetRoom]) {
                this.loadRoom(conn.targetRoom);
            }
        }
    }
    
    movePlayer(x, z) {
        if (!this.playerObject) return;
        
        // Update player position in world space
        const roomDef = this.roomDefinitions[this.currentRoomId];
        const cellSize = 1.0;
        
        const worldX = x * cellSize - (roomDef.size.width * cellSize / 2) + cellSize / 2;
        const worldZ = z * cellSize - (roomDef.size.height * cellSize / 2) + cellSize / 2;
        
        this.playerObject.position.x = worldX;
        this.playerObject.position.z = worldZ;
        
        // Update camera to follow player
        const camera = this.game.renderer.getCamera();
        camera.position.x = worldX;
        camera.position.z = worldZ + 1; // Position camera slightly behind player
        camera.lookAt(worldX, 1.0, worldZ - 2); // Look ahead of player
        
        // Update player position in state
        this.game.state.setPlayerPosition(x, z);
    }
    
    getCurrentGrid() {
        return this.currentGrid;
    }
    
    getClosestInteractiveObject() {
        if (!this.playerObject) return null;
        
        let closest = null;
        let closestDistance = 1.5; // Maximum interaction distance
        
        // Check all interactive objects
        for (const obj of this.interactiveObjects) {
            // Skip objects that aren't in the current room
            if (!obj.parent || !obj.parent.parent || 
                (obj.parent.parent.name !== `room_${this.currentRoomId}` && 
                 obj.parent.name !== `room_${this.currentRoomId}`)) {
                continue;
            }
            
            // Get world position
            const objPosition = new THREE.Vector3();
            obj.getWorldPosition(objPosition);
            
            // Calculate distance (horizontal only)
            const playerPos = this.playerObject.position.clone();
            objPosition.y = playerPos.y; // Ignore vertical difference
            const distance = playerPos.distanceTo(objPosition);
            
            // Update closest
            if (distance < closestDistance) {
                closest = obj;
                closestDistance = distance;
            }
        }
        
        return closest;
    }
    
    removeInteractiveObject(object) {
        // Remove from scene
        if (object.parent) {
            object.parent.remove(object);
        }
        
        // Remove from interactive objects list
        const index = this.interactiveObjects.indexOf(object);
        if (index !== -1) {
            this.interactiveObjects.splice(index, 1);
        }
    }
    
    update(deltaTime) {
        // Update objects in current room
        if (this.currentRoomId && this.loadedRooms[this.currentRoomId]) {
            // Add ambient effects like flickering lights
            this.updateEmergencyLights(deltaTime);
        }
    }
    
    updateEmergencyLights(deltaTime) {
        // Simulate flickering emergency lights
        const container = this.loadedRooms[this.currentRoomId].container;
        
        // Find all emergency lights in the current room
        container.traverse(obj => {
            if (obj.type === 'PointLight' && obj.color.r > 0.5 && obj.color.g < 0.3) {
                // Emergency light found - create flickering effect
                if (Math.random() < 0.05) { // 5% chance per frame
                    // Random intensity
                    const flicker = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
                    obj.intensity = flicker;
                    
                    // Also update bulb emissive intensity if present
                    obj.children.forEach(child => {
                        if (child.material && child.material.emissiveIntensity) {
                            child.material.emissiveIntensity = flicker * 0.8;
                        }
                    });
                }
            }
        });
    }
}