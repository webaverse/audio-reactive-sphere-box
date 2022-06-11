import * as THREE from 'three'

const sphereVertex = `
      ${THREE.ShaderChunk.common}
      varying vec2 vUv;
      varying vec3 vPattern;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uBeat;
      uniform float uSize;
      uniform sampler2D uTexture;
      #define NUM_OCTAVES 2

      // Simplex 2D noise
      //
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      
      float noise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      const mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
      float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100);
        // Rotate to reduce axial bias
        for (int i = 0; i < NUM_OCTAVES; ++i) {
          v += a * noise(x);
          x = rot * x * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

${THREE.ShaderChunk.logdepthbuf_pars_vertex}
void main() {

  // float pattern = cnoise(uv*uBeat*50.);
  

  // Time varying pixel color
  float time = uTime / 50000.;
  float f = fbm(vec2(time)+uv + fbm(vec2(time)-uv));

  float b = smoothstep(.0, 0.4, f);
  float g = smoothstep(.3, 0.7, f);
  float r = smoothstep(.6, 1., f);
  
  vec3 marble = vec3(r, g, b);
  float f2 = .5 - f;
  
  b = smoothstep(.0, .6 , f2);
  g = smoothstep(.3, .9, f2);
  r = smoothstep(.4, 1., f2);
  
  vec3 col2 = vec3(r, g, b);    
  marble = mix(marble, col2, f2);
  marble.r += uBeat / 2.;
  marble.r += uBeat / 4.;
  marble.r += uBeat / 5.;
  vec3 newPosition = position + normal * clamp(marble , 0. , uBeat);
  vPattern = marble;
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.);
  // gl_Position = projectedPosition;
  gl_PointSize = uSize * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  ${THREE.ShaderChunk.logdepthbuf_vertex}
}
    `

const sphereFragment = `
  precision highp float;
  precision highp int;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  varying vec3 vPattern;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec3 uMood;
  uniform float uTime;
  uniform float uPulse;
  uniform float uPulse2;
  uniform float uBeat;
  uniform sampler2D uTexture;
  

  void main() {
    // vec3 t = vec3(0.1 , 0.2 , 0.8);
    // vec3 t = vec3(vUv.x)/1.2;
    // t += vUv.y;
    // t*=rz;
    // t/=2.;
    // t.r += uBeat/3.;
    // t.g += uBeat/4.;
    // t.b += uBeat/2.;
    // float strength = 1. - step(0.5 , distance(gl_PointCoord, vec2(.5)));


    vec3 col =  vPattern * uMood;
    // col += fbm(vUv * sin(uTime/10000.) * 10.)/100.;
    // for (float i = 1.; i < 10.; i++) {
      // vec2 c1 = vUv;
      // c1.y += uPulse;
      // vec2 lightUv1 = vec2(c1.y * 0.5 + 0.25 , 0.5);
      // float strength1 = 0.01/distance(lightUv1,vec2(0.5));
      // col *= strength1;
      // col*=2.;
    // }
    
    // vec2 c2 = vUv;
    // c2.y += uPulse2;
    // vec2 lightUv2 = vec2(c2.y * 0.5 + 0.25 , 0.5);
    // float strength2 = 0.015/distance(lightUv2,vec2(0.5));
    // vec3 col = vec3(mix(strength1 , strength2 , 0.5)) * marble;
    
    

    gl_FragColor = vec4(col, 1.);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }

`


export { sphereVertex, sphereFragment }
