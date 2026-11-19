import * as THREE from "three/webgpu";
import ThreeWorld from "./ThreeWorld";
import SceneObject from "./SceneObject";
import { PhysicsWorld } from "./PhysicsWorld";

export abstract class SceneController {
    protected _scene: THREE.Scene;
    protected _world: ThreeWorld | null = null;
    protected _physicsWorld: PhysicsWorld | null = null;
    protected _sceneObjects: Set<SceneObject> = new Set();
    private _suspended: boolean = false;

    constructor() {
        this._scene = new THREE.Scene();
    }

    public init(space: ThreeWorld) {
        this._world = space;
        this._suspended = false;
        this._physicsWorld = null;
    }

    public async initPhysics() {
        this._physicsWorld = await PhysicsWorld.create();
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

    public get physicsWorld(): PhysicsWorld | null {
        return this._physicsWorld;
    }

    public abstract start(): void;
    public abstract update(delta: number): void;
    public stop() {}
    public restart() {}
    public delete() {}

    public animate(delta: number) {
        if (this._physicsWorld) {
            this._physicsWorld.step(delta);
        }
        for (const obj of this._sceneObjects) {
            obj.update(delta);
        }
        this.update(delta);
    }

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

    /** @internal */
    public dispose(deleteMeshMaterial: boolean = false) {
        for (const obj of this._sceneObjects) {
            if (obj.mesh) {
                this._scene.remove(obj.mesh);
            }
            obj.dispose(deleteMeshMaterial);
        }
        this._sceneObjects = new Set();
    }

    protected loadScene(key: string, isDelete: boolean = true) {
        if (this._world) {
            this._world.loadScene(key, isDelete);
        }
    }

    protected addScene(key: string, scene: SceneController) {
        if (this._world) {
            this._world.addScene(key, scene);
        }
    }

    protected isKeyPressed(key: string): boolean {
        return this._world?.controls?.getKeyState(key) ?? false;
    }

    protected addMesh(mesh: SceneObject) {
        this._sceneObjects.add(mesh);
        if (mesh.mesh) {
            this._scene.add(mesh.mesh);
        }
    }

    protected removeMesh(mesh: SceneObject) {
        if (mesh.mesh) {
            this._scene.remove(mesh.mesh);
        }
        this._sceneObjects.delete(mesh);
    }
}
