import { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import gsap from 'gsap';

const vertexShader = `
  uniform vec2 uResolution;
  uniform float uSize;
  uniform float uProgress;
  attribute float aAngle;
  varying vec2 vUv;
  uniform vec3 uMouse;
  uniform float uTime;
  uniform float uDistortion;
  void main()
  {
      vUv = uv;

      vec3 pos = position;
      float angle = uTime;
      //vertex distortion code starts here
      if(uDistortion == 1.)
      {
        pos.x += sin(pos.y + angle) * 0.1;
        pos.y += cos(pos.x + angle) * 0.1;
      }      
      //vertex distortion code starts here
      /*Nice wave pattern code below, experiment later
      pos.x += sin(pos.y + angle) * 10.;
      pos.y += cos(pos.x + angle) * 10.;
      */
      //vertex mouse over displacement code starts here
      vec3 distanceToMouseVector = pos - uMouse;
      float distanceToMouse = length(distanceToMouseVector);
      float strength = 1.0 / distanceToMouse;
      vec3 displacement = vec3(
        cos(aAngle) * strength,
        sin(aAngle) * strength,
        1
      );
      pos.xyz += normalize(displacement) * strength;
      //vertex mouse over displacement code ends here

      pos.z += sin(uProgress * aAngle) * 10.;
      // Final position
      vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      // Point size
      gl_PointSize = uSize * uResolution.y;
      gl_PointSize *= (1.0 / -viewPosition.z);
  }

`

const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main()
  {
    vec2 uv = gl_PointCoord.xy;
    float distanceToCenter = distance(uv, vec2(0.5, 0.5));
    if(distanceToCenter > 0.5)discard;
    //gl_FragColor = vec4(1.0);//vec4(uv, .0, 1.0);
    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = color;
  }
`

export const ParticlesScene = () => {
      
    const particlesRef = useRef<THREE.Points>(null);

    const picTexture = useTexture("picture-1.png")
    const [vidTexture, setVidTexture] = useState<THREE.VideoTexture>()

    const entryAnimated = useRef(false)
    const raycaster = new THREE.Raycaster()

    const defaultPoint = new THREE.Vector3(999, 999, 999)

    const [ sizes, setSizes ] = useState({
        width: window.innerWidth, height: window.innerHeight, pixelratio: Math.min(window.devicePixelRatio, 2)
    }) 
    const { uSizeVal, uProgressVal, mediaType, videoControl, uDistortVal } = useControls({ 
        uSizeVal: {value: 0.2, min: 0, step: 0.05}, 
        uProgressVal: {
            value: 1, min: 0, max: 1, step: 0.01
        },
        uDistortVal: { value: false, label: 'Distortion'},
        mediaType: { 
            value: 'image', 
            options: ['image', 'movie'] 
        },
        videoControl: { value: false, label: 'Play Video' }    
    })
    
    const { width, height, pixelratio } = sizes
        
    const uniforms = useMemo(() => ({
        uResolution: new THREE.Uniform(
            new THREE.Vector2(
                window.innerWidth * pixelratio,
                window.innerHeight * pixelratio
            )
        ),
        uSize: { value: uSizeVal },
        uProgress: { value: uProgressVal },
        uTexture: { value: mediaType === "image"?picTexture:vidTexture },
        uMouse: { value: defaultPoint },
        uTime: { value: 0 },
        uDistortion: { value: uDistortVal?1.:0.}
    }), [  ])

    const { camera } = useThree()

    useEffect(()=>{
        const onMouseMove = (event: MouseEvent) => {      
            const mouse = new THREE.Vector2(
                (event.clientX / width) * 2 - 1,
                -(event.clientY / height) * 2 + 1
            )
            raycaster.setFromCamera(mouse, camera)
            
            if(particlesRef.current !== null){
                const intersects = raycaster.intersectObject(particlesRef.current)

                const material = particlesRef.current.material as THREE.ShaderMaterial
                if (intersects.length > 0) {            
                    const point = intersects[0].point
                    material.uniforms.uMouse.value = point
                } else {
                    material.uniforms.uMouse.value = new THREE.Vector3(
                        999,
                        999,
                        999
                    )
                }
            }
        
        }

        window.addEventListener("mousemove", onMouseMove)

        return ()=>{
            window.removeEventListener("mousemove", onMouseMove)
        }
    }, [particlesRef])

    useEffect(() => {
        const video = document.getElementById("video") as HTMLVideoElement;
        if (video) {
            video.crossOrigin = "anonymous";
            video.loop = true;
            if (mediaType === 'movie') {
                if(videoControl){
                    video.play();
                }else{
                    video.pause()
                }
                
            } else {
                video.pause();
            }
        }
    }, [mediaType, videoControl]);

    useEffect(() => {
        if (particlesRef.current) {
            const material = particlesRef.current.material as THREE.ShaderMaterial;
            gsap.to(material.uniforms.uProgress, {
                value: 0,
                duration: 2,
                ease: "power2.inOut"
            });
        }
    }, [particlesRef]);

    useEffect(()=>{
        const video = document.getElementById("video") as HTMLVideoElement
        const videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.NearestFilter
        videoTexture.magFilter = THREE.NearestFilter
        videoTexture.format = THREE.RGBAFormat

        setVidTexture(videoTexture)
    }, [])

    useEffect(()=>{
        if(particlesRef.current){
            const { geometry } = particlesRef.current
            const randomAngles = new Float32Array(
                geometry.attributes.position.count
            )
            for(let i = 0; i < randomAngles.length; i++){
                randomAngles[i] = Math.random() * Math.PI * 2
            }

            geometry.setAttribute(
                "aAngle",
                new THREE.BufferAttribute(randomAngles, 1)
            )
        }
    }, [ particlesRef ])

    useEffect(()=>{
        if(particlesRef.current){
            const material = particlesRef.current.material as THREE.ShaderMaterial
            material.uniforms.uTexture.value = mediaType === "image"?picTexture:vidTexture
        }
    }, [particlesRef, mediaType])

    useFrame((state)=>{
        const t = state.clock.getElapsedTime()
        if(particlesRef.current){
            const material = particlesRef.current.material as THREE.ShaderMaterial
            material.uniforms.uSize.value = uSizeVal
            material.uniforms.uResolution = new THREE.Uniform(
                new THREE.Vector2(
                    window.innerWidth * pixelratio,
                    window.innerHeight * pixelratio
                )
            )
            material.uniforms.uTime.value = t
            material.uniforms.uDistortion.value = uDistortVal?1.:0.
            //material.uniforms.uProgress.value = uProgressVal      
        
        }
    })
    

    return (
        <points ref={particlesRef}>
            <planeGeometry args={[10, 10, 128, 128]} />
            <shaderMaterial
                depthWrite={false}
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
            />
        </points>
    );
};
