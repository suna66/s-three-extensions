import { useEffect } from "react";
import {
    ThreeWorld,
    SceneController,
    StudioControls,
    SceneObject,
    disposeLight,
    BasicControls,
    type CollisionEventPayload,
    Raycast,
} from "../../src/s-three-extensions";
import * as THREE from "three";

class MainScene extends SceneController {
    private _cube: SceneObject | null = null;

    public start() {
        this.controller = new StudioControls(this.camera, this.domElement);
        this._cube = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshNormalMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
        });
        this.addSceneObject(this._cube);
    }

    public update(_delta: number) {
        if (this.isKeyPressed("Space")) {
            this.addScene("sub", new SubScene());
            this.loadScene("sub");
        }
    }

    public delete() {
        this.removeAllSceneObjects();
        this._cube?.dispose(true);
    }
}

class SubScene extends SceneController {
    private _sphere: SceneObject | null = null;
    private _box: SceneObject | null = null;
    private _ground: SceneObject | null = null;

    public async start() {
        await this.initPhysics();
        this.controller = new StudioControls(this.camera, this.domElement);
        this.physicsDebug = true;

        this._sphere = new SceneObject(() => {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshNormalMaterial();
            const cube = new THREE.Mesh(geometry, material);
            return cube;
        });
        this.addSceneObject(this._sphere);

        this._box = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 10, 0);
            return cube;
        });
        this.addSceneObject(this._box);

        this._ground = new SceneObject(() => {
            const groundGeometry = new THREE.PlaneGeometry(10, 10);
            const groundMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -3;
            return ground;
        });
        this.addSceneObject(this._ground);

        this._ground.setPhysicalBody((mesh) =>
            this._physicsWorld!.addBody(mesh, {
                type: "fixed",
                colliders: [
                    {
                        shape: { type: "box", halfExtents: [5, 5, 0.1] },
                        offset: [0, 0, -0.1],
                        restitution: 0.5,
                    },
                ],
            }),
        );

        this._sphere.setPhysicalBody((mesh) =>
            this._physicsWorld!.addBody(mesh, {
                type: "dynamic",
                colliders: [
                    { shape: { type: "autoSphere" }, restitution: 0.5 },
                ],
            }),
        );

        this._box.setPhysicalBody((mesh) =>
            this._physicsWorld!.addBody(mesh, {
                type: "dynamic",
                colliders: [
                    {
                        shape: { type: "autoBox" },
                        restitution: 0.5,
                        activeEvent: true,
                    },
                ],
            }),
        );

        this.collision = (event: CollisionEventPayload) => {
            console.log(event);
        };
        this.enablePhysicsActiveEvent = true;

        const ray = new Raycast(this.domElement, this.camera);
        const objects: Array<THREE.Object3D> = [];
        objects.push(this._box.mesh!);
        this.controller.mouseMoveEvent = (event: PointerEvent) => {
            const intersects = ray.mousePoint(
                event.clientX,
                event.clientY,
                objects,
                false,
            );
            if (intersects.length > 0) {
                console.log("hit!");
                const obj = intersects[0].object as THREE.Mesh;
                // (obj.material as THREE.MeshBasicMaterial).color.set(0xff0000);
                console.log(this.getSceneObject(obj));
            }
        };
    }

    public update(_delta: number) {
        // Update scene objects here
        if (this.isKeyPressed("Space")) {
            this.addScene("batch", new BatchScene());
            this.loadScene("batch");
        }
    }

    public delete() {
        this.removeAllSceneObjects();
        this._ground?.dispose(true);
        this._sphere?.dispose(true);
    }
}

class BatchScene extends SceneController {
    private position = new THREE.Vector3();
    private rotation = new THREE.Euler();
    private quaternion = new THREE.Quaternion();
    private scale = new THREE.Vector3();

    private _batch: SceneObject | null = null;
    private _light: THREE.AmbientLight | null = null;

    private randomizeMatrix(matrix: THREE.Matrix4) {
        this.position.x = Math.random() * 40 - 20;
        this.position.y = Math.random() * 40 - 20;
        this.position.z = Math.random() * 40 - 20;

        this.rotation.x = Math.random() * 2 * Math.PI;
        this.rotation.y = Math.random() * 2 * Math.PI;
        this.rotation.z = Math.random() * 2 * Math.PI;

        this.quaternion.setFromEuler(this.rotation);

        this.scale.x = this.scale.y = this.scale.z = 0.5 + Math.random() * 0.5;

        return matrix.compose(this.position, this.quaternion, this.scale);
    }

    private randomizeColor(color: THREE.Color) {
        return color.setHSL(Math.random() * 0.5, 0.6, 0.5);
    }

    public async start() {
        this.controller = new BasicControls(this.camera, this.domElement);
        const cone = new THREE.ConeGeometry(1.0, 2.0);
        const box = new THREE.BoxGeometry(2.0, 2.0, 2.0);
        const sphere = new THREE.SphereGeometry(1.0, 16, 8);

        this._light = new THREE.AmbientLight(0xffffff, 2);
        this.addLight(this._light);

        const geometries = [cone, box, sphere];

        for (const geometry of geometries) {
            // add vertex colors for testing
            const count = geometry.getAttribute("position").count;
            const attribute = new THREE.BufferAttribute(
                new Float32Array(count * 3),
                3,
            );
            geometry.setAttribute("color", attribute);

            for (let i = 0, l = attribute.array.length; i < l; ++i) {
                attribute.array[i] = 1.0;
            }
        }

        const geometriesCount = 256;
        const vertexCount = geometries.length * 512;
        const indexCount = geometries.length * 1024;

        const mesh = new THREE.BatchedMesh(
            geometriesCount,
            vertexCount,
            indexCount,
            new THREE.MeshPhongMaterial({
                vertexColors: true,
            }),
        );

        const geometryIds = [
            mesh.addGeometry(geometries[0]),
            mesh.addGeometry(geometries[1]),
            mesh.addGeometry(geometries[2]),
        ];
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        const colorWithAlpha = new THREE.Vector4();

        for (let i = 0; i < geometriesCount; i++) {
            const id = mesh.addInstance(geometryIds[i % geometryIds.length]);
            this.randomizeColor(color);
            colorWithAlpha.set(color.r, color.g, color.b, 0.5);
            mesh.setMatrixAt(id, this.randomizeMatrix(matrix));
            mesh.setColorAt(id, colorWithAlpha);
        }

        this._batch = new SceneObject(mesh);
        this.addSceneObject(this._batch);
    }

    public update(_delta: number) {
        if (this.isKeyPressed("Space")) {
            this.addScene("main", new MainScene());
            this.loadScene("main");
        }
    }

    public delete() {
        if (this._light) {
            this.removeAllLight();
            disposeLight(this._light);
        }
        this._batch?.dispose(true);
    }
}

function App() {
    useEffect(() => {
        const threeWorld = new ThreeWorld(
            document.getElementById("main") as HTMLCanvasElement,
            window.innerWidth,
            window.innerHeight,
        );
        window.addEventListener("resize", () => {
            threeWorld.resize(window.innerWidth, window.innerHeight);
        });

        const mainScene = new MainScene();
        threeWorld.addScene("main", mainScene);
        threeWorld.start("main");

        return () => {
            threeWorld.delete();
        };
    }, []);

    return (
        <>
            <canvas id="main"></canvas>
        </>
    );
}

export default App;
