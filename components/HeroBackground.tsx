
import React, { useEffect, useRef } from 'react';

const HeroBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !(window as any).THREE) return;
    const THREE = (window as any).THREE;

    // Scene Setup
    const scene = new THREE.Scene();
    // Midnight black fog
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Connections (Bonds)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x64748b, // Slate-500
      transparent: true,
      opacity: 0.2,
    });

    // Static wireframe of a larger sphere for background structure
    const sphereGeo = new THREE.IcosahedronGeometry(15, 2);
    const wireframe = new THREE.WireframeGeometry(sphereGeo);
    const sphereLines = new THREE.LineSegments(wireframe, lineMaterial);
    scene.add(sphereLines);

    // Initial Render
    renderer.render(scene, camera);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      wireframe.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

export default HeroBackground;
