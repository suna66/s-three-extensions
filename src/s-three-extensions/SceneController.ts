import * as THREE from "three/webgpu";
import ThreeWorld from "./ThreeWorld";

export abstract class SceneController {
    protected _scene: THREE.Scene;
    protected _space: ThreeWorld | null = null;
    private _suspended: boolean = false;

    constructor() {
        this._scene = new THREE.Scene();
    }

    public init(space: ThreeWorld) {
        this._space = space;
        this._suspended = false;
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._space!.camera;
    }

    public get domElement(): HTMLCanvasElement {
        return this._space!.domElement;
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
        if (this._space) {
            this._space.loadScene(key, isDelete);
        }
    }

    protected isKeyPressed(key: string): boolean {
        return this._space?.isKeyPressed(key) ?? false;
    }

    protected addMesh(mesh: THREE.Mesh) {
        this._scene.add(mesh);
    }

    protected removeMesh(mesh: THREE.Mesh, disposed: boolean = false) {
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
}
