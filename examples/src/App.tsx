import { useEffect } from "react";
import { ThreeSpace, SceneController, StudioControls } from "../../src/s-three-extensions";
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
            const sub = new SubScene();
            this.switchScene(sub);
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
    private _controls: StudioControls | null = null;
    private _cube: THREE.Mesh | null = null;
    
    public start() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
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
            const main = new MainScene();
            this.switchScene(main);
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

function App() {
    useEffect(() => {
        const threeSpace = new ThreeSpace(
            document.getElementById("main") as HTMLCanvasElement,
            window.innerWidth,
            window.innerHeight,
        );
        window.addEventListener("resize", () => {
            threeSpace.resize(window.innerWidth, innerHeight);
        });

        const mainScene = new MainScene();
        threeSpace.start(mainScene);

        return () => {
            threeSpace.delete();
        };
    }, []);

    return (
        <>  
            <canvas id="main"></canvas>
        </>
    );
}

export default App;
