import * as THREE from "three/webgpu";
import ThreeWorld from "./ThreeWorld";
import IntegrateObject from "./IntegrateObject";

export abstract class SceneController {
    protected _scene: THREE.Scene;
    protected _world: ThreeWorld | null = null;
    private _suspended: boolean = false;

    constructor() {
        this._scene = new THREE.Scene();
    }

    public init(space: ThreeWorld) {
        this._world = space;
        this._suspended = false;
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._world!.camera;
    }

    public get domElement(): HTMLCanvasElement {
        return this._world!.domElement;
    }

    /** @internal */
    public get suspended(): boolean {
        return this._suspended;
    }

    public abstract start(): void;
    public abstract update(delta: number): void;
    public stop() {}
    public restart() {}
    public delete() {}

    /** @internal */
    public suspend() {
        this.stop();
        this._suspended = true;
    }

    /** @internal */
    public resume() {
        if (this._suspended) {
            this.restart();
        } else {
            this.start();
        }
        this._suspended = false;
    }

    protected loadScene(key: string, isDelete: boolean = true) {
        if (this._world) {
            this._world.loadScene(key, isDelete);
        }
    }

    protected isKeyPressed(key: string): boolean {
        return this._world?.controls?.getKeyState(key) ?? false;
    }

    protected addMesh(mesh: THREE.Mesh | IntegrateObject) {
        if (mesh instanceof IntegrateObject) {
            if (mesh.mesh) {
                this._scene.add(mesh.mesh);
            }
        } else {
            this._scene.add(mesh);
        }
    }

    protected removeMesh(mesh: THREE.Mesh | IntegrateObject) {
        if (mesh instanceof IntegrateObject) {
            if (mesh.mesh) {
                this._scene.remove(mesh.mesh);
            }
        } else {
            this._scene.remove(mesh);
        }
    }
}
