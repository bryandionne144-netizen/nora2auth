// Singularité: a self-contained demoscene served by the Worker.
// Feedback kaleidoscope, a pupil that tracks the pointer, and music
// synthesized in the browser. No assets, no libraries.

export function renderFou(): string {
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Singularité</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
    canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
      touch-action: none;
    }
    #veil {
      position: fixed;
      inset: 0;
      z-index: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding: 32px;
      text-align: center;
      color: #f4f1ea;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.08), rgba(0,0,0,0.62));
      cursor: pointer;
      transition: opacity 0.9s ease;
    }
    #veil.gone { opacity: 0; pointer-events: none; }
    .kicker {
      margin: 0;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 11px;
      letter-spacing: 0.46em;
      text-transform: uppercase;
      opacity: 0.72;
    }
    h1 {
      margin: 0;
      font-family: "Iowan Old Style", Palatino, Georgia, serif;
      font-weight: 500;
      font-size: clamp(64px, 12vw, 148px);
      letter-spacing: -0.045em;
      line-height: 0.85;
    }
    .sub {
      margin: 0;
      max-width: 34rem;
      font-family: "Iowan Old Style", Palatino, Georgia, serif;
      font-size: 18px;
      line-height: 1.45;
      opacity: 0.88;
    }
    .cta {
      margin: 8px 0 0;
      padding: 12px 22px;
      border: 1px solid rgba(244,241,234,0.55);
      border-radius: 999px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    #veil:hover .cta { background: #f4f1ea; color: #090909; }
    #brand, #hud, #toast {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      color: rgba(244,241,234,0.88);
    }
    #brand {
      position: fixed;
      top: 20px;
      left: 24px;
      z-index: 3;
      font-size: 11px;
      letter-spacing: 0.42em;
      opacity: 0;
      transition: opacity 1s ease;
      pointer-events: none;
    }
    #phrase {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 3;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 1s ease;
      pointer-events: none;
    }
    body.live #brand, body.live #phrase, body.live #hud { opacity: 1; }
    #hud {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      padding: 18px 24px 16px;
      font-size: 11px;
      letter-spacing: 0.06em;
      line-height: 1.55;
      opacity: 0;
      transition: opacity 1s ease;
      pointer-events: none;
      text-shadow: 0 1px 8px rgba(0,0,0,0.65);
    }
    #hud a, #hud button {
      pointer-events: auto;
      color: inherit;
      background: transparent;
      border: 0;
      padding: 0;
      font: inherit;
      letter-spacing: inherit;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
    #toast {
      position: fixed;
      top: 46%;
      left: 50%;
      z-index: 5;
      transform: translate(-50%, -120px);
      font-size: 12px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 0.45s ease;
      pointer-events: none;
    }
    #toast.show { opacity: 1; }
    #err {
      position: fixed;
      left: 16px;
      bottom: 64px;
      z-index: 6;
      margin: 0;
      max-width: min(640px, 92vw);
      color: #ffb4a8;
      font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div id="brand">SINGULARITÉ</div>
  <div id="phrase"></div>
  <div id="hud">
    <div id="help">souris pour tordre · clic maintenu pour déchirer<br>espace onde · 1–4 couleurs · m mode · p plein écran · écris fou</div>
    <div>
      <span id="clock">00:00</span>
      · <span id="fps">—</span>
      · <button id="mute" type="button">son on</button>
      · <a href="/classique">version sage</a>
    </div>
  </div>
  <div id="toast"></div>
  <div id="veil">
    <p class="kicker">un worker qui a lâché le SQL</p>
    <h1>Singularité</h1>
    <p class="sub">Un tunnel qui se souvient de chaque image, un œil qui suit ta main, et une musique qui n’existe que pendant que tu regardes.</p>
    <p class="cta">clique pour entrer</p>
  </div>
  <pre id="err"></pre>
  <script>
    (function () {
      var canvas = document.getElementById("c");
      var veil = document.getElementById("veil");
      var err = document.getElementById("err");
      var gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false
      });
      if (!gl) {
        err.textContent = "WebGL est indisponible dans ce navigateur.";
        return;
      }

      var vsSource = [
        "attribute vec2 a_pos;",
        "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }"
      ].join("\\n");

      var accumSource = [
        "precision highp float;",
        "uniform vec2 u_res;",
        "uniform float u_time;",
        "uniform vec2 u_mouse;",
        "uniform float u_pulse;",
        "uniform float u_shift;",
        "uniform float u_madness;",
        "uniform float u_mode;",
        "uniform sampler2D u_prev;",
        "vec3 palette(float t) {",
        "  vec3 d = vec3(0.00, 0.10, 0.25);",
        "  if (u_shift > 0.5 && u_shift < 1.5) d = vec3(0.12, 0.46, 0.02);",
        "  else if (u_shift >= 1.5 && u_shift < 2.5) d = vec3(0.02, 0.48, 0.70);",
        "  else if (u_shift >= 2.5) d = vec3(0.80, 0.08, 0.40);",
        "  return 0.5 + 0.5 * cos(6.2831853 * (t + d));",
        "}",
        "void main() {",
        "  vec2 frag = gl_FragCoord.xy;",
        "  vec2 uv = (frag - 0.5 * u_res) / min(u_res.x, u_res.y);",
        "  float sides = mix(6.0, 13.0, u_madness);",
        "  float ang = atan(uv.y, uv.x);",
        "  float rad = length(uv);",
        "  float slice = 6.2831853 / sides;",
        "  ang = abs(mod(ang + u_time * 0.04, slice) - slice * 0.5);",
        "  ang += u_mouse.x * 0.4;",
        "  vec2 p = vec2(cos(ang), sin(ang)) * rad;",
        "  float zoom = mix(0.968, 0.90, u_madness) - u_pulse * 0.05;",
        "  float rot = 0.016 + u_mouse.y * 0.03;",
        "  mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));",
        "  vec2 fp = R * p * zoom;",
        "  vec2 suv = (fp * min(u_res.x, u_res.y) + 0.5 * u_res) / u_res;",
        "  float ca = 0.0035 + u_pulse * 0.012 + u_madness * 0.004;",
        "  vec3 prev;",
        "  prev.r = texture2D(u_prev, suv + vec2(ca, 0.0)).r;",
        "  prev.g = texture2D(u_prev, suv).g;",
        "  prev.b = texture2D(u_prev, suv - vec2(ca, 0.0)).b;",
        "  float t = u_time;",
        "  vec2 q = p * (3.2 + u_madness * 5.0) + u_mouse * 1.5;",
        "  float w1 = sin(q.x * 2.1 + t * 0.65) * cos(q.y * 1.6 - t * 0.45);",
        "  float w2 = sin(length(q) * (5.5 + u_mode * 7.0) - t * 2.6);",
        "  float w3 = sin((q.x + q.y) * 3.4 + t * 0.8);",
        "  float n = w1 * 0.55 + w2 * 0.4 + w3 * 0.25;",
        "  vec2 sp = abs(p * (4.0 + u_madness * 3.0));",
        "  float storm = sin(sp.x * sp.y * 1.7 + t * 1.6) * cos(sp.x - sp.y * 1.3 - t);",
        "  n = mix(n, storm, u_mode);",
        "  float ringR = fract(t * 0.11) * 1.55;",
        "  float ring = smoothstep(0.028, 0.0, abs(rad - ringR)) * (1.0 - ringR / 1.55);",
        "  float beam = pow(abs(sin(ang * sides)), 22.0) * exp(-rad * 1.35);",
        "  float core = exp(-rad * 3.4) * (0.22 + u_pulse * 1.15);",
        "  vec3 ink = palette(n * 0.2 + rad * 0.4 + t * 0.045);",
        "  float mask = smoothstep(-0.15, 0.85, n);",
        "  vec3 col = ink * mask * 0.42;",
        "  col += palette(0.72) * ring * 1.25;",
        "  col += palette(0.15 + t * 0.02) * beam * 0.55;",
        "  col += vec3(1.0, 0.96, 0.9) * core;",
        "  float decay = mix(0.93, 0.80, u_madness);",
        "  decay = mix(decay, 0.86, u_mode);",
        "  vec3 outc = prev * decay + col;",
        "  outc = outc / (1.0 + outc * 0.22);",
        "  gl_FragColor = vec4(outc, 1.0);",
        "}"
      ].join("\\n");

      var displaySource = [
        "precision highp float;",
        "uniform sampler2D u_tex;",
        "uniform vec2 u_res;",
        "uniform float u_time;",
        "uniform vec2 u_mouse;",
        "uniform float u_shift;",
        "uniform float u_pulse;",
        "vec3 palette(float t) {",
        "  vec3 d = vec3(0.00, 0.10, 0.25);",
        "  if (u_shift > 0.5 && u_shift < 1.5) d = vec3(0.12, 0.46, 0.02);",
        "  else if (u_shift >= 1.5 && u_shift < 2.5) d = vec3(0.02, 0.48, 0.70);",
        "  else if (u_shift >= 2.5) d = vec3(0.80, 0.08, 0.40);",
        "  return 0.5 + 0.5 * cos(6.2831853 * (t + d));",
        "}",
        "void main() {",
        "  vec2 uv01 = gl_FragCoord.xy / u_res;",
        "  vec3 c = texture2D(u_tex, uv01).rgb;",
        "  float luma = dot(c, vec3(0.299, 0.587, 0.114));",
        "  c = mix(vec3(luma), c, 1.4);",
        "  c = (c - 0.42) * 1.08 + 0.42;",
        "  c = max(c, 0.0);",
        "  float grain = fract(sin(dot(gl_FragCoord.xy + vec2(u_time * 13.0, u_time), vec2(12.9898, 78.233))) * 43758.5453);",
        "  c += (grain - 0.5) * 0.04;",
        "  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);",
        "  float vig = smoothstep(1.2, 0.22, length(p));",
        "  c *= mix(0.28, 1.0, vig);",
        "  float blinkWave = clamp(sin(u_time * 0.62), 0.0, 1.0);",
        "  float blinking = smoothstep(0.985, 0.998, blinkWave);",
        "  float openness = mix(1.0, 0.04, blinking);",
        "  vec2 e = vec2(p.x * 0.82, p.y / openness);",
        "  float ed = length(e);",
        "  float ball = smoothstep(0.185, 0.158, ed);",
        "  vec2 pu = e - u_mouse * 0.05;",
        "  float ir = length(pu);",
        "  float ia = atan(pu.y, pu.x);",
        "  float fibers = 0.62 + 0.38 * sin(ia * 16.0 + sin(ir * 70.0));",
        "  vec3 iris = palette(0.58) * (0.45 + 0.55 * fibers);",
        "  float pupilR = 0.036 + u_pulse * 0.02;",
        "  vec3 eye = vec3(0.94, 0.95, 0.93);",
        "  eye *= mix(0.45, 1.0, smoothstep(0.19, 0.02, ed));",
        "  eye = mix(eye, iris, smoothstep(0.098, 0.08, ir));",
        "  eye = mix(eye, iris * 0.25, smoothstep(0.09, 0.1, ir) * smoothstep(0.125, 0.1, ir));",
        "  eye = mix(eye, vec3(0.015, 0.012, 0.02), smoothstep(pupilR, pupilR - 0.01, ir));",
        "  float spec = smoothstep(0.016, 0.0, length(pu - vec2(-0.02, 0.018)));",
        "  eye += spec;",
        "  c = mix(c, eye, ball);",
        "  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);",
        "}"
      ].join("\\n");

      function compile(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(shader) || "shader");
        }
        return shader;
      }

      function program(fsSource) {
        var p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(p) || "link");
        }
        return p;
      }

      var accum, display;
      try {
        accum = program(accumSource);
        display = program(displaySource);
      } catch (e) {
        err.textContent = String(e && e.message ? e.message : e);
        return;
      }

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
      ]), gl.STATIC_DRAW);

      function bindPos(p) {
        var loc = gl.getAttribLocation(p, "a_pos");
        gl.enableVertexAttribArray(loc);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }

      var textures = [null, null];
      var fbos = [null, null];
      var bufW = 0;
      var bufH = 0;
      var ping = 0;

      function makeTarget(w, h) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { tex: tex, fb: fb };
      }

      function resize() {
        var cssW = window.innerWidth;
        var cssH = window.innerHeight;
        var longEdge = Math.max(cssW, cssH);
        var cap = longEdge > 1100 ? 1100 / longEdge : 1;
        var w = Math.max(2, Math.floor(cssW * cap));
        var h = Math.max(2, Math.floor(cssH * cap));
        if (w === bufW && h === bufH) return;
        bufW = w;
        bufH = h;
        canvas.width = w;
        canvas.height = h;
        for (var i = 0; i < 2; i++) {
          if (textures[i]) gl.deleteTexture(textures[i]);
          if (fbos[i]) gl.deleteFramebuffer(fbos[i]);
          var target = makeTarget(w, h);
          textures[i] = target.tex;
          fbos[i] = target.fb;
        }
      }

      var mouseX = 0;
      var mouseY = 0;
      var targetX = 0;
      var targetY = 0;
      var lastMove = 0;
      var tearing = false;
      var palette = 0;
      var mode = 0;
      var madness = 0;
      var manual = 0;
      var beat = 0;
      var born = 0;
      var frames = 0;
      var fpsStamp = performance.now();
      var fps = 0;
      var typed = "";
      var phrases = [
        "le vide te regarde",
        "tu es déjà dans la boucle",
        "ne cligne pas des yeux",
        "ceci n’est plus une table SQL",
        "reste. le tunnel apprend"
      ];
      var phraseAt = 0;

      function showToast(text) {
        var toast = document.getElementById("toast");
        toast.textContent = text;
        toast.classList.add("show");
        setTimeout(function () { toast.classList.remove("show"); }, 1600);
      }

      window.addEventListener("pointermove", function (e) {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = 1 - (e.clientY / window.innerHeight) * 2;
        lastMove = performance.now();
      });
      window.addEventListener("pointerdown", function (e) {
        if (e.target.closest && e.target.closest("#hud a, #hud button")) return;
        tearing = true;
      });
      window.addEventListener("pointerup", function () { tearing = false; });
      window.addEventListener("pointercancel", function () { tearing = false; });

      var scales = [
        [0, 3, 5, 7, 10, 12, 15],
        [0, 2, 3, 7, 8, 12, 14],
        [0, 5, 7, 10, 12, 17],
        [0, 1, 5, 6, 8, 13]
      ];
      var audio = {
        ctx: null,
        master: null,
        filter: null,
        analyser: null,
        data: null,
        started: false,
        step: 0,
        next: 0,
        muted: false,
        start: function () {
          if (this.started) {
            if (this.ctx.state === "suspended") this.ctx.resume();
            return;
          }
          var Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          var ctx = new Ctx();
          this.ctx = ctx;
          var master = ctx.createGain();
          master.gain.value = 0.2;
          this.master = master;
          var analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          this.analyser = analyser;
          this.data = new Uint8Array(analyser.frequencyBinCount);
          master.connect(analyser);
          analyser.connect(ctx.destination);

          var dry = ctx.createGain();
          dry.gain.value = 0.85;
          var wet = ctx.createGain();
          wet.gain.value = 0.4;
          var conv = ctx.createConvolver();
          var len = ctx.sampleRate * 2;
          var impulse = ctx.createBuffer(2, len, ctx.sampleRate);
          for (var c = 0; c < 2; c++) {
            var channel = impulse.getChannelData(c);
            for (var i = 0; i < len; i++) {
              channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
            }
          }
          conv.buffer = impulse;
          wet.connect(conv);
          conv.connect(master);
          dry.connect(master);

          var filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 420;
          filter.Q.value = 0.7;
          this.filter = filter;
          filter.connect(dry);
          filter.connect(wet);

          function tone(freq, detune, type) {
            var osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start();
          }
          tone(52, 0, "sine");
          tone(52, -8, "sawtooth");
          tone(52 * 1.005, 6, "sawtooth");

          this.started = true;
          this.next = ctx.currentTime + 0.2;
          var self = this;
          function blip(freq, time, dur, gain) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0.0001, time);
            g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            osc.connect(g);
            g.connect(filter);
            osc.start(time);
            osc.stop(time + dur + 0.02);
          }
          function kick(time) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(38, time + 0.14);
            g.gain.setValueAtTime(0.7, time);
            g.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
            osc.connect(g);
            g.connect(master);
            osc.start(time);
            osc.stop(time + 0.34);
          }
          function tick() {
            if (!self.started) return;
            var scale = scales[palette];
            var semis = scale[self.step % scale.length];
            var freq = 196 * Math.pow(2, semis / 12);
            if (self.step % 8 === 0) {
              kick(self.next);
              beat = 1;
            } else if (self.step % 2 === 0) {
              blip(freq, self.next, 0.42, 0.12);
            }
            self.step += 1;
            self.next += 0.28;
            var wait = Math.max(30, (self.next - ctx.currentTime - 0.08) * 1000);
            setTimeout(tick, wait);
          }
          tick();
        },
        burst: function () {
          if (!this.started) return;
          var ctx = this.ctx;
          var dur = 0.45;
          var n = Math.floor(ctx.sampleRate * dur);
          var buf = ctx.createBuffer(1, n, ctx.sampleRate);
          var data = buf.getChannelData(0);
          for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
          var src = ctx.createBufferSource();
          src.buffer = buf;
          var bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = 640 + palette * 180;
          var g = ctx.createGain();
          g.gain.value = 0.35;
          src.connect(bp);
          bp.connect(g);
          g.connect(this.master);
          src.start();
        },
        level: function () {
          if (!this.analyser) return 0;
          this.analyser.getByteFrequencyData(this.data);
          var sum = 0;
          var n = 24;
          for (var i = 0; i < n; i++) sum += this.data[i];
          return sum / (n * 255);
        },
        setMuted: function (muted) {
          this.muted = muted;
          if (this.master) this.master.gain.value = muted ? 0 : 0.2;
        }
      };

      function enter() {
        if (!born) born = performance.now();
        veil.classList.add("gone");
        document.body.classList.add("live");
        audio.start();
      }

      veil.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        enter();
      });

      document.getElementById("mute").addEventListener("click", function () {
        audio.setMuted(!audio.muted);
        this.textContent = audio.muted ? "son off" : "son on";
      });

      document.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
          e.preventDefault();
          manual = 1;
          audio.burst();
          if (!born) enter();
          return;
        }
        if (e.key >= "1" && e.key <= "4") {
          palette = Number(e.key) - 1;
          showToast("palette " + e.key);
          return;
        }
        if (e.key === "m" || e.key === "M") {
          mode = mode > 0.5 ? 0 : 1;
          showToast(mode ? "tempête" : "tunnel");
          return;
        }
        if (e.key === "p" || e.key === "P") {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
          return;
        }
        if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          typed = (typed + e.key.toLowerCase()).slice(-3);
          if (typed === "fou") {
            madness = 1;
            manual = 1;
            audio.burst();
            showToast("le mot est lâché");
            typed = "";
          }
        }
      });

      if (/[?&]plonge=1/.test(location.search)) enter();

      function pad(n) { return (n < 10 ? "0" : "") + n; }

      function frame(now) {
        resize();
        if (performance.now() - lastMove > 2200) {
          var drift = now * 0.001;
          targetX = Math.sin(drift * 0.17) * 0.7;
          targetY = Math.cos(drift * 0.13) * 0.42;
        }
        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;
        madness *= 0.993;
        manual *= 0.9;
        beat *= 0.86;
        var pulse = Math.max(manual, beat, audio.level() * 0.85);
        var mad = Math.min(1, madness + (tearing ? 0.9 : 0));
        var time = now * 0.001;

        if (audio.filter) {
          var wobble = 260 + 820 * (0.5 + 0.5 * Math.sin(time * 0.18)) + pulse * 900;
          audio.filter.frequency.setTargetAtTime(wobble, audio.ctx.currentTime, 0.08);
        }

        gl.viewport(0, 0, bufW, bufH);
        gl.useProgram(accum);
        bindPos(accum);
        gl.uniform2f(gl.getUniformLocation(accum, "u_res"), bufW, bufH);
        gl.uniform1f(gl.getUniformLocation(accum, "u_time"), time);
        gl.uniform2f(gl.getUniformLocation(accum, "u_mouse"), mouseX, mouseY);
        gl.uniform1f(gl.getUniformLocation(accum, "u_pulse"), pulse);
        gl.uniform1f(gl.getUniformLocation(accum, "u_shift"), palette);
        gl.uniform1f(gl.getUniformLocation(accum, "u_madness"), mad);
        gl.uniform1f(gl.getUniformLocation(accum, "u_mode"), mode);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[1 - ping]);
        gl.uniform1i(gl.getUniformLocation(accum, "u_prev"), 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[ping]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.useProgram(display);
        bindPos(display);
        gl.uniform2f(gl.getUniformLocation(display, "u_res"), bufW, bufH);
        gl.uniform1f(gl.getUniformLocation(display, "u_time"), time);
        gl.uniform2f(gl.getUniformLocation(display, "u_mouse"), mouseX, mouseY);
        gl.uniform1f(gl.getUniformLocation(display, "u_shift"), palette);
        gl.uniform1f(gl.getUniformLocation(display, "u_pulse"), pulse);
        gl.bindTexture(gl.TEXTURE_2D, textures[ping]);
        gl.uniform1i(gl.getUniformLocation(display, "u_tex"), 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        ping = 1 - ping;

        frames += 1;
        if (now - fpsStamp > 500) {
          fps = Math.round(frames * 1000 / (now - fpsStamp));
          frames = 0;
          fpsStamp = now;
          document.getElementById("fps").textContent = fps + " fps";
        }
        if (born) {
          var elapsed = Math.floor((now - born) / 1000);
          document.getElementById("clock").textContent = pad(Math.floor(elapsed / 60)) + ":" + pad(elapsed % 60);
        }
        if (now - phraseAt > 4200) {
          phraseAt = now;
          var phrase = phrases[Math.floor(now / 4200) % phrases.length];
          document.getElementById("phrase").textContent = phrase;
        }
        requestAnimationFrame(frame);
      }

      resize();
      requestAnimationFrame(frame);
    })();
  </script>
</body>
</html>`;
}
