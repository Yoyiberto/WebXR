// Import necessary Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Debug logging
console.log('Initializing Penguin Paradise 3D experience');

// Scene setup variables
let scene, camera, renderer, controls;
let penguins = [];
let loadingManager, loadingProgress = 0;
const PENGUIN_COUNT = 3;

// Debug info display element
const debugContent = document.getElementById('debug-content');

// Helper function to add debug info to the UI
function addDebugInfo(message) {
    console.log(message); // Also log to console
    
    // Add to UI debug panel
    if (debugContent) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        debugContent.appendChild(messageElement);
        
        // Auto-scroll to bottom
        debugContent.scrollTop = debugContent.scrollHeight;
        
        // Limit number of messages (keep last 10)
        while (debugContent.childElementCount > 10) {
            debugContent.removeChild(debugContent.firstChild);
        }
    }
}

// Penguin model - use directly the relative path in the public folder
const PENGUIN_MODEL = 'penguin2.glb'; // Local penguin model

// Fallback duck model if penguin fails to load
const FALLBACK_MODEL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf';

// Initialize the scene
init();

// Create animate function for rendering
animate();

// Main initialization function
function init() {
    addDebugInfo('Setting up the scene...');
    
    // Create loading manager with progress tracking
    setupLoadingManager();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Light blue sky
    
    // Add fog for atmosphere
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
    
    // Setup camera
    setupCamera();
    
    // Setup renderer
    setupRenderer();
    
    // Setup controls
    setupControls();
    
    // Setup lighting
    setupLighting();
    
    // Create environment
    createEnvironment();
    
    // Load penguin models
    loadPenguins();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    addDebugInfo('Scene setup complete');
}

// Set up loading manager with progress tracking
function setupLoadingManager() {
    addDebugInfo('Setting up loading manager');
    
    loadingManager = new THREE.LoadingManager();
    
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        loadingProgress = (itemsLoaded / itemsTotal) * 100;
        document.getElementById('loading-progress').style.width = loadingProgress + '%';
        addDebugInfo(`Loading progress: ${loadingProgress.toFixed(1)}%`);
    };
    
    loadingManager.onLoad = function() {
        addDebugInfo('All models loaded successfully!');
        document.getElementById('loading').style.display = 'none';
    };
    
    loadingManager.onError = function(url) {
        addDebugInfo(`Error loading: ${url}`);
    };
}

// Camera setup
function setupCamera() {
    addDebugInfo('Setting up camera');
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 6); // Adjusted from (0, 5, 10) to be closer to the smaller penguins
    camera.lookAt(0, 0, 0);
}

// Renderer setup
function setupRenderer() {
    addDebugInfo('Setting up renderer');
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
}

// Controls setup
function setupControls() {
    addDebugInfo('Setting up controls');
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2; // Limit rotation to not go below ground
}

// Lighting setup
function setupLighting() {
    addDebugInfo('Setting up lighting');
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    
    // Adjust shadow camera
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    
    scene.add(dirLight);
    
    // Hemisphere light for better outdoor lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
}

// Create environment (ice platform and water)
function createEnvironment() {
    addDebugInfo('Creating environment');
    
    // Create ice platform
    const iceGeometry = new THREE.CylinderGeometry(8, 8, 1, 32);
    const iceMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1
    });
    
    const icePlatform = new THREE.Mesh(iceGeometry, iceMaterial);
    icePlatform.position.y = -0.5;
    icePlatform.receiveShadow = true;
    scene.add(icePlatform);
    
    // Create water plane
    const waterGeometry = new THREE.PlaneGeometry(100, 100);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;
    scene.add(water);
}

// Load penguin models
function loadPenguins() {
    addDebugInfo('Loading penguin models');
    
    // Create positions for the penguins in a triangle formation
    const positions = [
        { x: -2, y: 0, z: 0, rotY: Math.PI / 6, scale: 0.02 },
        { x: 2, y: 0, z: 0, rotY: -Math.PI / 6, scale: 0.02 },
        { x: 0, y: 0, z: -2, rotY: Math.PI, scale: 0.02 }
    ];
    
    // Load each penguin model using the local file
    for (let i = 0; i < PENGUIN_COUNT; i++) {
        addDebugInfo(`Starting load of penguin ${i+1} from ${PENGUIN_MODEL}`);
        loadPenguinModel(PENGUIN_MODEL, positions[i], i);
    }
}

// Load individual penguin model
function loadPenguinModel(url, position, index) {
    const loader = new GLTFLoader(loadingManager);
    
    // Debug log the full URL being loaded
    const fullUrl = url;
    addDebugInfo(`Attempting to load model from: ${fullUrl}`);
    
    loader.load(url, (gltf) => {
        addDebugInfo(`Penguin ${index+1} loaded successfully!`);
        
        const model = gltf.scene;
        model.position.set(position.x, position.y, position.z);
        model.rotation.y = position.rotY;
        
        // Scale the model as needed - different models need different scales
        const scale = position.scale || 0.02;
        model.scale.set(scale, scale, scale);
        
        // Make it cast shadows
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        // Add random animation to make penguins move slightly
        const animationDuration = 2 + Math.random() * 2; // Random duration
        
        // Add penguin to scene and our array
        scene.add(model);
        penguins.push({
            model: model,
            initialY: position.y,
            animationDuration: animationDuration,
            animationOffset: Math.random() * Math.PI * 2 // Random phase
        });
        
    }, (xhr) => {
        // Progress callback - don't need to display every update
        if (xhr.loaded / xhr.total * 100 % 25 < 1) { // Log at 0%, 25%, 50%, 75%, 100%
            addDebugInfo(`Penguin ${index+1} loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`);
        }
    }, (error) => {
        addDebugInfo(`Error loading penguin ${index+1} from ${url}: ${error.message}`);
        
        // Fallback to duck model if penguin model fails to load
        addDebugInfo(`Falling back to duck model for penguin ${index+1}`);
        loadPenguinModel(FALLBACK_MODEL, position, index);
    });
}

// Handle window resize
function onWindowResize() {
    addDebugInfo('Window resized');
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Animate penguins with subtle movements
    const time = performance.now() * 0.001; // Current time in seconds
    
    penguins.forEach((penguin) => {
        if (penguin.model) {
            // Gentle bobbing motion
            penguin.model.position.y = penguin.initialY + 
                Math.sin(time / penguin.animationDuration + penguin.animationOffset) * 0.1;
                
            // Subtle rotation
            penguin.model.rotation.y = penguin.model.rotation.y + 
                Math.sin(time / penguin.animationDuration) * 0.01;
        }
    });
    
    // Render scene
    renderer.render(scene, camera);
}

// Log any errors that occur
window.addEventListener('error', function(event) {
    addDebugInfo(`ERROR: ${event.message}`);
}); 