// ShaderBackground.js

(function () {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is required for ShaderBackground. Please include it before this script.');
        return;
    }

    class ShaderBackground {
        constructor(config = {}) {
            this.config = {
                speed: config.speed || 1,
                graininess: config.graininess || 0.1,
                color1: config.color1 || '#800080',
                color2: config.color2 || '#1a669f',
                color3: config.color3 || '#e6b800'
            };

            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            this.renderer = new THREE.WebGLRenderer({ alpha: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            this.createShader();
            this.setupResizeHandler();
        }

        createShader() {
            const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `;

            const fragmentShader = `
                uniform float time;
                uniform float graininess;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                varying vec2 vUv;

                // Simplex 2D noise
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

                float snoise(vec2 v) {
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

                void main() {
                    vec2 uv = vUv;
                    
                    float n = snoise(uv + time * 0.1) * 0.5 + 0.5;
                    
                    vec3 color = mix(color1, color2, n);
                    color = mix(color, color3, snoise(uv * 2.0 - time * 0.05));
                    
                    float grain = snoise(uv * 1000.0) * graininess;
                    color += grain;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `;

            this.uniforms = {
                time: { value: 0 },
                graininess: { value: this.config.graininess },
                color1: { value: new THREE.Color(this.config.color1) },
                color2: { value: new THREE.Color(this.config.color2) },
                color3: { value: new THREE.Color(this.config.color3) }
            };

            const material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });

            const plane = new THREE.PlaneGeometry(2, 2);
            this.mesh = new THREE.Mesh(plane, material);
            this.scene.add(this.mesh);
        }

        setupResizeHandler() {
            window.addEventListener('resize', () => {
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.updateBackground();
            });
        }

        setSpeed(speed) {
            this.config.speed = speed;
        }

        setGraininess(graininess) {
            this.uniforms.graininess.value = graininess;
        }

        setColor(colorNum, color) {
            if (colorNum >= 1 && colorNum <= 3) {
                this.uniforms[`color${colorNum}`].value.setStyle(color);
            }
        }

        updateBackground() {
            this.renderer.render(this.scene, this.camera);
            const dataURL = this.renderer.domElement.toDataURL();
            document.body.style.backgroundImage = `url(${dataURL})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        }

        animate(time) {
            requestAnimationFrame(this.animate.bind(this));
            this.uniforms.time.value = time * 0.001 * this.config.speed;
            this.updateBackground();
        }

        start() {
            this.animate(0);
        }
    }

    // Expose ShaderBackground to the global scope
    window.ShaderBackground = ShaderBackground;
})();