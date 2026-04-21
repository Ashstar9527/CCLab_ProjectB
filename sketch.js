/* Functions I wanted to realize in prototype:
1. Press space and switch observation window to a new solar system

2. Nebula/Solar system view, the most colorful type

3. Planets in shade. Textures and rendering are not ready, but we want to have their orbits already.

*/
let systems = []; // hold solar systems
let ashes = [];

// Space jump animation set up
let jumpPhase = "idle";
let jumpFrame = 0;
let jumpOrder = ["wind", "twist", "unwind", "settle", "idle"];
let jumpLen = {
  wind: 30, twist: 22, unwind: 26, settle: 24
} // dictionary

let sp = 1; //multiplier into arc rotation
let twist = 0; //0 - no warp, 1 - full
let fade = 0; //transition btw two systems
let next = 0; // the next to play
let current = 0; // the current displayed system

let spinAcc = 0; //replace frameCount as acceleration


function setup() {
  createCanvas(1280, 720); //16:9
  for (let i = 0; i < 5; i++) {
    systems.push(new SolarSystem()); // create 5 systems in advance.
  }

  for (let i = 0; i < 200; i++) {
    ashes.push(new Ash(random(1)));
  }
}

function draw() {
  updateJump();
  spinAcc += sp;
  background(systems[current].theme.bg);
  drawGrid();

  if (fade < 0.999) systems[current].update(1-fade);
  if (fade > 0.001) systems[next].update(fade);

  push();
  translate(width/2, height/2);
  for (let a of ashes) {
    a.update();
    a.display();
  }
  pop();
}

let sysScale = 1; // zoom in/out effect

function updateJump() {
  if (jumpPhase == "idle") {
    sysScale = lerp(sysScale, 1, 0.2);
    sp = lerp(sp, 1, 0.15);
    fade = 0;
    twist = 0;
    if (current != next) {current = next};
    return;
  }

  let d = jumpLen[jumpPhase]; //time one 'phase' would last
  let t = constrain(jumpFrame / d, 0, 1); //progress parameter, from drawBlink();

  if (jumpPhase == "wind") {
    let e = t * t * t;
    sysScale = 1 + 0.08 * e;
    sp = lerp(1, 9, e);
    fade = 0;
    twist = 0;

  } else if (jumpPhase == "twist") {
    let e; // a function a++ till middle and a-- later
    if (t < 0.5) {
      e = 4 * t * t * t;
    } else {
      e = 1 - pow(-2*t+2, 3) / 2;
    }
    sysScale = lerp(1.1, 0.78, e);
    sp = lerp(9, 14, e);
    fade = e * e;
    twist = sin(PI * t);

  } else if (jumpPhase == "unwind") {
    let e = 1 - pow(1-t, 3);
    sysScale = lerp(0.78, 1.1, e);
    sp = lerp(14, 5, e);
    fade = 1;
    twist = lerp(1, 0, e);

  } else if (jumpPhase == "settle") {
    let e = 1 - pow(1-t, 3);
    sysScale = lerp(1.1, 1, e);
    sp = lerp(5, 1, e);
    twist = 0;
    fade = 1;
  }

  jumpFrame++;
  if (jumpFrame >= d) {
    jumpFrame = 0;
    jumpPhase = jumpOrder[jumpOrder.indexOf(jumpPhase) + 1];
    if (jumpPhase == "unwind") {current = next};
  }
} 

function makeTheme() {
  colorMode(HSL, 360, 100, 100);  
  let h1 = random(360);
  //Randonize direction
  let dir;
  if (random(1) < 0.5) {dir = 1;} else {dir = -1};
  let h2 = (h1 + dir * random(60, 80) + 360) % 360;
  let h3 = (h2 + dir * random(80, 140) + 360) % 360;
  let h4 = (h3 + random(-3, 3) + 360) % 360;

  let theme = {
    c1: color(h1, 60 + random(-8, 8), 12+random(-3,4)),
    c2: color(h2, 70 + random(-8, 10), 40 + random(-4, 6)),
    c3: color(h3, 85 + random(-8,6), 74+random(-5,5)),
    c4: color(h4, 80 + random(-8,8), 96+random(-2, 2)),
    bg: color(h1, 35, 5)
  };

  colorMode(RGB, 255);  
  return theme;
}

class SolarSystem {
  constructor() {
    this.theme = makeTheme(); //create color palette
    this.storeArc();
  }

  storeArc() {
    this.points = [];
    let c1 = this.theme.c1;
    let c2 = this.theme.c2;
    let c3 = this.theme.c3;
    let c4 = this.theme.c4;

    this.bgCircles = []; //Build circles radial glow
    for (let i = 0; i < 150; i++) {
      let t = i / 149;
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, t * 3);
      } else if (t < 0.67) {
        c = lerpColor(c2, c3, (t - 0.33) * 3);
      } else {
        c = lerpColor(c3, c4, (t - 0.67) * 3);
      }
      c.setAlpha(5 * t + 20);
      this.bgCircles.push(c);
    }

    // Arcs in the mid ground
    this.midArcs = [];
    for (let i = 0; i < 60; i++) {
      let t = i / 59; //Set gradient ratio
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, constrain(t * 3 + random(-0.15, 0.15), 0, 1)); // Adding constrain to ensure bounded between 0, 1
      } else if (t < 0.67) {
        c = lerpColor(
          c2,
          c3,
          constrain((t - 0.33) * 3 + random(-0.15, 0.15), 0, 1)
        );
      } else {
        c = lerpColor(
          c3,
          c4,
          constrain((t - 0.67) * 3 + random(-0.15, 0.15), 0, 1)
        );
      }
      c.setAlpha(5 * t + 70);

      let numSegs = floor(random(5, 9)); //Break into segments
      let arcs = [];
      for (let j = 0; j < numSegs; j++) {
        let span = TWO_PI / numSegs;
        let d;
        if (random() < 0.5) {
          d = 1;
        } else {
          d = -1;
        }
        arcs.push({
          // I'm using simplified formatting here
          start: j * span + random(0, span * 0.5),
          end: j * span + random(span * 0.5, span),
          dir: d, //direction it spans
        });
      }
      this.midArcs.push({ color: c, arcs: arcs }); //record color and arcs segments

      // Add points
      c.setAlpha(155 + 0 * random(-1, 1));
      let numPts = floor(random(8, 16));
      let dots = [];
      let k = 0;
      for (let j = 0; j < numPts; j++) {
        let span = TWO_PI / numPts;
        dots.push({
          ang: random(k, k + span),
          dir: random(-1, 1)
        })
        k += span;
      }
      this.points.push({color: c, dots: dots});
    }

    // Front arcs
    this.frontArcs = [];
    for (let i = 0; i < 100; i++) {
      let t = i / 99; //Set gradient ratio
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, constrain(t * 3 + random(-0.15, 0.15), 0, 1)); // Adding constrain to ensure bounded between 0, 1
      } else if (t < 0.67) {
        c = lerpColor(
          c2,
          c3,
          constrain((t - 0.33) * 3 + random(-0.15, 0.15), 0, 1)
        );
      } else {
        c = lerpColor(
          c3,
          c4,
          constrain((t - 0.67) * 3 + random(-0.15, 0.15), 0, 1)
        );
      }
      c.setAlpha(100 * t + 155);

      let numSegs = floor(random(3, 6)); //Break into segments
      let arcs = [];
      for (let j = 0; j < numSegs; j++) {
        if (i % 4 < 1) {
          continue; // Create skips manually
        }
        let span = TWO_PI / numSegs;
        let d;
        if (random() < 0.5) {
          d = 1;
        } else {
          d = -1;
        }
        arcs.push({
          // I'm using simplified formatting here
          start: j * span + random(0, span * 0.5),
          end: j * span + random(span * 0.5, span),
          dir: d, //direction it spans
        });
      }
      this.frontArcs.push({ color: c, arcs: arcs }); //record color and arcs segments
    }
  }

  drawArcs(R, al) {
    //Circles first, from large to small
    noStroke();
    for (let i = 0; i < this.bgCircles.length; i++) {
      let c = this.bgCircles[i]; // translate back to add a;
      fill(red(c), green(c), blue(c), alpha(c) * al);
      circle(0, 0, R * 2 * (1 - i / (this.bgCircles.length + 1)));
    }

    // mid arcs
    noFill();
    strokeWeight(R / (this.midArcs.length + 2 ));
    for (let i = 0; i < this.midArcs.length; i++) {
      let layer = this.midArcs[i];
      let r = R * (1 - i / (this.midArcs.length + 1));
      let spin = (spinAcc / 800) * (1.5 + (1 - i / this.midArcs.length));

      //Each seg
      for (let j = 0; j < layer.arcs.length; j++) {
        let a = layer.arcs[j];
        let c = layer.color; // translate back to add a;
        stroke(red(c), green(c), blue(c), alpha(c) * al);
        arc(0, 0, r * 2, r * 2, a.start + spin * a.dir, a.end + spin * a.dir);
      }
    }

    // Front arcs
    strokeWeight((R / (this.frontArcs.length + 1)) * 0.8); //thinner
    for (let i = 0; i < this.frontArcs.length; i++) {
      let layer = this.frontArcs[i];
      let r = R * (1 - i / (this.frontArcs.length + 1));
      let spin =
        (spinAcc / 200) * (1.5 + (1 - i / this.frontArcs.length) / 2);
      

      //Each seg
      for (let j = 0; j < layer.arcs.length; j++) {
        let a = layer.arcs[j];
        let c = layer.color; // translate back to add a;
        stroke(red(c), green(c), blue(c), alpha(c) * al);
        arc(0, 0, r * 2, r * 2, a.start + spin * a.dir, a.end + spin * a.dir);
      }
    }

    noStroke();
    for (let i = 0; i < this.points.length; i++) {
      let layer = this.points[i];
      let r = R * (1 - i / (this.points.length + 1));
      let spin = (spinAcc / 200) * (1.5 + (1 - i / this.points.length) / 2);
      let c = layer.color; // translate back to add a;
        fill(red(c), green(c), blue(c), alpha(c) * al);
      for (let d of layer.dots) {
        let a = d.ang + spin * d.dir;
        circle(r * cos(a), r * sin(a), 3);
      }
    }
  }

  update(al) {
    if (al == undefined) {a = 1};
    let R = height * 0.4;
    push();
    translate(width / 2, height / 2);
    scale(sysScale, -sysScale); //Zooms during jump
    this.drawArcs(R, al);
    pop();
  }
}

function keyPressed() {
  // Switch 'windows'
  if (key == " " && jumpPhase == "idle") {
    jumpPhase = "wind";
    jumpFrame = 0;
    next = (current + 1) % systems.length;
  }
}

// Star field
let s = 30;

function drawGrid() {
  push();
  colorMode(HSB, 360, 100, 100);  
  translate(width / 2, height / 2);
  rotate(radians(spinAcc / 40));
  translate(-width / 2, -height / 2)

  let starColor = systems[current].theme.c4;
      fill(starColor);
  
  for (let x = -250; x < width + 250; x += s) {
    for (let y = -250; y < height + 250; y += s) {
      let flicker = noise(x / 200, y / 200, sin(frameCount / 40));
      let r = map(flicker, 0, 1, 0, 3);

      let jx = noise(x * 0.3, y * 0.3) * s * 3;
      let jy = noise(x * 0.3 + 200, y * 0.3 + 200) * s * 3;
      let cx = x + jx;
      let cy = y + jy;
      circle(cx, cy, r);
    }
  }
  
  colorMode(RGB, 255, 255, 255, 100);  
  pop();
}

// Ashes in the Universe
class Ash {
  constructor(init) {
    this.r = map(init, 0, 1, 40, width); //random starting to the center
    this.ang = random(TWO_PI); //random starting angle
    this.size = random(2, 3.5);
    this.speed = random(0.75, 1.25);
    this.phase = random(TWO_PI); // offset to avoid flickering together
  }

  display() {
    let opa = map(this.r, 0, width, 20, 100);
    let flicker = 1 + 0.3 * sin(frameCount * 0.05 + this.phase);
    noStroke();
    fill(255, 255, 255, opa * flicker);

    // Draw small triangles
    push();
    translate(cos(this.ang) * this.r, sin(this.ang) * this.r);
    rotate(this.ang); //outward
    let sz = this.size;
    triangle(0, -sz, -sz * 0.3, sz, sz * 0.9, sz);
    pop();
  }

  update() {
    this.r += 0.2 * this.speed;
    this.ang += this.speed * 0.001;
    if (this.r > width) {
      this.r = random(0, 180);
      this.ang = random(TWO_PI);
    }
  }
}