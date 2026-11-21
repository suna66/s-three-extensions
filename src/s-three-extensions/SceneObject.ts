import * as THREE from "three";
import type { PhysicsBodyHandle } from "./PhysicsWorld";
import { disposeMesh } from "./ExtensionUtils";

export default class SceneObject {
    private _tag: string | null = null;
    private _mesh: THREE.Mesh | null = null;
    private _physicsBodyHandle: PhysicsBodyHandle | null = null;
    private _updateFunction:
        | ((
              delta: number,
              mesh: THREE.Mesh,
              bodyHandle: PhysicsBodyHandle | null,
          ) => void)
        | null = null;

    constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null) {
        if (typeof mesh === "function") {
            this._mesh = mesh();
        } else {
            this._mesh = mesh;
        }
    }

    public set tag(value: string) {
        this._tag = value;
    }

    public get tag(): string | null {
        return this._tag;
    }

    public get mesh(): THREE.Mesh | null {
        return this._mesh;
    }

    public get physicsBodyHandle(): PhysicsBodyHandle | null {
        return this._physicsBodyHandle;
    }

    public setMesh(func: () => THREE.Mesh) {
        this._mesh = func();
    }

    public setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle) {
        if (this._mesh === null) {
            throw new Error(
                "A mesh must be added before adding a physical body.",
            );
        }
        this._physicsBodyHandle = func(this._mesh);
    }

    public setPhysicsMesh(
        meshFunc: () => THREE.Mesh,
        physicsFunc: (mesh: THREE.Mesh) => PhysicsBodyHandle,
    ) {
        this._mesh = meshFunc();
        this._physicsBodyHandle = physicsFunc(this._mesh);
    }

    public addUpdateFunction(
        func: (
            delta: number,
            mesh: THREE.Mesh,
            bodyHandle: PhysicsBodyHandle | null,
        ) => void,
    ) {
        if (this._mesh === null) {
            return;
        }
        this._updateFunction = func;
    }

    // @local
    public update(delta: number) {
        if (this._updateFunction && this._mesh) {
            this._updateFunction(delta, this._mesh, this._physicsBodyHandle);
        }
    }

    public dispose(deleteMeshMaterial: boolean = false) {
        disposeMesh(this._mesh, deleteMeshMaterial);
        this._mesh = null;
        this._physicsBodyHandle = null;
    }
}
