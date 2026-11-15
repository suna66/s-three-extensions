import * as THREE from "three/webgpu";

const DEFAULT_FOV = 75;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;
const DEFAULT_START_Z_POSITION = 10;

export default class ThreeSpace {
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _renderer: THREE.WebGPURenderer;
    private _timer: THREE.Timer;
    private _disposed: boolean = false;

    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(
            DEFAULT_FOV,
            width / height,
            DEFAULT_NEAR,
            DEFAULT_FAR,
        );

        this._camera.position.set(0, 0, DEFAULT_START_Z_POSITION);

        const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
        renderer.setSize(width, height);
        this._renderer = renderer;

        this._timer = new THREE.Timer();
        this._timer.connect(document);
    }

    public get camera() {
        return this._camera;
    }

    public get renderer() {
        return this._renderer;
    }

    public get domElement() {
        return this._renderer.domElement;
    }

    public addScene(mesh: THREE.Mesh) {
        this._scene.add(mesh);
    }

    public removeMesh(mesh: THREE.Mesh, disposed: boolean = false) {
        this._scene.remove(mesh);

        if (disposed) {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose());
            } else {
                mesh.material.dispose();
            }
        }
    }

    public setCameraPosition(x: number, y: number, z: number) {
        this._camera.position.set(x, y, z);
    }

    public addGridHelper(size: number, divisions: number): THREE.GridHelper {
        const gridHelper = new THREE.GridHelper(size, divisions);
        this._scene.add(gridHelper);
        return gridHelper;
    }

    public resize(width: number, height: number) {
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(width, height);
    }

    public async start(animation?: (delta: number) => void) {
        await this._renderer.init();
        if (this._disposed) return;

        const _animate = () => {
            if (this._disposed) return;
            this._timer.update();
            if (animation) {
                animation(this._timer.getDelta());
            }

            this._renderer.render(this._scene, this._camera);
        };

        this._renderer.setAnimationLoop(_animate);
    }

    public delete() {
        this._disposed = true;
        this._timer.disconnect();
        this._timer.dispose();
    }
}
