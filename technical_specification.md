# Complete Technical Specification: "Last Light - Orbital Escape"

## 1. Game Concept Overview

"Last Light - Orbital Escape" is a narrative-driven space survival game where players control Ren, a maintenance engineer trapped in a damaged station module after a corporate experiment gone wrong. The core gameplay loop involves navigating a grid-based environment, managing dwindling oxygen supplies, and solving terminal puzzles to unlock paths to the escape pod. Throughout the experience, players discover text logs revealing why the station was evacuated and Ren was deliberately left behind to destroy evidence.

The visual style employs a minimalist low-poly aesthetic with a carefully curated color palette - emergency red lighting against dark metallic surfaces creates immediate tension, while interactive elements use distinct color coding for intuitive navigation. Rather than aiming for realism, the game leverages stylized simplicity with flat textures and strategic lighting to create atmosphere while maintaining performance. Dynamic shadow effects from emergency lights cast long, eerie patterns that shift as the station slowly rotates, enhancing immersion without heavy rendering demands.

Players progress through a carefully designed 10-15 minute arc, starting with basic movement and interaction tutorials disguised as system reboots, then advancing to increasingly complex terminal puzzles as they navigate deeper into the module. The oxygen system creates natural urgency without frustration, pushing players forward while encouraging exploration for narrative clues. The game culminates in a meaningful choice: escape quickly with just their life, or risk remaining oxygen to collect evidence of corporate wrongdoing.

## 2. Technical Architecture

### Asset Optimization Strategy for Instant Loading

1. **Initial Package Optimization**:
   - Core gameplay bundle under 750KB total
   - Initial load includes only entry room geometry, base lighting, and core mechanics
   - Split into essential components (250KB for core engine, 300KB for initial environment, 200KB for UI/interaction systems)
   - Texture atlasing: single 1024×1024 texture (compressed to ~150KB) for all environmental elements
   - Geometry instancing for repeated elements (panels, doors, debris)

2. **Progressive Enhancement**:
   - Background loading prioritized by player progression path
   - Distance-based loading triggered by player movement (preloading adjacent rooms)
   - Asset priority queue system based on narrative importance
   - Texture streaming with initial low-resolution versions (64×64) upgraded to 256×256 during gameplay

3. **Procedural Generation**:
   - Parametric modeling for station components from minimal base geometry
   - Procedural damage/wear effects using noise functions instead of textures
   - Dynamic lighting calculations rather than baked lightmaps
   - Text content loaded as compressed JSON (5-10KB total)

### Rendering Approach and Optimization

1. **ThreeJS Configuration**:
   - WebGL renderer with precision optimizations: `renderer.precision = "mediump"`
   - Frustum culling aggressively implemented (important with grid layout)
   - Alpha cutoff materials instead of transparent materials when possible
   - Limited draw calls through geometry merging of static elements
   - Occlusion culling using module's natural compartmentalization

2. **Lighting Strategy**:
   - Maximum 2-3 dynamic lights at any time (emergency lights + terminal glow)
   - Pre-calculated ambient occlusion baked into vertex colors
   - Emissive materials for key elements rather than actual light sources
   - Distance-based light attenuation for optimization
   - Fake shadows for non-critical elements (decals instead of shadow mapping)

3. **Shader Optimizations**:
   - Custom minimal fragment shaders for emergency lighting effects
   - Material instancing for repeated elements
   - Limited use of post-processing (subtle film grain only)
   - Optimized particle systems for atmosphere (dust, smoke)
   - LOD (Level of Detail) system for distant objects

### State Management Approach

1. **Game State Architecture**:
   - Centralized state store (< 5KB total)
   - Event-driven system for state changes
   - Immutable state updates for predictable behavior
   - Serializable state for browser refresh persistence
   - Room-based state partitioning (only active room fully simulated)

2. **Interaction System**:
   - Grid-based movement map (boolean matrix)
   - Interactive object registry with simple state machine
   - Terminal puzzle states tracked in compact notation
   - Narrative discovery tracker (binary flags for found/not found)
   - Oxygen system using simple countdown timer with event triggers

### Mobile Compatibility Considerations

1. **Control Scheme**:
   - Adaptive input detection (touch vs. mouse/keyboard)
   - Touch: Tap-to-move navigation grid with highlighted valid moves
   - Desktop: Arrow keys/WASD with optional mouse point-and-click
   - Large tap targets for terminals and interactive objects (minimum 44×44px)
   - Fixed interaction button in corner for consistent experience

2. **Performance Adaptations**:
   - Automatic quality scaling based on device capability detection
   - Simplified lighting on lower-end devices
   - Reduced particle effects on mobile
   - Resolution scaling on high-DPI devices
   - Optional effects toggling in minimal settings menu

3. **Responsive Design**:
   - Dynamic UI positioning based on orientation
   - Text scaling for readability on smaller screens
   - Consistent experience between portrait and landscape
   - Touch zones optimized for one-handed play
   - Visually consistent across device types

## 3. Implementation Plan

### Phase 1: Core Framework (30% of development)
1. **Week 1: Engine Setup & Environment Base**
   - Basic ThreeJS configuration with optimized renderer
   - Grid-based movement system implementation
   - Base environment with modular components
   - Initial room rendering with lighting
   - **Benchmark**: Initial load under 500ms, 60fps on mid-tier devices

2. **Week 2: Interaction & State Management**
   - Interactive object system
   - State management architecture
   - Terminal base functionality
   - Oxygen countdown system
   - **Benchmark**: State updates under 16ms, no frame drops during interactions

### Phase 2: Content Implementation (40% of development)
1. **Week 3: Environment & Puzzles**
   - Complete module layout with all rooms
   - Terminal puzzle implementation (3-4 variations)
   - Door/pathway unlocking mechanics
   - Progressive loading system
   - **Benchmark**: Room transition under 100ms, no visible loading

2. **Week 4: Narrative & Progression**
   - Text log content implementation
   - Tutorial integration
   - Progression tracking
   - End-game choice implementation
   - **Benchmark**: Full playthrough possible, state persistence working

### Phase 3: Polish & Optimization (30% of development)
1. **Week 5: Visual Refinement & Performance**
   - Lighting and atmosphere effects
   - UI polish and readability
   - Mobile adaptation
   - Performance optimization pass
   - **Benchmark**: Stable 60fps on target devices, memory usage under 300MB

2. **Week 6: Testing & Final Optimizations**
   - Cross-browser/device testing
   - Final asset compression pass
   - Bug fixing
   - Performance edge case handling
   - **Benchmark**: Initial load under 400ms, complete stability across test devices

### Critical Path Components
1. **Grid-based Movement System**:
   - Essential for core gameplay
   - Must work flawlessly on both touch and keyboard input
   - Needs to handle blocked paths and interactive objects

2. **Efficient Room Rendering**:
   - Critical for performance
   - Must implement proper culling and LOD
   - Needs to handle smooth transitions

3. **Terminal Puzzle Interface**:
   - Central to progression
   - Must be intuitive and readable
   - Needs to work well on various screen sizes

4. **State Management System**:
   - Foundational for game logic
   - Must handle saves and persistence
   - Needs to be efficient for performance

5. **Oxygen Countdown Mechanism**:
   - Creates necessary tension
   - Must be balanced for gameplay
   - Needs clear UI feedback

## 4. Asset Requirements

### 3D Models (All Low-Poly)
- **Environment Components** (500-800 triangles total):
  - Modular wall sections (straight, corner, damaged variants) - 3 base models
  - Floor and ceiling tiles (2 variants each) - 4 base models
  - Terminal console - 1 model (200 triangles)
  - Doors (standard, emergency) - 2 models (100 triangles each)
  - Debris pieces - 5 small models (20-30 triangles each)
  - Escape pod - 1 model (300 triangles)

- **Interactive Elements** (400 triangles total):
  - Data pad - 1 model (100 triangles)
  - Oxygen tank - 1 model (100 triangles)
  - Evidence container - 1 model (200 triangles)

### Textures
- **Primary Atlas** (1024×1024, compressed):
  - Wall, floor, ceiling textures
  - Terminal interface elements
  - Door and mechanical components
  - Damage and wear patterns

- **UI Elements** (512×512, compressed):
  - Oxygen meter
  - Terminal interface
  - Interaction prompts
  - Menu elements

- **Emissive Maps** (256×256):
  - Emergency lighting
  - Terminal screens
  - Interactive highlights

### Audio (Minimal, Compressed MP3)
- Emergency alarm loop (5 seconds, 64kbps) - ~40KB
- Terminal interaction sounds (3 variations, 1 second each, 64kbps) - ~24KB
- Ambient hum loop (10 seconds, 64kbps) - ~80KB
- Door mechanisms (2 variations, 2 seconds each, 64kbps) - ~32KB
- Oxygen warning beep (1 second, 64kbps) - ~8KB

### Lightweight Alternatives
- Use CSS-based UI instead of textured planes where possible
- Implement procedural textures with noise functions instead of image files
- Generate debris variations procedurally from base components
- Use mathematical gradient functions instead of gradient textures
- Synthesize sound effects with Web Audio API instead of samples
- Use sprite sheets for animation sequences
- Implement text-based terminal screens rather than pre-rendered graphics
- Use vertex coloring instead of textures for simple color variations

This technical specification provides a comprehensive framework for developing "Last Light - Orbital Escape" as an instantly loading web game that meets all the requirements for the 2025 Vibe Coding Game Jam while delivering an engaging narrative experience on both mobile and desktop platforms.
