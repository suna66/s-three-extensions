import * as THREE from "three/webgpu";
import { SceneController } from "./SceneController";

const DEFAULT_FOV = 75;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;
const DEFAULT_START_Z_POSITION = 10;

export default class ThreeSpace {
    private _camera: THREE.PerspectiveCamera;
    private _renderer: THREE.WebGPURenderer;
    private _timer: THREE.Timer;
    private _disposed: boolean = false;
    private _currentScene: SceneController | null = null;
    private _nextScene: SceneController | null = null;
    private _switchScene: boolean = false;

    private _pressKeys: Set<string>;
    private _handleKeyDown = (e: KeyboardEvent) => this._pressKeys.add(e.code);
    private _handleKeyUp = (e: KeyboardEvent) => this._pressKeys.delete(e.code);

    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
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

        this._pressKeys = new Set();
        window.addEventListener("keydown", this._handleKeyDown);
        window.addEventListener("keyup", this._handleKeyUp);
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

    public isKeyPressed(key: string): boolean {
        return this._pressKeys.has(key);
    }

    public setSwitchScene(nextScene: SceneController) {
        this._nextScene = nextScene;
        this._nextScene.init(this);
        this._nextScene.start();
        this._switchScene = true;
    }

    public setCameraPosition(x: number, y: number, z: number) {
        this._camera.position.set(x, y, z);
    }

    public resize(width: number, height: number) {
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(width, height);
    }

    public async start(scene: SceneController) {
        await this._renderer.init();
        if (this._disposed) return;

        this._currentScene = scene;
        this._currentScene.init(this);
        this._currentScene.start();

        const _animate = () => {
            if (this._disposed) return;
            this._timer.update();

            if (this._switchScene) {
                if (this._currentScene) {
                    this._currentScene.delete();
                }
                this._currentScene = this._nextScene;
                this._pressKeys.clear();
                this._switchScene = false;
            }

            if (this._currentScene) {
                this._currentScene.update(this._timer.getDelta());
                this._renderer.render(this._currentScene.scene, this._camera);
            }
        };

        this._renderer.setAnimationLoop(_animate);
    }

    public delete() {
        this._disposed = true;
        if (this._currentScene) {
            this._currentScene.delete();
        }
        window.removeEventListener("keydown", this._handleKeyDown);
        window.removeEventListener("keyup", this._handleKeyUp);
        this._timer.disconnect();
        this._timer.dispose();
    }
}
