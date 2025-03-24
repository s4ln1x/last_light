import * as THREE from 'three';

export class RenderManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Track active lights for optimization
        this.activeLights = [];
        this.maxLights = 3;
        
        // Objects for performance tracking
        this.stats = {
            drawCalls: 0,
            triangles: 0
        };
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Set up camera with good default values for enclosed spaces
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            20 // Far clipping plane - kept small for performance
        );
        this.camera.position.set(0, 1.6, 0); // Default human height
        
        // Set up renderer with optimizations as specified
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Disable antialiasing for performance
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
        this.renderer.precision = 'mediump'; // Medium precision for performance
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = false; // Disable shadow mapping initially
        
        // Add renderer to DOM
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Initial ambient light (dim)
        const ambientLight = new THREE.AmbientLight(0x111111);
        this.scene.add(ambientLight);
        
        // Create frustum for culling
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    addLight(light) {
        // Enforce maximum light count for performance
        if (this.activeLights.length >= this.maxLights) {
            console.warn('Maximum light count reached. Not adding new light.');
            return false;
        }
        
        this.scene.add(light);
        this.activeLights.push(light);
        return true;
    }
    
    removeLight(light) {
        const index = this.activeLights.indexOf(light);
        if (index !== -1) {
            this.activeLights.splice(index, 1);
            this.scene.remove(light);
            return true;
        }
        return false;
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    updateFrustum() {
        // Update the frustum culling matrix
        this.camera.updateMatrixWorld();
        this.frustumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);
    }
    
    isInView(object) {
        // Check if object is in view for culling
        if (!object.geometry || !object.geometry.boundingSphere) {
            return true; // No geometry to check
        }
        
        // Get world position
        const worldPos = object.getWorldPosition(new THREE.Vector3());
        
        // Check against frustum
        return this.frustum.containsPoint(worldPos);
    }
    
    render() {
        // Update frustum for culling
        this.updateFrustum();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Update stats for performance monitoring
        this.stats.drawCalls = this.renderer.info.render.calls;
        this.stats.triangles = this.renderer.info.render.triangles;
    }
    
    // Utility method to create an emergency light (red)
    createEmergencyLight(position) {
        const light = new THREE.PointLight(0xff3030, 1, 10);
        light.position.copy(position);
        
        // Add visible bulb for the light source using emissive material
        const bulbGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bulbMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff3030,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.copy(position);
        light.add(bulb); // Add bulb as child of light
        
        // Add light to scene if possible
        if (this.addLight(light)) {
            this.scene.add(bulb);
        }
        
        return light;
    }
    
    // Utility method to get camera for other systems
    getCamera() {
        return this.camera;
    }
    
    // Utility method to create emissive material for glow effects without actual lights
    createEmissiveMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.5,
            metalness: 0.7
        });
    }
}