import * as THREE from "three/webgpu";
import ThreeSpace from "./ThreeSpace";

export abstract class SceneController {
    protected _scene: THREE.Scene;
    protected _space: ThreeSpace | null = null;

    constructor() {
        this._scene = new THREE.Scene();
    }

    public init(space: ThreeSpace) {
        this._space = space;
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

    public abstract start(): void;
    public abstract update(delta: number): void;
    public stop() {}
    public delete() {}

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
