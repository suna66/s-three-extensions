import * as THREE from "three";
import ThreeWorld from "./ThreeWorld";
import SceneObject from "./SceneObject";
import { PhysicsWorld } from "./PhysicsWorld";
import type AbstractControls from "./controls/AbstractControls";
import type { CollisionEventPayload } from "./types/PhysicsTypes";

export abstract class SceneController {
    protected _scene: THREE.Scene;
    protected _world: ThreeWorld | null = null;
    protected _physicsWorld: PhysicsWorld | null = null;
    protected _sceneObjects: Set<SceneObject> | null = null;
    private _controller: AbstractControls | null = null;
    private _lights: Array<THREE.Light> = [];
    private _suspended: boolean = false;
    private _isDebug: boolean = false;
    private _debugMesh: THREE.LineSegments | null = null;
    private _enablePhysicsActiveEvent: boolean = false;
    private _physicsEventDispose: (() => void) | null = null;

    constructor() {
        this._scene = new THREE.Scene();
    }

    public init(space: ThreeWorld) {
        this._world = space;
        this._suspended = false;
        this._physicsWorld = null;
        this._isDebug = false;
        this._enablePhysicsActiveEvent = false;
        if (this._physicsEventDispose) {
            this._physicsEventDispose();
            this._physicsEventDispose = null;
        }
        this._sceneObjects = new Set();
    }

    public async initPhysics() {
        this._physicsWorld = await PhysicsWorld.create();
        if (this._enablePhysicsActiveEvent && !this._physicsEventDispose) {
            this._physicsEventDispose = this._physicsWorld.onCollision(
                this.physicsActiveEvent,
            );
        }
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

    public get controller(): AbstractControls | null {
        return this._controller;
    }

    public set physicsDebug(sw: boolean) {
        if (sw) {
            if (!this._isDebug) {
                this._debugMesh = new THREE.LineSegments(
                    new THREE.BufferGeometry(),
                    new THREE.LineBasicMaterial({
                        color: 0x00ff00,
                        vertexColors: true,
                    }),
                );
                this._debugMesh.frustumCulled = false;
                this._isDebug = true;
                this.scene.add(this._debugMesh);
            }
        } else {
            if (this._isDebug) {
                if (this._debugMesh) {
                    this.scene.remove(this._debugMesh);
                    this._debugMesh.geometry.dispose();
                    if (Array.isArray(this._debugMesh.material)) {
                        this._debugMesh.material.forEach((m) => m.dispose());
                    } else {
                        this._debugMesh.material.dispose();
                    }
                }
                this._debugMesh = null;
                this._isDebug = false;
            }
        }
    }

    public get physicsDebug() {
        return this._isDebug;
    }

    /** @internal */
    public get suspended(): boolean {
        return this._suspended;
    }

    public get physicsWorld(): PhysicsWorld | null {
        return this._physicsWorld;
    }

    public set enablePhysicsActiveEvent(sw: boolean) {
        if (sw) {
            if (!this._enablePhysicsActiveEvent) {
                if (this._physicsWorld && !this._physicsEventDispose) {
                    this._physicsEventDispose = this._physicsWorld.onCollision(
                        this.physicsActiveEvent,
                    );
                }
            }
        } else {
            if (this._enablePhysicsActiveEvent) {
                if (this._physicsEventDispose) {
                    this._physicsEventDispose();
                    this._physicsEventDispose = null;
                }
            }
        }
        this._enablePhysicsActiveEvent = sw;
    }

    public set controller(ctrl: AbstractControls | null) {
        this._controller = ctrl;
    }

    public abstract start(): void;
    public abstract update(delta: number): void;
    public stop() {}
    public restart() {}
    public delete() {}
    public collision(_event: CollisionEventPayload) {}

    protected physicsActiveEvent = (event: CollisionEventPayload) => {
        if (this._physicsWorld == null) return;
        this.collision(event);
    };

    public animate(delta: number) {
        if (this._physicsWorld) {
            this._physicsWorld.step(delta);
        }
        if (this._controller) {
            this._controller.update(delta);
        }
        if (this._sceneObjects == null) {
            return;
        }
        for (const obj of this._sceneObjects) {
            obj.update(delta);
        }
        if (this._isDebug && this._physicsWorld) {
            const { vertices, colors } = this._physicsWorld.debugRenderer;
            if (this._debugMesh != null) {
                this._debugMesh.geometry.setAttribute(
                    "position",
                    new THREE.BufferAttribute(vertices, 3),
                );
                this._debugMesh.geometry.setAttribute(
                    "color",
                    new THREE.BufferAttribute(colors, 4),
                );
            }
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
    public dispose() {
        this._sceneObjects = null;
        if (this._physicsWorld) {
            this._physicsWorld.dispose();
        }
        if (this._controller) {
            this._controller.dispose();
        }
        if (this._physicsEventDispose) {
            this._physicsEventDispose();
            this._physicsEventDispose = null;
        }
        this._enablePhysicsActiveEvent = false;
        this.physicsDebug = false;
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
        return this._controller?.getKeyState(key) ?? false;
    }

    protected addSceneObject(sceneObject: SceneObject) {
        if (this._sceneObjects == null) {
            this._sceneObjects = new Set();
        }
        this._sceneObjects.add(sceneObject);
        if (sceneObject.mesh) {
            this._scene.add(sceneObject.mesh);
        }
    }

    protected removeSceneObject(sceneObject: SceneObject) {
        if (sceneObject.mesh) {
            this._scene.remove(sceneObject.mesh);
        }
        if (this._sceneObjects) {
            this._sceneObjects.delete(sceneObject);
        }
    }

    protected removeAllSceneObjects() {
        if (this._sceneObjects == null) {
            return;
        }
        for (const obj of this._sceneObjects) {
            this.removeSceneObject(obj);
        }
    }

    protected addLight(light: THREE.Light) {
        this._lights.push(light);
        this._scene.add(light);
    }

    protected removeLight(light: THREE.Light) {
        const updateLight = this._lights.filter((value) => value !== light);
        this._lights = updateLight;
        this._scene.remove(light);
    }

    protected removeAllLight() {
        for (const light of this._lights) {
            this.removeLight(light);
        }
    }
}
