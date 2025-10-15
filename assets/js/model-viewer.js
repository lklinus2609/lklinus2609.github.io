/**
 * 3D Model Viewer using Three.js
 * Displays interactive 3D models in the portfolio
 */

class ModelViewer {
  constructor(containerId, modelPath, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Options
    this.modelPath = modelPath;
    this.width = options.width || this.container.clientWidth;
    this.height = options.height || this.container.clientHeight || 500;
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
    this.autoRotateSpeed = options.autoRotateSpeed || 0.5;
    this.backgroundColor = options.backgroundColor || 0xF9F7F4;
    this.enableZoom = options.enableZoom !== undefined ? options.enableZoom : true;
    this.enablePan = options.enablePan !== undefined ? options.enablePan : false;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.animationId = null;

    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 1, 3);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Add lights
    this.addLights();

    // Add controls
    this.addControls();

    // Load model
    this.loadModel();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (key light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 2, 5);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 4, -5);
    this.scene.add(rimLight);
  }

  addControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = this.enableZoom;
    this.controls.enablePan = this.enablePan;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = this.autoRotateSpeed;
  }

  loadModel() {
    const loader = new THREE.OBJLoader();
    const mtlLoader = new THREE.MTLLoader();

    // Show loading message
    this.showLoading();

    // Get paths
    const basePath = this.modelPath.substring(0, this.modelPath.lastIndexOf('/') + 1);
    const mtlPath = this.modelPath.replace('.obj', '.mtl');

    // Load MTL first, then OBJ
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload();
        loader.setMaterials(materials);
        this.loadOBJ(loader);
      },
      undefined,
      (error) => {
        console.warn('MTL not found, loading OBJ without materials');
        this.loadOBJ(loader);
      }
    );
  }

  loadOBJ(loader) {
    loader.load(
      this.modelPath,
      (object) => {
        this.model = object;

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;

        object.position.x = -center.x * scale;
        object.position.y = -center.y * scale;
        object.position.z = -center.z * scale;
        object.scale.setScalar(scale);

        // Rotate model so forward faces camera (rotate -90 degrees around X axis)
        object.rotation.x = -Math.PI / 2;

        // Apply material properties
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Ensure material is set
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 0.5,
                roughness: 0.5
              });
            }
          }
        });

        this.scene.add(object);
        this.hideLoading();

        // Adjust camera - zoom in closer and focus 1.0 units lower than center
        const distance = Math.max(size.x, size.y, size.z) * scale * 2.0;
        this.camera.position.set(0, -1.0, distance);
        this.controls.target.set(0, -1.0, 0); // Look 1.0m lower than center
        this.controls.update();
      },
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        this.updateLoading(percentComplete);
      },
      (error) => {
        console.error('Error loading model:', error);
        this.showError('Failed to load 3D model');
      }
    );
  }

  showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'model-loading';
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 600;
      text-align: center;
    `;
    loadingDiv.innerHTML = 'Loading 3D Model...<br><span id="loading-percent">0%</span>';
    this.container.appendChild(loadingDiv);
  }

  updateLoading(percent) {
    const percentElement = document.getElementById('loading-percent');
    if (percentElement) {
      percentElement.textContent = Math.round(percent) + '%';
    }
  }

  hideLoading() {
    const loadingDiv = document.getElementById('model-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  showError(message) {
    this.hideLoading();
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #e74c3c;
      font-size: 16px;
      text-align: center;
    `;
    errorDiv.textContent = message;
    this.container.appendChild(errorDiv);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight || 500;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.controls.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
