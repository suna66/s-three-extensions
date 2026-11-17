import { useEffect } from "react";
import { ThreeWorld, SceneController, StudioControls, PhysicsWorld } from "../../src/s-three-extensions";
import * as THREE from "three";


class MainScene extends SceneController {
    private _controls: StudioControls | null = null;
    private _cube: THREE.Mesh | null = null;
    
    public start() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        this.addMesh(cube);
        this._cube = cube;

        this._controls = new StudioControls(
            this.camera,
            this.domElement,
        );
    }

    public update(delta: number) {
        // Update scene objects here
        if (this._controls) {
            this._controls.update(delta);
        }
        if (this.isKeyPressed("Space")) {
            this.loadScene("sub", false);
        }
    }

    public delete() {
        if (this._controls) {
            this._controls.dispose();
        }
        if (this._cube) {
            this.removeMesh(this._cube, true);
        }
    }
}

class SubScene extends SceneController {
    private _physicsWorld: PhysicsWorld | null = null;
    private _controls: StudioControls | null = null;
    private _sphere: THREE.Mesh | null = null;
    private _ground: THREE.Mesh | null = null;
    
    public async start() {
        this._physicsWorld = await PhysicsWorld.create();

        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        this.addMesh(cube);
        this._sphere = cube;

        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        this.addMesh(ground);
        this._ground = ground;

        const groundHandle = this._physicsWorld.addBody(this._ground, {
            type: "fixed",
            colliders: [{shape: {type: "box", halfExtents:[10, 10, 0.1]}, offset: [0, 0, -0.1], restitution: 0.5}]
        });
        const sphereHandle = this._physicsWorld.addBody(this._sphere, {
            type: "dynamic",
            colliders: [{shape: {type: "autoSphere"}, restitution: 0.5}]
        });

        this._controls = new StudioControls(
            this.camera,
            this.domElement,
        );

    }

    public update(delta: number) {
        this._physicsWorld?.step(delta);
        // Update scene objects here
        if (this._controls) {
            this._controls.update(delta);
        }
        if (this.isKeyPressed("Space")) {
            this.loadScene("main", false);
        }
    }

    public delete() {
        this._physicsWorld?.dispose();
        if (this._controls) {
            this._controls.dispose();
        }
        if (this._sphere) {
            this.removeMesh(this._sphere, true);
        }
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
        const subScene = new SubScene();
        threeWorld.addScene("sub", subScene);
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
