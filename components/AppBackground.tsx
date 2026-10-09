'use client';

import { useEffect, useRef } from 'react';

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Pale fbm swirl, seen through diagonal fluted glass, with film grain.
const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float flute = fract((p.x + p.y * 0.35) * 11.0);
  float lens = flute - 0.5;
  p.x += lens * 0.09;
  float shade = 1.0 - 0.05 * pow(abs(lens) * 2.0, 2.0);

  float t = u_time * 0.03;
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.1));
  vec2 r = vec2(fbm(p * 1.6 + 2.0 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm(p * 1.6 + 2.0 * q + vec2(8.3, 2.8) - t * 0.5));
  float v = fbm(p * 1.2 + 2.0 * r);

  vec3 col = mix(u_c0, u_c1, smoothstep(0.2, 0.55, v));
  col = mix(col, u_c2, smoothstep(0.5, 0.8, v));
  col = mix(col, u_c3, smoothstep(0.75, 0.95, length(r) * 0.8) * 0.6);
  col = mix(col * shade, u_c0, 0.25);
  col += (hash(gl_FragCoord.xy + fract(u_time) * 97.0) - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`;

const RENDER_SCALE = 0.5;
const FRAME_MS = 1000 / 30;

function tokenRgb(name: string): [number, number, number] {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
    .replace('#', '');
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, '$&$&') : hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export default function AppBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', {
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!canvas || !gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const pos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    ['--swirl-1', '--swirl-2', '--swirl-3', '--swirl-4'].forEach((token, i) =>
      gl.uniform3fv(gl.getUniformLocation(program, `u_c${i}`), tokenRgb(token))
    );

    const resize = () => {
      const width = Math.max(1, Math.round(window.innerWidth * RENDER_SCALE));
      const height = Math.max(1, Math.round(window.innerHeight * RENDER_SCALE));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
    };

    const draw = (seconds: number) => {
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let last = 0;
    const start = performance.now();

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(20 + (now - start) / 1000);
    };

    const run = () => {
      cancelAnimationFrame(frame);
      if (still.matches || document.hidden) {
        draw(20);
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    const onResize = () => {
      resize();
      if (still.matches) draw(20);
    };

    resize();
    run();
    canvas.dataset.ready = 'true';
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', run);
    still.addEventListener('change', run);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', run);
      still.removeEventListener('change', run);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100"
    />
  );
}
