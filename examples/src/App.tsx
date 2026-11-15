import { useEffect } from "react";
import ThreeSpace from "../../src/s-three-extensions/ThreeSpace";
import * as THREE from "three";
import StudioControls from "../../src/s-three-extensions/StudioControls";

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

        const controls = new StudioControls(
            threeSpace.camera,
            threeSpace.domElement,
        );

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, 0);
        threeSpace.addScene(cube);

        threeSpace.addGridHelper(10, 10);

        threeSpace.start((delta: number) => {
            controls.update(delta);
        });

        return () => {
            //controls.dispose();
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
