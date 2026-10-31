// Couleurs LEGO des 11 figurines du set 40516, de gauche à droite :
// noir, marron, arc-en-ciel (rouge à violet), puis drapeau trans.
export const AWESOME_COLORS = [
  '#05131d',
  '#582a12',
  '#c91a09',
  '#fe8a18',
  '#f2cd37',
  '#4b9f4a',
  '#0055bf',
  '#3f3691',
  '#9fc3e9',
  '#c870a0',
  '#ffffff',
];

export const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export const BOUNCE_DURATION = 2500;
export const RETURN_DURATION = 500;

// Fond et texte de teintes opposées, l'un clair et l'autre sombre.
export function randomPalette(random) {
  const hue = Math.floor(random() * 360);
  const dark = random() < 0.5;
  return {
    background: `hsl(${hue} 70% ${dark ? 18 : 88}%)`,
    color: `hsl(${(hue + 180) % 360} 80% ${dark ? 75 : 30}%)`,
  };
}

export function awesomeGradient(colors) {
  const width = 100 / colors.length;
  const stops = colors.map(
    (color, i) => `${color} ${i * width}% ${(i + 1) * width}%`,
  );
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export function createKonamiTracker(sequence, onComplete) {
  const keys = [];
  return (key) => {
    keys.push(key.length === 1 ? key.toLowerCase() : key);
    if (keys.length > sequence.length) {
      keys.shift();
    }
    if (keys.join() === sequence.join()) {
      onComplete();
    }
  };
}

// Avance d'un pas et rebondit sur les bords de la zone [0, maxX] x [0, maxY].
export function bounceStep({ x, y, vx, vy }, dt, maxX, maxY) {
  const next = { x: x + vx * dt, y: y + vy * dt, vx, vy };
  if (next.x < 0) {
    next.x = 0;
    next.vx = Math.abs(vx);
  }
  if (next.x > maxX) {
    next.x = maxX;
    next.vx = -Math.abs(vx);
  }
  if (next.y < 0) {
    next.y = 0;
    next.vy = Math.abs(vy);
  }
  if (next.y > maxY) {
    next.y = maxY;
    next.vy = -Math.abs(vy);
  }
  return next;
}

const translate = (x, y) => `translate(${x}px, ${y}px)`;

// Fait rebondir l'élément pendant BOUNCE_DURATION puis le ramène au centre.
export function startBounce(el, win, random) {
  const rect = el.getBoundingClientRect();
  const maxX = Math.max(0, win.innerWidth - rect.width);
  const maxY = Math.max(0, win.innerHeight - rect.height);
  const angle = random() * Math.PI * 2;
  const speed =
    Math.max(win.innerWidth, win.innerHeight) * (0.9 + random() * 0.6);
  let state = {
    x: rect.left,
    y: rect.top,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
  Object.assign(el.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: translate(state.x, state.y),
  });

  return new Promise((resolve) => {
    const finish = () => {
      el.style.transition = `transform ${RETURN_DURATION}ms ease-out`;
      el.style.transform = translate(maxX / 2, maxY / 2);
      win.setTimeout(() => {
        Object.assign(el.style, {
          position: '',
          left: '',
          top: '',
          transform: '',
          transition: '',
        });
        resolve();
      }, RETURN_DURATION);
    };

    win.requestAnimationFrame((start) => {
      let last = start;
      const frame = (now) => {
        state = bounceStep(state, (now - last) / 1000, maxX, maxY);
        last = now;
        el.style.transform = translate(state.x, state.y);
        if (now - start < BOUNCE_DURATION) {
          win.requestAnimationFrame(frame);
        } else {
          finish();
        }
      };
      frame(start);
    });
  });
}

export function init(win, random) {
  const { body } = win.document;
  const title = win.document.querySelector('h1');

  const palette = randomPalette(random);
  body.style.background = palette.background;
  title.style.color = palette.color;

  const konami = createKonamiTracker(KONAMI, () => {
    body.style.background = awesomeGradient(AWESOME_COLORS);
    title.style.color = '';
    body.classList.add('awesome');
  });
  win.document.addEventListener('keydown', (event) => konami(event.key));

  let bouncing = false;
  title.addEventListener('dblclick', async () => {
    if (bouncing) {
      return;
    }
    bouncing = true;
    await startBounce(title, win, random);
    bouncing = false;
  });
}
