import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AWESOME_COLORS,
  BOUNCE_DURATION,
  KONAMI,
  RETURN_DURATION,
  awesomeGradient,
  bounceStep,
  createKonamiTracker,
  init,
  randomPalette,
  startBounce,
} from '../js/site.js';

const sequence = (...values) => {
  const queue = [...values];
  return () => queue.shift();
};

function fakeWindow({ width = 1000, height = 800 } = {}) {
  const frames = [];
  const timers = [];
  return {
    document,
    innerWidth: width,
    innerHeight: height,
    frames,
    timers,
    requestAnimationFrame: (cb) => frames.push(cb),
    setTimeout: (cb, delay) => timers.push({ cb, delay }),
    runFrame(time) {
      frames.shift()(time);
    },
  };
}

function makeTitle(rect = { left: 100, top: 200, width: 300, height: 100 }) {
  document.body.innerHTML = '<h1>douzeEnsemble</h1>';
  const title = document.querySelector('h1');
  title.getBoundingClientRect = () => rect;
  return title;
}

describe('constantes', () => {
  it('liste les couleurs du set Everyone is awesome', () => {
    expect(AWESOME_COLORS).toEqual([
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
    ]);
  });

  it('définit le Konami code', () => {
    expect(KONAMI).toEqual([
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
    ]);
  });

  it('définit les durées', () => {
    expect(BOUNCE_DURATION).toBe(2500);
    expect(RETURN_DURATION).toBe(500);
  });
});

describe('randomPalette', () => {
  it('donne un fond sombre et un texte clair', () => {
    expect(randomPalette(sequence(0.5, 0.49))).toEqual({
      background: 'hsl(180 70% 18%)',
      color: 'hsl(0 80% 75%)',
    });
  });

  it('donne un fond clair et un texte sombre', () => {
    expect(randomPalette(sequence(0.1, 0.5))).toEqual({
      background: 'hsl(36 70% 88%)',
      color: 'hsl(216 80% 30%)',
    });
  });

  it('arrondit la teinte vers le bas', () => {
    expect(randomPalette(sequence(0.9999, 0.9)).background).toBe(
      'hsl(359 70% 88%)',
    );
  });
});

describe('awesomeGradient', () => {
  it('fait des bandes de même largeur', () => {
    expect(awesomeGradient(['red', 'blue'])).toBe(
      'linear-gradient(90deg, red 0% 50%, blue 50% 100%)',
    );
  });
});

describe('createKonamiTracker', () => {
  it('déclenche après la séquence complète', () => {
    const done = vi.fn();
    const track = createKonamiTracker(['ArrowUp', 'b', 'a'], done);
    track('ArrowUp');
    track('b');
    expect(done).not.toHaveBeenCalled();
    track('a');
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('accepte les majuscules et des touches avant la séquence', () => {
    const done = vi.fn();
    const track = createKonamiTracker(['ArrowUp', 'b', 'a'], done);
    ['x', 'ArrowUp', 'ArrowUp', 'B', 'A'].forEach(track);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('ne met pas en minuscules les touches nommées', () => {
    const done = vi.fn();
    const track = createKonamiTracker(['arrowup'], done);
    track('ArrowUp');
    expect(done).not.toHaveBeenCalled();
  });

  it('déclenche à chaque touche pour une séquence vide', () => {
    const done = vi.fn();
    const track = createKonamiTracker([], done);
    track('x');
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('ignore une séquence interrompue', () => {
    const done = vi.fn();
    const track = createKonamiTracker(['ArrowUp', 'b', 'a'], done);
    ['ArrowUp', 'b', 'x', 'a'].forEach(track);
    expect(done).not.toHaveBeenCalled();
  });
});

describe('bounceStep', () => {
  it('avance sans toucher les bords', () => {
    expect(bounceStep({ x: 10, y: 20, vx: 5, vy: -4 }, 2, 100, 100)).toEqual(
      { x: 20, y: 12, vx: 5, vy: -4 },
    );
  });

  it('rebondit sur le bord gauche', () => {
    expect(bounceStep({ x: 5, y: 50, vx: -10, vy: 0 }, 1, 100, 100)).toEqual({
      x: 0,
      y: 50,
      vx: 10,
      vy: 0,
    });
  });

  it('rebondit sur le bord droit', () => {
    expect(bounceStep({ x: 95, y: 50, vx: 10, vy: 0 }, 1, 100, 100)).toEqual({
      x: 100,
      y: 50,
      vx: -10,
      vy: 0,
    });
  });

  it('rebondit sur le bord haut', () => {
    expect(bounceStep({ x: 50, y: 5, vx: 0, vy: -10 }, 1, 100, 100)).toEqual({
      x: 50,
      y: 0,
      vx: 0,
      vy: 10,
    });
  });

  it('rebondit sur le bord bas', () => {
    expect(bounceStep({ x: 50, y: 95, vx: 0, vy: 10 }, 1, 100, 100)).toEqual({
      x: 50,
      y: 100,
      vx: 0,
      vy: -10,
    });
  });

  it('ne rebondit pas quand il arrive pile sur un bord', () => {
    expect(bounceStep({ x: 1, y: 1, vx: -1, vy: -1 }, 1, 100, 100)).toEqual({
      x: 0,
      y: 0,
      vx: -1,
      vy: -1,
    });
    expect(bounceStep({ x: 99, y: 99, vx: 1, vy: 1 }, 1, 100, 100)).toEqual({
      x: 100,
      y: 100,
      vx: 1,
      vy: 1,
    });
  });
});

describe('startBounce', () => {
  let win;
  let title;

  beforeEach(() => {
    win = fakeWindow();
    title = makeTitle();
  });

  it('place le titre en position fixe à son emplacement actuel', () => {
    startBounce(title, win, sequence(0, 0));
    expect(title.style.position).toBe('fixed');
    expect(title.style.left).toBe('0px');
    expect(title.style.top).toBe('0px');
    expect(title.style.transform).toBe('translate(100px, 200px)');
  });

  it('se déplace selon un angle et une vitesse aléatoires', () => {
    // angle 0 -> vers la droite, vitesse = 1000 * (0.9 + 0.5 * 0.6) = 1200 px/s
    startBounce(title, win, sequence(0, 0.5));
    win.runFrame(1000);
    expect(title.style.transform).toBe('translate(100px, 200px)');
    win.runFrame(1100);
    expect(title.style.transform).toBe('translate(220px, 200px)');
  });

  it('suit l’angle tiré au hasard', () => {
    // angle PI/2 -> vers le bas, vitesse = 1000 * 0.9 = 900 px/s
    startBounce(title, win, sequence(0.25, 0));
    win.runFrame(0);
    win.runFrame(100);
    const [, x, y] = title.style.transform.match(/translate\((.+)px, (.+)px\)/);
    expect(Number(x)).toBeCloseTo(100);
    expect(Number(y)).toBeCloseTo(290);
  });

  it('utilise la plus grande dimension de la fenêtre pour la vitesse', () => {
    win = fakeWindow({ width: 800, height: 1000 });
    startBounce(title, win, sequence(0, 0));
    win.runFrame(0);
    win.runFrame(100);
    expect(title.style.transform).toBe('translate(190px, 200px)');
  });

  it('rebondit sur les bords de la fenêtre', () => {
    // maxX = 1000 - 300 = 700, vitesse 1500 px/s vers la droite
    startBounce(title, win, sequence(0, 1));
    win.runFrame(0);
    win.runFrame(500);
    expect(title.style.transform).toBe('translate(700px, 200px)');
    win.runFrame(600);
    expect(title.style.transform).toBe('translate(550px, 200px)');
  });

  it('borne la zone à zéro quand le titre est plus grand que la fenêtre', () => {
    title = makeTitle({ left: 0, top: 0, width: 2000, height: 2000 });
    startBounce(title, win, sequence(0, 0));
    win.runFrame(0);
    win.runFrame(100);
    expect(title.style.transform).toBe('translate(0px, 0px)');
  });

  it('continue jusqu’à la fin de la durée puis revient au centre', async () => {
    const done = vi.fn();
    startBounce(title, win, sequence(0, 0)).then(done);
    win.runFrame(1000);
    win.runFrame(1000 + BOUNCE_DURATION - 1);
    expect(win.frames).toHaveLength(1);
    expect(win.timers).toHaveLength(0);
    win.runFrame(1000 + BOUNCE_DURATION);
    expect(win.frames).toHaveLength(0);
    expect(title.style.transition).toBe('transform 500ms ease-out');
    expect(title.style.transform).toBe('translate(350px, 350px)');
    expect(win.timers).toHaveLength(1);
    expect(win.timers[0].delay).toBe(RETURN_DURATION);

    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    win.timers[0].cb();
    await Promise.resolve();
    expect(done).toHaveBeenCalledTimes(1);
    expect(title.getAttribute('style')).toBe('');
  });
});

describe('init', () => {
  let win;
  let title;

  beforeEach(() => {
    document.body.className = '';
    document.body.removeAttribute('style');
    win = fakeWindow();
    title = makeTitle();
  });

  const press = (key) =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));

  it('applique des couleurs aléatoires', () => {
    init(win, sequence(0.5, 0.49));
    expect(document.body.style.background).toBe('rgb(14, 78, 78)');
    expect(title.style.color).toBe('rgb(242, 140, 140)');
  });

  it('passe aux couleurs Everyone is awesome avec le Konami code', () => {
    init(win, sequence(0.5, 0.49));
    KONAMI.forEach(press);
    expect(document.body.classList.contains('awesome')).toBe(true);
    expect(title.style.color).toBe('');
    expect(document.body.style.background).toContain('linear-gradient');
    expect(document.body.style.background).toContain('rgb(5, 19, 29)');
  });

  it('ne change rien sans le Konami code complet', () => {
    init(win, sequence(0.5, 0.49));
    KONAMI.slice(1).forEach(press);
    expect(document.body.classList.contains('awesome')).toBe(false);
  });

  it('fait rebondir le titre au double-clic, une seule fois à la fois', async () => {
    init(win, sequence(0.5, 0.49, 0, 0, 0, 0));
    title.dispatchEvent(new MouseEvent('dblclick'));
    expect(title.style.position).toBe('fixed');
    expect(win.frames).toHaveLength(1);

    title.dispatchEvent(new MouseEvent('dblclick'));
    expect(win.frames).toHaveLength(1);

    win.runFrame(0);
    win.runFrame(BOUNCE_DURATION);
    win.timers.shift().cb();
    await Promise.resolve();
    await Promise.resolve();
    expect(title.style.position).toBe('');

    title.dispatchEvent(new MouseEvent('dblclick'));
    expect(title.style.position).toBe('fixed');
    expect(win.frames).toHaveLength(1);
  });
});
