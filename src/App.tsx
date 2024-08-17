import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { ParticlesScene } from './components/Particles';

function App() {
  
    return (
      <div style={{width:"100vw", height: "100vh"}}>
        <Canvas camera={{ position: [0, 0, 18], fov: 35 }}>
          <color attach="background" args={['#181818']} />
          <OrbitControls enableDamping />
          <Stats />
          <ParticlesScene />  
        </Canvas>
      </div>
    )
}

export default App
