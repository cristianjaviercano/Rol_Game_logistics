  globeNodes() {
    // Los aeropuertos vecinos de un puerto se dibujan ~1,5° tierra adentro para que los marcadores no se tapen.
    return [
      { id: 'CTG', type: 'puerto', name: 'Cartagena', country: 'Colombia', lat: 10.39, lon: -75.51, desc: 'Terminal de contenedores del Caribe; enlaza con Róterdam, Miami y Colón.' },
      { id: 'BUN', type: 'puerto', name: 'Buenaventura', country: 'Colombia', lat: 3.88, lon: -77.03, desc: 'Puerto del Pacífico colombiano; ruta directa a Shanghái.' },
      { id: 'PAN', type: 'puerto', name: 'Colón', country: 'Panamá', lat: 9.08, lon: -79.68, desc: 'Puerto de transbordo junto al canal de Panamá.' },
      { id: 'MIA', type: 'puerto', name: 'Miami', country: 'EE. UU.', lat: 25.77, lon: -80.19, desc: 'Puerta de entrada de la carga del Caribe a EE. UU.' },
      { id: 'HOU', type: 'puerto', name: 'Houston', country: 'EE. UU.', lat: 29.76, lon: -95.36, desc: 'Puerto del golfo de México; ruta a Róterdam.' },
      { id: 'SHA', type: 'puerto', name: 'Shanghái', country: 'China', lat: 31.23, lon: 121.47, desc: 'El puerto de contenedores con mayor movimiento del mundo.' },
      { id: 'RTM', type: 'puerto', name: 'Róterdam', country: 'Países Bajos', lat: 51.92, lon: 4.48, desc: 'Principal puerta de entrada de la carga a Europa.' },
      { id: 'SUE', type: 'puerto', name: 'Suez', country: 'Egipto', lat: 29.97, lon: 32.55, desc: 'Paso obligado entre Asia y Europa por el mar Rojo.' },
      { id: 'BOG', type: 'aeropuerto', name: 'El Dorado', city: 'Bogotá', country: 'Colombia', lat: 4.70, lon: -74.14, desc: 'Principal terminal de carga aérea de Colombia: flores, frutas y perecederos.' },
      { id: 'MIA-A', type: 'aeropuerto', name: 'Internacional de Miami', city: 'Miami', country: 'EE. UU.', lat: 26.9, lon: -81.0, desc: 'Centro de carga aérea entre América Latina y el resto del mundo.' },
      { id: 'AMS', type: 'aeropuerto', name: 'Schiphol', city: 'Ámsterdam', country: 'Países Bajos', lat: 52.9, lon: 6.3, desc: 'Centro europeo de carga perecedera y farmacéutica.' },
      { id: 'PVG', type: 'aeropuerto', name: 'Pudong', city: 'Shanghái', country: 'China', lat: 32.4, lon: 120.6, desc: 'Uno de los aeropuertos de carga con más toneladas del mundo.' },
      { id: 'LRD', type: 'terminal', name: 'Laredo', country: 'México · EE. UU.', lat: 27.5, lon: -99.5, desc: 'Paso fronterizo de carga terrestre: garita, aduana con semáforo fiscal y bodega de trasbordo.' },
      { id: 'MEX', type: 'bodega', name: 'Ciudad de México', country: 'México', lat: 19.43, lon: -99.13, desc: 'Centro de distribución y bodega; escena próximamente.', soon: true }
    ];
  }

  nodeTypeInfo(type) {
    return {
      puerto: { label: 'Puerto', enter: 'Entrar al puerto', color: 0x1F5EFF },
      aeropuerto: { label: 'Aeropuerto', enter: 'Entrar al aeropuerto', color: 0xF26A1B },
      terminal: { label: 'Terminal de carga', enter: 'Entrar a la terminal', color: 0x0E9F6E },
      bodega: { label: 'Bodega', enter: 'Entrar a la bodega', color: 0x8B5CF6 }
    }[type];
  }

  initGlobe() {
    const T = window.THREE, cv = this.cv, wrap = this.wrap;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); }
    catch (e) { this.setState({ noGL: true }); return; }
    this.renderer = renderer;
    if ('useLegacyLights' in renderer) renderer.useLegacyLights = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 3.05);
    scene.add(new T.HemisphereLight(0xffffff, 0x8899bb, 0.75));
    const key = new T.DirectionalLight(0xffffff, 0.65);
    key.position.set(1.5, 2, 3);
    scene.add(key);
    const tilt = new T.Group();
    tilt.rotation.x = 0.32;
    scene.add(tilt);
    const globe = new T.Group();
    globe.rotation.y = -0.87;
    tilt.add(globe);
    const R = 1;
    const ray = new T.Raycaster(), ndc = new T.Vector2(), tmp = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
    this.g = { globe: globe, tilt: tilt, camera: camera, ray: ray, ndc: ndc, proxies: [], tmp: tmp };

    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 4096;
    mapCanvas.height = 2048;
    const mapTex = new T.CanvasTexture(mapCanvas);
    mapTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (T.SRGBColorSpace) mapTex.colorSpace = T.SRGBColorSpace;
    const coreMat = new T.MeshBasicMaterial({ map: mapTex });
    globe.add(new T.Mesh(new T.SphereGeometry(R * 0.995, 128, 96), coreMat));
    this.mapCanvas = mapCanvas;
    this.mapTex = mapTex;
    this.mapKey = '';
    fetch('/_blob/95745034f2671a95fdfd7b16a93a4b05')
      .then((r) => r.json())
      .then((data) => { this.borders = data; this.mapKey = ''; })
      .catch(() => {});
    const atmMat = new T.MeshBasicMaterial({ color: 0x1F5EFF, transparent: true, opacity: 0.07, side: T.BackSide });
    scene.add(new T.Mesh(new T.SphereGeometry(R * 1.07, 48, 32), atmMat));

    const grat = new T.LineBasicMaterial({ color: 0x9DB8F0, transparent: true, opacity: 0.3 });
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 3) pts.push(this.ll(T, lat, lon, R));
      globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), grat));
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 3) pts.push(this.ll(T, lat, lon, R));
      globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), grat));
    }

    // Materiales y modelos de baja poligonización
    const MC = {};
    const mat = (c) => MC[c] || (MC[c] = new T.MeshLambertMaterial({ color: c }));
    const box = (g, w, h, d, c, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); g.add(m); return m; };
    const makeShip = (tint) => {
      const g = new T.Group();
      const s = new T.Shape();
      s.moveTo(-0.5, -0.13); s.lineTo(0.3, -0.13); s.lineTo(0.5, 0); s.lineTo(0.3, 0.13); s.lineTo(-0.5, 0.13); s.lineTo(-0.5, -0.13);
      const hg = new T.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
      hg.rotateX(-Math.PI / 2);
      g.add(new T.Mesh(hg, mat(0x1D3557)));
      box(g, 1.0, 0.025, 0.27, 0xD62839, -0.02, 0.02, 0);
      const cols = [tint, 0xF2A93B, 0x3CC0C8, 0xFF8E9B, 0x82D27C];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) box(g, 0.13, 0.07, 0.1, cols[(i + j * 2) % cols.length], 0.24 - i * 0.14, 0.155 + j * 0.0, j ? 0.055 : -0.055);
      box(g, 0.12, 0.16, 0.22, 0xFFFFFF, -0.42, 0.2, 0);
      box(g, 0.03, 0.08, 0.03, 0x14213D, -0.44, 0.32, 0);
      g.scale.setScalar(0.062);
      return g;
    };
    const makePlane = () => {
      const g = new T.Group();
      const fus = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.82, 10), mat(0xFFFFFF));
      fus.rotation.z = Math.PI / 2; g.add(fus);
      const nose = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), mat(0xFFFFFF)); nose.position.x = 0.41; nose.scale.set(1.8, 1, 1); g.add(nose);
      const tail = new T.Mesh(new T.ConeGeometry(0.075, 0.24, 10), mat(0xFFFFFF)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.53; g.add(tail);
      box(g, 0.2, 0.018, 1.0, 0xC9D2E6, 0.02, -0.02, 0);
      box(g, 0.1, 0.014, 0.36, 0xC9D2E6, -0.5, 0.02, 0);
      box(g, 0.16, 0.2, 0.018, 0xF26A1B, -0.5, 0.12, 0);
      [0.26, -0.26].forEach((z) => { const e = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.14, 8), mat(0x9AA3B8)); e.rotation.z = Math.PI / 2; e.position.set(0.06, -0.06, z); g.add(e); });
      g.scale.setScalar(0.06);
      return g;
    };
    const makeTruck = (c) => {
      const g = new T.Group();
      box(g, 0.28, 0.3, 0.3, c, 0.38, 0.15, 0);
      box(g, 0.7, 0.36, 0.32, 0xF1EEFC, -0.14, 0.18, 0);
      g.scale.setScalar(0.035);
      return g;
    };
    const makeMarker = (type, soon) => {
      const g = new T.Group(), info = this.nodeTypeInfo(type), c = info.color;
      const ring = new T.Mesh(new T.CylinderGeometry(1, 1, 0.08, 24), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: soon ? 0.25 : 0.4 }));
      ring.position.y = 0.04; g.add(ring);
      const parts = new T.Group(); g.add(parts);
      if (type === 'puerto') {
        box(parts, 0.9, 0.45, 0.45, c, 0, 0.3, -0.25); box(parts, 0.9, 0.45, 0.45, 0xF2A93B, 0, 0.3, 0.25); box(parts, 0.9, 0.45, 0.45, 0x3CC0C8, 0, 0.75, 0);
        box(parts, 0.08, 1.6, 0.08, 0x14213D, -0.6, 0.8, 0); box(parts, 1.1, 0.08, 0.08, 0x14213D, -0.25, 1.6, 0);
      } else if (type === 'aeropuerto') {
        const tw = new T.Mesh(new T.CylinderGeometry(0.14, 0.2, 1.3, 10), mat(0xFFFFFF)); tw.position.y = 0.65; parts.add(tw);
        const cab = new T.Mesh(new T.CylinderGeometry(0.42, 0.3, 0.32, 10), mat(c)); cab.position.y = 1.42; parts.add(cab);
        box(parts, 1.6, 0.06, 0.32, 0x6B7186, 0, 0.06, 0.55);
      } else if (type === 'terminal') {
        box(parts, 1.1, 0.5, 0.7, c, 0, 0.25, 0); box(parts, 0.4, 0.45, 0.5, 0xFFFFFF, 0.75, 0.25, 0);
      } else {
        box(parts, 1.1, 0.6, 0.8, c, 0, 0.3, 0);
        const roof = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 1.1, 3), mat(0xFFFFFF)); roof.rotation.z = Math.PI / 2; roof.position.y = 0.72; roof.scale.set(1, 1, 0.8); parts.add(roof);
      }
      if (soon) parts.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } });
      g.scale.setScalar(0.028);
      return { g: g, ring: ring };
    };
    // Orienta un objeto sobre la esfera: arriba = normal, frente = dirección de avance.
    const fwd = new T.Vector3(), side = new T.Vector3(), up = new T.Vector3(), M = new T.Matrix4();
    const orient = (o, pos, next) => {
      up.copy(pos).normalize();
      fwd.copy(next).sub(pos); fwd.addScaledVector(up, -fwd.dot(up));
      if (fwd.lengthSq() < 1e-12) return;
      fwd.normalize(); side.crossVectors(fwd, up);
      M.makeBasis(fwd, up, side); o.quaternion.setFromRotationMatrix(M);
    };
    const pathOf = (wps, h) => {
      const pts = [];
      for (let i = 1; i < wps.length; i++) {
        const a = this.ll(T, wps[i - 1][0], wps[i - 1][1], 1), b = this.ll(T, wps[i][0], wps[i][1], 1);
        const n = Math.max(6, Math.ceil(a.angleTo(b) / 0.012));
        for (let j = i === 1 ? 0 : 1; j <= n; j++) pts.push(this.slerp(a, b, j / n).multiplyScalar(R + h));
      }
      return pts;
    };
    const at = (pts, t, out) => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); return out.copy(pts[i]).lerp(pts[i + 1], f - i); };

    // Nodos del mundo
    const nodes = this.globeNodes(), nodeObj = {};
    nodes.forEach((n) => {
      const mk = makeMarker(n.type, n.soon), p = this.ll(T, n.lat, n.lon, R * 1.002);
      mk.g.position.copy(p);
      mk.g.quaternion.setFromUnitVectors(UP, p.clone().normalize());
      globe.add(mk.g);
      const proxy = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      proxy.position.copy(p); proxy.userData.node = n; globe.add(proxy);
      this.g.proxies.push(proxy);
      nodeObj[n.id] = mk;
    });

    // Rutas marítimas con puntos de paso para no cruzar tierra firme
    const P = {}; nodes.forEach((n) => { P[n.id] = [n.lat, n.lon]; });
    const sea = [
      { a: 'CTG', b: 'RTM', w: [P.CTG, [15, -68], [20, -60], [35, -40], [46, -15], [49, -5], [51.2, 2], P.RTM] },
      { a: 'CTG', b: 'MIA', w: [P.CTG, [15, -76], [19.9, -74.3], [23.5, -76], [25.5, -79.5], P.MIA] },
      { a: 'HOU', b: 'RTM', w: [P.HOU, [27.5, -94], [24.5, -84], [24.2, -81], [26.5, -79.5], [35, -60], [46, -15], [49, -5], [51.2, 2], P.RTM] },
      { a: 'BUN', b: 'SHA', w: [P.BUN, [3, -80], [10, -120], [20, -160], [28, 160], [30, 130], P.SHA] },
      { a: 'CTG', b: 'PAN', w: [P.CTG, [10, -78], P.PAN] },
      { a: 'PAN', b: 'SHA', w: [P.PAN, [7, -80], [5, -90], [15, -130], [25, -170], [30, 140], P.SHA] },
      { a: 'SHA', b: 'SUE', w: [P.SHA, [25, 122], [22, 117], [10, 110], [1.3, 104], [5, 97], [6, 80], [12, 58], [12.6, 43.4], [20, 38.5], [27.5, 34], P.SUE] },
      { a: 'SUE', b: 'RTM', w: [P.SUE, [31.5, 32.3], [34, 25], [36.5, 15], [37.5, 10], [36, -5.5], [37, -9.5], [43.5, -10], [48.5, -5.5], [50, -1], [51.2, 2], P.RTM] }
    ];
    const ships = [], planes = [], trucks = [];
    const tints = [0x1F5EFF, 0xF26A1B, 0x0E9F6E, 0x8B5CF6, 0xD62839, 0x127E89];
    sea.forEach((rt, i) => {
      const pts = pathOf(rt.w, 0.004);
      const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x1F5EFF, transparent: true, opacity: 0.8 }));
      globe.add(line);
      const L = pts.length, count = L > 160 ? 2 : 1;
      for (let s = 0; s < count; s++) {
        const m = makeShip(tints[(i + s) % tints.length]);
        globe.add(m);
        ships.push({ m: m, pts: pts, t: (s / count + i * 0.17) % 1, dir: s % 2 ? -1 : 1, a: rt.a, b: rt.b, line: line, speed: 0.045 / L + 0.00004 });
      }
    });
    // Rutas aéreas: arcos altos y línea discontinua
    const air = [['BOG', 'MIA-A'], ['MIA-A', 'AMS'], ['AMS', 'PVG'], ['BOG', 'AMS'], ['PVG', 'MIA-A']];
    air.forEach((rt, i) => {
      const va = this.ll(T, P[rt[0]][0], P[rt[0]][1], 1), vb = this.ll(T, P[rt[1]][0], P[rt[1]][1], 1);
      const ang = va.angleTo(vb), pts = [], n = 140;
      for (let j = 0; j <= n; j++) { const t = j / n; pts.push(this.slerp(va, vb, t).multiplyScalar(R + 0.006 + Math.sin(Math.PI * t) * (0.03 + ang * 0.05))); }
      const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0xF26A1B, dashSize: 0.025, gapSize: 0.018, transparent: true, opacity: 0.9 }));
      line.computeLineDistances();
      globe.add(line);
      const m = makePlane();
      globe.add(m);
      planes.push({ m: m, pts: pts, t: (i * 0.23) % 1, dir: i % 2 ? -1 : 1, a: rt[0], b: rt[1], line: line, speed: 0.0011 / Math.max(ang, 0.35) + 0.0004 });
    });
    // Corredores terrestres (camiones)
    const land = [
      { a: 'BOG', b: 'CTG', w: [P.BOG, [5.8, -74.6], [7.1, -73.1], [8.9, -74.1], [9.9, -75.1], P.CTG] },
      { a: 'BOG', b: 'BUN', w: [P.BOG, [4.44, -75.23], [4.1, -76.2], [3.95, -76.6], P.BUN] },
      { a: 'LRD', b: 'MEX', w: [P.LRD, [25.7, -100.3], [22.15, -100.98], P.MEX] }
    ];
    land.forEach((rt, i) => {
      const pts = pathOf(rt.w, 0.003);
      const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0x0E9F6E, dashSize: 0.008, gapSize: 0.006 }));
      line.computeLineDistances();
      globe.add(line);
      [0, 0.5].forEach((o, k) => { const m = makeTruck(tints[(i * 2 + k) % tints.length]); globe.add(m); trucks.push({ m: m, pts: pts, t: o, dir: k ? -1 : 1, a: rt.a, b: rt.b, speed: 0.0025 }); });
    });

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    if (window.ResizeObserver) { this.ro = new ResizeObserver(resize); this.ro.observe(wrap); }
    resize();

    let ph = 0, lastNight = null;
    const C = (hex) => new T.Color(hex);
    let pal = null;
    const pos = new T.Vector3(), nxt = new T.Vector3();
    const move = (v, spd) => {
      v.t += spd * v.dir;
      if (v.t > 1) { v.t = 1; v.dir = -1; } else if (v.t < 0) { v.t = 0; v.dir = 1; }
      at(v.pts, v.t, pos); at(v.pts, Math.max(0, Math.min(1, v.t + 0.004 * v.dir)), nxt);
      v.m.position.copy(pos);
      if (pos.distanceToSquared(nxt) > 1e-12) orient(v.m, pos, nxt);
    };
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (this.state.inside) return;
      ph += 0.05;
      const night = this.isNight();
      if (night !== lastNight) {
        lastNight = night;
        const g = this.theme().g;
        pal = { route: C(g.route), port: C(g.port), ship: C(g.ship), alert: C(g.alert), air: C(0xF26A1B) };
        grat.color.setHex(g.grat);
        atmMat.color.setHex(g.atm);
      }
      const act = this.state.active || {};
      const alertIds = this.alertCountries(act);
      const mk = (night ? 'n' : 'd') + '|' + (this.borders ? 'b' : '-') + '|' + alertIds.join(',');
      if (mk !== this.mapKey) { this.mapKey = mk; this.paintMap(night, alertIds); }
      const alert = { CTG: !!act.tormenta || !!act.congestion, RTM: !!act.huelga, PAN: !!act.sequia, SUE: !!act.marrojo };
      const hov = this.state.hover && this.state.hover.id, sel = this.state.nodeSel && this.state.nodeSel.id;
      nodes.forEach((n) => {
        const o = nodeObj[n.id], k = alert[n.id] ? 1.5 + 0.5 * Math.sin(ph * 2) : (n.id === hov || n.id === sel ? 1.35 : 1);
        o.g.scale.setScalar(0.028 * k);
        o.ring.material.color.setHex(alert[n.id] ? 0xD62839 : this.nodeTypeInfo(n.type).color);
        o.ring.material.opacity = n.id === sel ? 0.75 : (n.soon ? 0.25 : 0.4);
      });
      const paused = this.state.paused, slowAll = (act.pandemia ? 0.5 : 1) * (act.ciber ? 0.6 : 1);
      ships.forEach((s) => {
        const blocked = (alert.CTG && (s.a === 'CTG' || s.b === 'CTG')) || (alert.RTM && (s.a === 'RTM' || s.b === 'RTM')) || (alert.SUE && (s.a === 'SUE' || s.b === 'SUE'));
        const slow = alert.PAN && (s.a === 'PAN' || s.b === 'PAN');
        move(s, paused || blocked ? 0 : (slow ? s.speed * 0.25 : s.speed) * slowAll);
        s.line.material.color.copy(blocked || slow ? pal.alert : pal.route);
      });
      planes.forEach((p) => move(p, paused ? 0 : p.speed * (act.pandemia ? 0.4 : 1)));
      trucks.forEach((k) => move(k, paused ? 0 : k.speed * (act.tormenta && (k.b === 'CTG') ? 0.3 : 1)));
      if (!this.drag && !this.state.nodeSel && this.props.rotar !== false) globe.rotation.y += 0.0012;
      renderer.render(scene, camera);
    };
    tick();
  }

  pickNode(e) {
    if (!this.g || !this.cv) return null;
    const r = this.cv.getBoundingClientRect(), g = this.g;
    g.ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    g.ray.setFromCamera(g.ndc, g.camera);
    const hits = g.ray.intersectObjects(g.proxies, false);
    let best = null, bd = Infinity;
    hits.forEach((h) => {
      h.object.getWorldPosition(g.tmp);
      if (g.tmp.z <= 0.12) return;
      const d = g.ray.ray.distanceSqToPoint(g.tmp);
      if (d < bd) { bd = d; best = h.object.userData.node; }
    });
    return best ? { node: best, x: e.clientX - r.left, y: e.clientY - r.top } : null;
  }
