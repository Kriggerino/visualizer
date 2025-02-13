import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import styles from "../styles/Viewer.module.css";

function CustomGrid({ size, center }) {
  const gridColor = "#CCCCCC";
  const axisColor = "#000000";
  const divisions = 20;

  return (
    <>
      <gridHelper
        args={[size * 2, divisions]}
        position={[center[0], 0, center[2]]}
        material={
          new THREE.LineBasicMaterial({
            color: gridColor,
            opacity: 0.5,
            transparent: true,
          })
        }
      />

      {Array.from({ length: divisions + 1 }).map((_, i) => {
        const pos = (i - divisions / 2) * ((size * 2) / divisions);
        return (
          <group key={`tick-${i}`}>
            <line
              position={[pos + center[0], 0, center[2]]}
              geometry={new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, -2),
                new THREE.Vector3(0, 0, 2),
              ])}
            >
              <lineBasicMaterial color={axisColor} />
            </line>

            <line
              position={[center[0], 0, pos + center[2]]}
              geometry={new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2, 0, 0),
                new THREE.Vector3(2, 0, 0),
              ])}
            >
              <lineBasicMaterial color={axisColor} />
            </line>
          </group>
        );
      })}

      <line
        position={[center[0], 0, center[2]]}
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-size, 0, 0),
          new THREE.Vector3(size, 0, 0),
        ])}
      >
        <lineBasicMaterial color={axisColor} />
      </line>

      <line
        position={[center[0], 0, center[2]]}
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, -size),
          new THREE.Vector3(0, 0, size),
        ])}
      >
        <lineBasicMaterial color={axisColor} />
      </line>
    </>
  );
}

function Polygon({ points, color }) {
  const geometry = useMemo(() => {
    const vertices = points
      .map((p) => {
        const [x, y, z] = p.vertex;
        return [x, z, -y];
      })
      .flat();

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const indices = [];
    for (let i = 1; i < points.length - 1; i++) {
      indices.push(0, i, i + 1);
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [points]);

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial
        color={`#${color}`}
        side={THREE.DoubleSide}
        shininess={0}
        flatShading={true}
        opacity={0.95}
        transparent={true}
      />
    </mesh>
  );
}

function Borehole({ data, color = "#FF0000" }) {
  const { x, elevation, depth, name } = data;

  return (
    <group>
      <mesh position={[x, -depth/2, elevation]}>
        <cylinderGeometry args={[2, 2, depth, 8]} />
        <meshStandardMaterial 
          color={color} 
          opacity={0.7}
          transparent={true}
        />
      </mesh>


      <mesh position={[x, 0, elevation]}>
        <cylinderGeometry args={[4, 4, 5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Label */}
      <Html
        position={[x, 5, elevation]}
        style={{
          backgroundColor: "white",
          padding: "2px 4px",
          borderRadius: "2px",
          fontSize: "10px",
          transform: "translate3d(-50%, -100%, 0)",
          whiteSpace: "nowrap"
        }}
      >
        {name}
      </Html>
    </group>
  );
}

export default function Viewer3D({ data }) {
  if (!data) return null;

  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    data.polygonsBySection.forEach((section) => {
      section.polygons.forEach((polygon) => {
        polygon.points3D.forEach((point) => {
          const [x, y, z] = point.vertex;
          minX = Math.min(minX, x);
          minY = Math.min(minY, z);
          minZ = Math.min(minZ, -y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, z);
          maxZ = Math.max(maxZ, -y);
        });
      });
    });

    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
  }, [data]);

  const center = [
    (bounds.max[0] + bounds.min[0]) / 2,
    (bounds.max[1] + bounds.min[1]) / 2,
    (bounds.max[2] + bounds.min[2]) / 2,
  ];

  const gridSize = Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[2] - bounds.min[2],
    200 // Minimum grid size
  );

  return (
    <div className={styles.viewerContainer}>
      <Canvas
        camera={{
          position: [center[0] + 300, 150, center[2] + 300],
          fov: 45,
          near: 0.1,
          far: 20000,
          up: [0, 1, 0],
        }}
      >
        <color attach="background" args={["#FFFFFF"]} />

        <OrbitControls
          target={[center[0], 0, center[2]]}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={true}
        />

        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 1, 1]} intensity={0.3} />

        <CustomGrid size={gridSize} center={center} />

        {data.polygonsBySection.map((section) =>
          section.polygons.map((polygon, index) => (
            <Polygon
              key={`${section.sectionId}-${index}`}
              points={polygon.points3D}
              color={polygon.color}
            />
          ))
        )}
        {data.polygonsBySection.map(section =>
          section.boreholes.map((borehole, index) => (
            <Borehole
              key={`${section.sectionId}-borehole-${index}`}
              data={borehole}
            />
          ))
        )}

      </Canvas>
    </div>
  );
}
