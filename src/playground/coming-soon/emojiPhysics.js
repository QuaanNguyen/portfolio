import Matter from "matter-js";

const { Bodies, Body, Composite, Engine, Sleeping } = Matter;
const BOUNDARY_THICKNESS = 160;
const EMOJI_RADIUS_RATIO = 0.44;

function createBoundaries(width, height) {
  const options = {
    isStatic: true,
    friction: 0.7,
    restitution: 0.16,
  };

  return [
    Bodies.rectangle(
      width / 2,
      height + BOUNDARY_THICKNESS / 2,
      width + BOUNDARY_THICKNESS * 2,
      BOUNDARY_THICKNESS,
      options,
    ),
    Bodies.rectangle(
      -BOUNDARY_THICKNESS / 2,
      height / 2,
      BOUNDARY_THICKNESS,
      height + BOUNDARY_THICKNESS * 2,
      options,
    ),
    Bodies.rectangle(
      width + BOUNDARY_THICKNESS / 2,
      height / 2,
      BOUNDARY_THICKNESS,
      height + BOUNDARY_THICKNESS * 2,
      options,
    ),
  ];
}

export function getPlaygroundEmojiDiameter(width, height) {
  return Math.round(Math.min(68, Math.max(42, width * 0.055, height * 0.64)));
}

export function createPlaygroundPhysics(width, height) {
  const engine = Engine.create({ enableSleeping: true });
  engine.positionIterations = 9;
  engine.velocityIterations = 7;
  engine.gravity.y = 1.08;

  const physics = {
    bodies: new Map(),
    boundaries: createBoundaries(width, height),
    engine,
    height,
    width,
  };
  Composite.add(engine.world, physics.boundaries);
  return physics;
}

export function addEmojiBody(physics, { diameter, id, random = Math.random }) {
  const radius = diameter * EMOJI_RADIUS_RATIO;
  const usableWidth = Math.max(0, physics.width - radius * 2);
  const x = radius + usableWidth * random();
  const body = Bodies.circle(x, -radius * 1.2, radius, {
    density: 0.0016,
    friction: 0.34,
    frictionAir: 0.008,
    frictionStatic: 0.65,
    restitution: 0.34,
    sleepThreshold: 38,
  });
  Body.setAngle(body, (random() - 0.5) * 0.56);
  Body.setAngularVelocity(body, (random() - 0.5) * 0.055);
  physics.bodies.set(id, { body, diameter, radius });
  Composite.add(physics.engine.world, body);
  return body;
}

export function resizePlaygroundPhysics(physics, width, height) {
  Composite.remove(physics.engine.world, physics.boundaries);
  physics.width = width;
  physics.height = height;
  physics.boundaries = createBoundaries(width, height);
  Composite.add(physics.engine.world, physics.boundaries);

  physics.bodies.forEach(({ body, radius }) => {
    Body.setPosition(body, {
      x: Math.min(width - radius, Math.max(radius, body.position.x)),
      y: Math.min(height - radius, body.position.y),
    });
    Sleeping.set(body, false);
  });
}

export function stepPlaygroundPhysics(physics, elapsedMilliseconds) {
  const elapsed = Math.min(1000 / 30, Math.max(1000 / 120, elapsedMilliseconds));
  Engine.update(physics.engine, elapsed);
}

export function getEmojiTransforms(physics) {
  return [...physics.bodies.entries()].map(([id, entry]) => ({
    angle: entry.body.angle,
    centerX: entry.body.position.x,
    centerY: entry.body.position.y,
    diameter: entry.diameter,
    id,
    isSleeping: entry.body.isSleeping,
    radius: entry.radius,
    x: entry.body.position.x - entry.diameter / 2,
    y: entry.body.position.y - entry.diameter / 2,
  }));
}

export function hasMovingEmojiBodies(physics) {
  return [...physics.bodies.values()].some(({ body }) => !body.isSleeping);
}

export function destroyPlaygroundPhysics(physics) {
  Composite.clear(physics.engine.world, false);
  Engine.clear(physics.engine);
  physics.bodies.clear();
}
