import Matter from 'matter-js';
import vkey from 'vkey';

// module aliases
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;

let WIDTH;
let HEIGHT;
const OFFSET = 1;  // 使用的是Matterjs 0.10.0。如果是最新的，可能要设置成10

const KEYS = [
  // Normal keys
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', null],
  [null, 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  [null, 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', null],
  [null, null, 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', null, null],

  // Numpad keys
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'num-/', 'num-*', 'num--'],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'num-7', 'num-8', 'num-9', 'num-+'],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'num-4', 'num-5', 'num-6', null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'num-1', 'num-2', 'num-3', null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'num-0', null, 'num-.', null]
];
const positions = {};

let engine;
let render;
let boundaries;
let platform;

let lastKeys = '';
let rainMode;

function onResize() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  if (!engine) {
    engine = Engine.create();
  }

  // 生成键盘字母对应的位置
  generatePositions();

  if (!render) {
    render = Render.create({
      element: document.querySelector('.content'),
      engine: engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        background: '#222',
        wireframes: false,
        enableSleeping: true
      }
    });
  } else {
    // 获取渲染器的画布对象
    const canvas = render.canvas;

    // 设置画布的宽度和高度
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }

  render.options.width = WIDTH;
  render.options.height = HEIGHT;  

  // 如果有边界，那就移除
  if (boundaries) {
    Composite.remove(engine.world, boundaries)
  }

  boundaries = generateBoundaries();
  Composite.add(engine.world, boundaries);

  platform = boundaries[2];

}

onResize();
window.addEventListener('resize', onResize);

function preloadImg (url) {
  const img = new window.Image()
  img.src = url
}

function generatePositions() {
  KEYS.forEach((row) => {
    row.forEach((letter, i) => {
      if (!letter) {
        return; // 功能键，忽略
      }

      positions[letter] = ((i / row.length) + (0.5 / row.length)) * WIDTH;

      // 预加载
      preloadImg(getImagePath(letter));
    })
  })
}

Matter.Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach(function (pair) {
    var bodyA = pair.bodyA;
    var bodyB = pair.bodyB;

    if (bodyA === platform) {
      Composite.remove(engine.world, [bodyB]);
    }

    if (bodyB === platform) {
      Composite.remove(engine.world, [bodyB]);
    }
  })
});


function generateBoundaries() {
  return [
    Bodies.rectangle(WIDTH / 4, HEIGHT + 30, WIDTH / 2, OFFSET, {
      angle: -0.1,
      isStatic: true,
      friction: 0.001,
      render: {
        fillStyle: '#fff',
        visible: false
      }
    }),

    Bodies.rectangle((WIDTH / 4) * 3, HEIGHT + 30, WIDTH / 2, OFFSET, {
      angle: 0.1,
      isStatic: true,
      friction: 0.001,
      render: {
        fillStyle: '#fff',
        visible: false
      }
    }),

    Bodies.rectangle(WIDTH / 2, HEIGHT + 400, WIDTH * 4, OFFSET, {
      isStatic: true,
      restitution: 0.9,
      friction: 0.001,
      render: {
        fillStyle: '#fff',
        visible: false
      }
    })
  ]
}

// run the renderer
Render.run(render);

// create runner
const runner = Runner.create();

// run the engine
Runner.run(runner, engine);

document.body.addEventListener('keydown', (e) => {
  let key = vkey[e.keyCode];

  if (key == null) {
    return;
  }

  key = key.replace(/</g, '').replace(/>/g, '');

  if (key in positions) {
    addLetter(key, positions[key], HEIGHT - 50);
  }
})

function playSound(name) {
  const sound = document.getElementById(name);
  sound.play()
}

function addLetter(key, x, y) {
  playSound('type');

  const ball = Bodies.circle(x, y, 30, {
    restitution: 0.9,
    friction: 0.001,
    render: {
      sprite: {
        texture: getImagePath(key)
      }
    }
  });

  let vector = {
    x: (Date.now() % 10) * 0.004 - 0.02,
    y: (-1 * HEIGHT / 3600)
  };

  if (rainMode) {
    vector = {
      x: 0,
      y: 0
    };

    Matter.Body.setPosition(ball, {
      x: ball.position.x,
      y: -30
    })
  }

  Matter.Body.applyForce(ball, ball.position, vector);

  Composite.add(engine.world, [ball]);
  
  secretWords(key);
}

function secretWords(key) {
  lastKeys = lastKeys.slice(-3) + key;

  if (lastKeys === 'RAIN') {
    rainMode = !rainMode;

    if (rainMode) {
      playSound('rain');
    }
  }
}


function getImagePath(key) {
  if (key.indexOf('num-') === 0) {
    key = key.substring(4);
  }

  if (key === '*') key = 'star';
  if (key === '+') key = 'plus';
  if (key === '.') key = 'dot';
  if (key === '/') key = 'slash';
  if (key === '\\') key = 'backslash';

  return './img/' + key + '.png';
}