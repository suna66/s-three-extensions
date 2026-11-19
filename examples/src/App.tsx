import { useEffect } from "react";
import { ThreeWorld, SceneController, StudioControls, SceneObject } from "../../src/s-three-extensions";
import * as THREE from "three";


class MainScene extends SceneController {
    private _cube: SceneObject | null = null;
    
    public start() {
        this._cube = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshNormalMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
        });
        this.addMesh(this._cube);
    }

    public update(_delta: number) {
        if (this.isKeyPressed("Space")) {
            this.addScene("sub", new SubScene());
            this.loadScene("sub");
        }
    }
}

class SubScene extends SceneController {
    private _sphere: SceneObject | null = null;
    private _ground: SceneObject | null = null;

    public async start() {
        await this.initPhysics();

        this._sphere = new SceneObject(() => {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshNormalMaterial();
            const cube = new THREE.Mesh(geometry, material);
            return cube;
        });
        this.addMesh(this._sphere);

        this._ground = new SceneObject(() => {
            const groundGeometry = new THREE.PlaneGeometry(10, 10);
            const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -3;
            return ground;
        });
        this.addMesh(this._ground);

        this._ground.setPhysicalBody((mesh) => this._physicsWorld!.addBody(mesh, {
            type: "fixed",
            colliders: [{shape: {type: "box", halfExtents:[10, 10, 0.1]}, offset: [0, 0, -0.1], restitution: 0.5}]
        }));

        this._sphere.setPhysicalBody((mesh) => this._physicsWorld!.addBody(mesh, {
            type: "dynamic",
            colliders: [{shape: {type: "autoSphere"}, restitution: 0.5}]
        }));

    }

    public update(_delta: number) {
        // Update scene objects here
        if (this.isKeyPressed("Space")) {
            this.addScene("main", new MainScene());
            this.loadScene("main");
        }
    }

    public delete() {
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
        threeWorld.setControls(
            (camera, domElement) => new StudioControls(camera, domElement)
        );

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
