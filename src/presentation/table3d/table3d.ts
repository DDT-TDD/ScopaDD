import * as THREE from 'three';
export type TableAtmosphere =
  | 'salotto'
  | 'trattoria'
  | 'piazza'
  | 'notte'
  | 'halloween'
  | 'xmas'
  | 'bimbi';

const ATMOSPHERE_CONFIGS: Record<
  TableAtmosphere,
  { texture: string; bgColor: number; lightColor: number; lightIntensity: number }
> = {
  trattoria: {
    texture: './backgrounds/trattoria.webp',
    bgColor: 0x1e150f,
    lightColor: 0xfff2df,
    lightIntensity: 1.8,
  },
  piazza: {
    texture: './backgrounds/piazza.webp',
    bgColor: 0x242428,
    lightColor: 0xffe8cc,
    lightIntensity: 1.5,
  },
  salotto: {
    texture: './backgrounds/salotto.webp',
    bgColor: 0x0a1a0f,
    lightColor: 0xfffaf0,
    lightIntensity: 1.6,
  },
  notte: {
    texture: './backgrounds/notte.webp',
    bgColor: 0x0a0c14,
    lightColor: 0xdde5ff,
    lightIntensity: 1.3,
  },
  halloween: {
    texture: './backgrounds/halloween.webp',
    bgColor: 0x180b26,
    lightColor: 0xff8c1a,
    lightIntensity: 1.7,
  },
  xmas: {
    texture: './backgrounds/xmas.webp',
    bgColor: 0x2a080c,
    lightColor: 0xffe699,
    lightIntensity: 1.8,
  },
  bimbi: {
    texture: './backgrounds/bimbi.webp',
    bgColor: 0x102838,
    lightColor: 0xffffff,
    lightIntensity: 1.9,
  },
};

export class Table3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private tableMesh: THREE.Mesh | null = null;
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private textureLoader = new THREE.TextureLoader();
  private animFrameId: number = 0;
  private destroyed: boolean = false;

  constructor(container: HTMLElement, atmosphere: TableAtmosphere = 'trattoria') {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    const config = ATMOSPHERE_CONFIGS[atmosphere];
    this.scene.background = new THREE.Color(config.bgColor);

    // Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, -7.5, 9.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(config.lightColor, config.lightIntensity);
    this.dirLight.position.set(3, -4, 8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 25;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 8;
    this.dirLight.shadow.camera.bottom = -8;
    this.scene.add(this.dirLight);

    this.createTable(atmosphere);
    this.startRenderLoop();
  }

  private createTable(atmosphere: TableAtmosphere) {
    const config = ATMOSPHERE_CONFIGS[atmosphere];
    const geom = new THREE.PlaneGeometry(16, 12);

    this.textureLoader.load(config.texture, (tex) => {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.75,
        metalness: 0.1,
      });

      if (this.tableMesh) {
        this.scene.remove(this.tableMesh);
      }
      this.tableMesh = new THREE.Mesh(geom, mat);
      this.tableMesh.receiveShadow = true;
      this.scene.add(this.tableMesh);
    });
  }

  setAtmosphere(atmosphere: TableAtmosphere) {
    const config = ATMOSPHERE_CONFIGS[atmosphere];
    this.scene.background = new THREE.Color(config.bgColor);
    this.dirLight.color.setHex(config.lightColor);
    this.dirLight.intensity = config.lightIntensity;
    this.createTable(atmosphere);
  }

  resize() {
    if (!this.container || this.destroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startRenderLoop() {
    const render = () => {
      if (this.destroyed) return;
      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animFrameId);
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
