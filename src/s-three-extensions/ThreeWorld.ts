import * as THREE from "three/webgpu";
import { SceneController } from "./SceneController";

const DEFAULT_FOV = 75;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;
const DEFAULT_START_Z_POSITION = 10;

interface SwitchSceneInfo {
    key: string;
    scene: SceneController | null;
    deleteFlag: boolean;
    switchScene: boolean;
}

export default class ThreeWorld {
    private _camera: THREE.PerspectiveCamera;
    private _renderer: THREE.WebGPURenderer;
    private _timer: THREE.Timer;
    private _disposed: boolean = false;
    private _currentScene: SceneController | null = null;
    private _currentSceneKey: string = "";
    private _nextScene: SceneController | null = null;
    private _switchSceneInfo: SwitchSceneInfo;
    private _sceneStack: Map<string, SceneController>;

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

        this._sceneStack = new Map();
        this._switchSceneInfo = {
            key: "",
            scene: null,
            deleteFlag: false,
            switchScene: false,
        };
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

    public addScene(key: string, scene: SceneController) {
        scene.init(this);
        this._sceneStack.set(key, scene);
    }

    public loadScene(key: string, isDelete: boolean = true): boolean {
        const nextScene = this._sceneStack.get(key);
        if (!nextScene) return false;
        this._nextScene = nextScene;
        this._nextScene.resume();
        this._switchSceneInfo.switchScene = true;
        this._switchSceneInfo.deleteFlag = isDelete;
        this._switchSceneInfo.key = key;
        return true;
    }

    public setCameraPosition(x: number, y: number, z: number) {
        this._camera.position.set(x, y, z);
    }

    public resize(width: number, height: number) {
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(width, height);
    }

    public async start(startScene: string) {
        await this._renderer.init();
        if (this._disposed) return;

        this._currentScene = this._sceneStack.get(startScene) ?? null;
        if (!this._currentScene) return;
        this._currentSceneKey = startScene;

        this._currentScene.start();

        let delta = 0.0;
        const _animate = () => {
            if (this._disposed) return;
            this._timer.update();
            delta = Math.min(this._timer.getDelta(), 0.1);

            if (this._switchSceneInfo.switchScene) {
                if (this._currentScene) {
                    if (this._switchSceneInfo.deleteFlag) {
                        this._currentScene.delete();
                        this._currentScene.dispose();
                        this._sceneStack.delete(this._currentSceneKey);
                    } else {
                        this._currentScene.suspend();
                    }
                }
                this._currentScene = this._nextScene;
                this._currentSceneKey = this._switchSceneInfo.key;
                this._switchSceneInfo.deleteFlag = false;
                this._switchSceneInfo.switchScene = false;
            }

            if (this._currentScene) {
                this._currentScene.animate(delta);
                this._renderer.render(this._currentScene.scene, this._camera);
            }
        };

        this._renderer.setAnimationLoop(_animate);
    }

    public delete() {
        this._disposed = true;
        this._renderer.setAnimationLoop(null);

        const scenesToDispose = new Set<SceneController>(
            this._sceneStack.values(),
        );
        if (this._currentScene) {
            scenesToDispose.add(this._currentScene);
        }
        for (const scene of scenesToDispose) {
            scene.delete();
            scene.dispose();
        }
        this._sceneStack.clear();
        this._currentScene = null;
        this._nextScene = null;

        this._timer.disconnect();
        this._timer.dispose();
        this._renderer.dispose();
    }
}
