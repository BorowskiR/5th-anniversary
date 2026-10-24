import * as THREE from "three";

/** Project the envelope's actual silhouette into a softly scattered backlight. */
export function createEnvelopeHalo() {
  const corners = [
    new THREE.Vector3(-2.25, -1.35, -0.1),
    new THREE.Vector3(2.25, -1.35, -0.1),
    new THREE.Vector3(2.25, 1.35, -0.1),
    new THREE.Vector3(-2.25, 1.35, -0.1),
  ];
  const projected = corners.map(() => new THREE.Vector2());
  const temporary = new THREE.Vector3();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCorners: { value: projected },
      uAspect: { value: 1 },
      uSpread: { value: 0.08 },
      uIntensity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform vec2 uCorners[4];
      uniform float uAspect;
      uniform float uSpread;
      uniform float uIntensity;

      float edgeDistance(vec2 p, vec2 a, vec2 b) {
        vec2 edge = b - a;
        float t = clamp(dot(p - a, edge) / max(dot(edge, edge), 0.000001), 0.0, 1.0);
        return length(p - a - edge * t);
      }
      float grain(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vec2 p = vUv * vec2(uAspect, 1.0);
        float d = min(
          min(edgeDistance(p, uCorners[0], uCorners[1]), edgeDistance(p, uCorners[1], uCorners[2])),
          min(edgeDistance(p, uCorners[2], uCorners[3]), edgeDistance(p, uCorners[3], uCorners[0]))
        );
        // Tight luminous rim, a soft middle layer, then a wide scattered falloff.
        float rim = exp(-d / (uSpread * 0.12)) * 0.38;
        float soft = exp(-d / (uSpread * 0.48)) * 0.14;
        float haze = exp(-pow(d / (uSpread * 1.65), 1.25)) * 0.065;
        float speckle = mix(0.8, 1.12, grain(floor(gl_FragCoord.xy)));
        float alpha = (rim + soft + haze) * speckle * uIntensity;
        gl_FragColor = vec4(vec3(0.94, 0.915, 0.90), alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.frustumCulled = false;

  return {
    mesh,
    update(camera: THREE.PerspectiveCamera, envelope: THREE.Group, intensity: number) {
      let minY = Infinity;
      let maxY = -Infinity;
      let minX = Infinity;
      let maxX = -Infinity;
      corners.forEach((corner, index) => {
        temporary.copy(corner).applyMatrix4(envelope.matrixWorld).project(camera);
        const x = (temporary.x * 0.5 + 0.5) * camera.aspect;
        const y = temporary.y * 0.5 + 0.5;
        projected[index].set(x, y);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      });
      material.uniforms.uAspect.value = camera.aspect;
      material.uniforms.uSpread.value = Math.max(Math.hypot(maxX - minX, maxY - minY) * 0.2, 0.025);
      material.uniforms.uIntensity.value = intensity;
      const z = -9;
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      mesh.position.set(camera.position.x, camera.position.y, z);
      mesh.scale.set(height * camera.aspect, height, 1);
    },
  };
}
