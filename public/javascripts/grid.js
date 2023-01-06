var tick = function() {
  requestAnimationFrame(tick.bind(this));
  var dt = this.clock.getDelta();

  if (this.paused || dt > (0.16 * 4)) {
    return;
  }

  if (dt > 0.34) {
    if (this.subdivide < 6.0) {
      this.subdivide += 1.0;
      onWindowResize.apply(this);
      return;
    }
  }

  this.st += dt;
  this.resetTimer += dt;
  this.aiTurnAssistTimer += dt;

  TWEEN.update();

  var max_speed = 70;
  if (this.speed < max_speed) {
    this.speed += 10.0 * dt;
  } else {
    this.speed = max_speed;
  }

  var turn = (1 / (this.speed / 10.0)) * 300; //1100;

  this.ball.translateX(this.speed * dt);
  var foo = new THREE.Vector3(Math.round(this.ball.position.x), this.ball.position.y, Math.round(this.ball.position.z));
  this.ball.translateX(-this.speed * dt);

  this.ballRayCaster.set(foo, this.downDirectionVector);
  var nextNodeToIntersectWith = ((this.oldestNode + 1) % this.nodes.length);
  var thisNodeToIntersectWith = ((this.oldestNode) % this.nodes.length);
  var nextEdgeToIntersectWith = (((this.oldestNode)) % this.nodes.length);
  this.nodes[nextNodeToIntersectWith].children[0].geometry.computeBoundingSphere();
  this.nodes[thisNodeToIntersectWith].children[0].geometry.computeBoundingSphere();
  this.edges[nextEdgeToIntersectWith].children[0].geometry.computeBoundingSphere();
  var intersectsWithNode = this.ballRayCaster.intersectObject(this.nodes[nextNodeToIntersectWith], true);
  var intersectsWithThisNode = this.ballRayCaster.intersectObject(this.nodes[thisNodeToIntersectWith], true);
  var intersectsWithEdge = this.ballRayCaster.intersectObject(this.edges[nextEdgeToIntersectWith], true);

  if ((intersectsWithEdge.length === 0) && (intersectsWithThisNode.length === 0)) {
    this.turnLock = true;
    this.leftVector.set(0, 0);
    this.speed = 0;
    setTimeout(function() {
      this.ball.position.copy(this.nodes[thisNodeToIntersectWith].position);
      this.ball.position.y = 10;
      var currentDir = this.dirs[thisNodeToIntersectWith];
      var currentRot = THREE.Math.degToRad(((currentDir * 90.00) ));
      this.ball.rotation.y = currentRot + (Math.PI / -2.0);
      this.resetTimer = -(this.resetTimeout * 10.0);
      this.lastTurnAssist = this.st;
      this.turnLock = false;
      this.gameOverCount++;
      this.aiGraceTimeout += 1.0
    }.bind(this), 33);
    return;
  }

  var aiTurnAssist = false;
  var newDir = null;

  if (intersectsWithNode.length > 0) {
    newDir = 0;
    //if (Math.random() < 0.75) {
    //  newDir = dirNotInDir(this.dirs[this.currentNode]);
    //} else {
    //  newDir = this.dirs[this.currentNode];
    //}
    placeNodeAtEdge(this.nodes[this.oldestNode], this.edges[this.currentNode]);
    attachEdgeToNode(this.edges[this.oldestNode], this.nodes[this.oldestNode], newDir);
    this.nodes[this.oldestNode].uuid += this.nodes.length * 2;
    this.edges[this.oldestNode].uuid += this.nodes.length * 2;

    //if (this.edges[this.oldestNode].scale.z > 0.7) {
      this.edges[this.oldestNode].scale.z = 0.5 + (Math.random() * 0.5); //((1 / (this.speed / 10.0)) * 0.9) - (Math.random() * 0.01);
    //}

    this.oldestNode++;
    if (this.oldestNode >= this.nodes.length) {
      this.oldestNode = 0;
    }

    this.currentNode++;
    if (this.currentNode >= this.nodes.length) {
      this.currentNode = 0;
    }

    this.dirs[this.currentNode] = newDir;

    if (this.st < (this.lastTurnAssist + this.aiGraceTimeout)) {
      this.aiTurnAssistTimer = 0.0; //this.aiTurnAssistTimeout;
      this.aiTurnAssistFired = false;
    }
  }
  if (this.turnLock === false && this.aiTurnAssistFired === false && this.aiTurnAssistTimer > this.aiTurnAssistTimeout) {
    aiTurnAssist = true;
  }
  if (!this.aiTurnAssistFire && (this.turnLock === false) && (!this.speedUp) && (this.leftVector.length() > 0.0)) {
    this.aiGraceTimeout = 0;
    if (this.leftVector.x > 0) {
      this.turnDir = 1;
    } else {
      this.turnDir = -1;
    }
    aiTurnAssist = false;
  }
  if (aiTurnAssist || (this.turnDir != 0.0 && this.resetTimer > this.resetTimeout)) {

    this.aiTurnAssistFired = true;
    this.turnLock = true;
    this.leftVector.set(0, 0);
    this.resetTimer = 0.0;
    var oldRot = { r: 0 };
    var oldRad = this.ball.rotation.y;

    if (aiTurnAssist) {
      var currentDir = this.dirs[this.oldestNode];
      var currentRot = THREE.Math.degToRad(((currentDir * 90.00) - 90.00));

      var deltaDeg = Math.round(THREE.Math.radToDeg(oldRad) - THREE.Math.radToDeg(currentRot));
      while(deltaDeg >= 360 || deltaDeg <= -360) {
        if (deltaDeg >= 360) {
          deltaDeg -= 360;
        }
        if (deltaDeg <= -360) {
          deltaDeg += 360;
        }
      }

      if (deltaDeg == -270.0) {
        deltaDeg = 90.0;
      }
      if (deltaDeg == 270.0) {
        deltaDeg = -90.0;
      }
    } else {
      deltaDeg = 90.0 * this.turnDir;
    }
    this.turnDir = 0.0;
    var newRot = { r: deltaDeg };
    var b = this.ball;
    var f = this;
    var ballRotTween = new TWEEN.Tween(oldRot).to(newRot, turn);
    ballRotTween.onUpdate(function() {
      b.rotation.y = oldRad - THREE.Math.degToRad(this.r);
    });
    ballRotTween.onComplete(function() {
      f.turnLock = false;
      f.leftVector.set(0, 0);
    });
    ballRotTween.start();
  }

  this.ball.translateX(this.speed * dt);

  this.debugCamera.position.set(this.ball.position.x - 55, 55, this.ball.position.z - 55);
  this.debugCamera.lookAt(this.ball.position);

  this.skyBoxCamera.rotation.y += dt * 1.0;
  this.debugCameraHelper.visible = false;

  //var cmr = this.camera;
  //var cmp = function(a, b) {
  //  return a.position.distanceTo(cmr.position) - b.position.distanceTo(cmr.position);  
  //};
  //this.scene.children.sort(cmp);
  //this.scene.children.reverse();

  //this.renderer.clear(false, false, false);
  if (!this.renderDebugCamera) {
    //if (this.renderer.setViewport) {
    //  this.renderer.setViewport(0, 0, this.wsa.ax, this.wsa.ay);
    //}
    //if (this.st < 10.0) {
      this.renderer.render(this.skyBoxScene, this.skyBoxCamera);
    //}
    this.renderer.render(this.scene, this.camera);
  }
  if (this.renderDebugCamera) {
    //this.debugCameraHelper.visible = true;
    var view_left = 0.5;
    var view_bottom = 0.5;
    var view_width = 0.5;
    var view_height = 0.5;
    var left   = Math.floor(this.wsa.ax  * view_left);
    var bottom = Math.floor(this.wsa.ay * view_bottom);
    var width  = Math.floor(this.wsa.ax  * view_width);
    var height = Math.floor(this.wsa.ay * view_height);
    //if (this.renderer.setViewport) {
    //  this.renderer.setViewport(left, bottom, width, height);
    //}
    this.debugCamera.aspect = width / height;
    this.renderer.render(this.skyBoxScene, this.skyBoxCamera);
    this.renderer.render(this.scene, this.debugCamera);
  }
};

var createBall = function() {
  var ballObject = new THREE.Object3D();
  var textMat = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, wireframe: false});
  textMat.color.setHex( Math.random() * 0xffffff );
  var radius = 5;
  var sections = 5;
  var trackPointGeo = new THREE.SphereGeometry(radius, sections * 3, sections / 2);
  var trackPointMesh = new THREE.Mesh(trackPointGeo, textMat);
  ballObject.add(trackPointMesh);
  ballObject.position.set(0, 10, 0);
  return ballObject;
};

var createNodeObject = function(nodeMaterial) {
  var x = 16.0;
  var y = 8.0;
  var z = 16.0;

  var nodeGeometry = new THREE.BoxGeometry(x, y, z, 1, 1, 1, null, true);
  var nodeMesh  = new THREE.Mesh(nodeGeometry, nodeMaterial);
  var nodeObject = new THREE.Object3D();
  nodeObject.add(nodeMesh);
  nodeObject.position.y = 0;
  return nodeObject;
};

var createEdgeObject = function(edgeMaterial) {
  var x = 25.0;
  var y = 0.01;
  var z = 16.0;

  var edgeGeometry = new THREE.BoxGeometry(x, y, z, 1, 1, 1, null, true);
  var edgeMesh  = new THREE.Mesh(edgeGeometry, edgeMaterial);
  var edgeObject = new THREE.Object3D();
  edgeObject.scale.z = 0.7;
  edgeObject.add(edgeMesh);
  //edgeObject.position.y = 10;
  return edgeObject;
};

var attachEdgeToNode = (function() {
  // position is one of 0, 1, 2, 3
  var edgePosition = new Array();
  var edgeDirection = new Array();

  for (var i=0; i<4; i++) {
    var r = THREE.Math.degToRad(i * 90.0);
    var directionVector = new THREE.Vector3(1.00, 0, 1.00);
    var positionVector = new THREE.Vector3(0, 0, 1.00);
    var m = new THREE.Matrix4().makeRotationY(r);
    directionVector.applyMatrix4(m);
    positionVector.applyMatrix4(m);

    directionVector.multiplyScalar(16.00);
    positionVector.multiplyScalar(16.00);
  
    edgePosition.push(positionVector);
    edgeDirection.push(directionVector);
  }
    
  var la = new THREE.Vector3(0, 0, 0);

  return function(edge, node, position) {
    edge.position.addVectors(edgePosition[position], node.position);
    la.addVectors(node.position, edgeDirection[position]);
    edge.lookAt(la);
    edge.position.y = 3; // + Math.random();
  }
})();

var placeNodeAtEdge = function(node, edge) {
  var d = -16.0;
  edge.translateX(d);
  node.position = edge.position.clone();
  node.position.y = 0;
  edge.translateX(-d);
};

var dirNotInDir = function(notDir) {
  var dir = parseInt(Math.random() * 4);
  if (dir === (((notDir + 8) - 2) % 4)) {
    dir = (dir + 1) % 4;
  }
  return dir;
};

var updateCameraLine = (function() {

  var cameraLineStart = new THREE.Vector3(0, 0, 0);
  var cameraLineEnd = new THREE.Vector3(0, 0, 0);
  var cameraLine = new THREE.Line3(cameraLineStart, cameraLineEnd);
  var d = 70.0;

  return function(ball) {
    ball.translateX(d * 0.1);
    cameraLineEnd.copy(ball.position);
    ball.translateX(-d * 0.1);

    ball.translateX(-d * 1.1);
    cameraLineStart.copy(ball.position);
    ball.translateX(d * 1.1);

    cameraLineStart.y = 70.0;

    cameraLine.start.copy(cameraLineStart);
    cameraLine.end.copy(cameraLineEnd);

    return cameraLine;
  }
})();

var onKeyDown = function(ev) {
  if (this.resetTimer > this.resetTimeout) {
    switch(ev.keyCode) {
      case 37:
        this.leftVector.x = -1;
        break;
      case 39:
        this.leftVector.x = 1;
        break
    };
  }

  if (this.leftVector.x != 0) {
    if (!this.soundStarted) {
      play_mod(random_mod_href());
      this.soundStarted = true;
    }
  }
};

var main = function(body) {
  var subdivide = 1.0;

  var wsa = windowSizeAndAspect(subdivide);

  var container = createContainer();
  body.appendChild(container);

  var camera = createCamera(wsa, 500, 40);
  var debugCamera = createCamera(wsa, 2000, 60);

  var scene = createScene();

  var debugCameraHelper = new THREE.CameraHelper(camera);
  scene.add(debugCameraHelper);

  var directionalLight = createDirectionalLight();
  scene.add(directionalLight);

  var pointLight = createPointLight();
  scene.add(pointLight);

  var skyBoxCamera = createCamera(wsa, 1000, 60);
  var skyBoxScene = createScene();
  var skyBoxMaterial = createMeshBasicWireframeMaterial(false);
  var skyBox = createSkyBox(skyBoxMaterial, 2);
  skyBoxScene.add(skyBox);

  var renderer = null;

  try {
    renderer = new THREE.WebGLRenderer({});
  } catch(e) {
    console.log(e);
    var renderer = new THREE.CanvasRenderer({});
  }

  renderer.setSize(wsa.x, wsa.y);
  renderer.autoClear = true;
  renderer.sortElements = false;
  renderer.sortObjects = false;
  //renderer.setClearColorHex(0x000000, 1.0);
  container.appendChild(renderer.domElement);

  var nodes = new Array();
  var edges = new Array();
  var dirs = new Array();

  var max = 1;

  var uuid = 0;
  for (var i=0; i<max; i++) {
    var baseNodeMaterial = createMeshBasicWireframeMaterial(false);
    var baseNode = createNodeObject(baseNodeMaterial);
    baseNode.uuid = uuid++;
    scene.add(baseNode);
    nodes.push(baseNode);
    console.log(uuid);
  }

  for (var i=0; i<max; i++) {
    var baseEdgeMaterial = createMeshBasicWireframeMaterial(false);
    var baseEdge = createEdgeObject(baseEdgeMaterial);
    baseEdge.uuid = uuid++;
    scene.add(baseEdge);
    edges.push(baseEdge);
    console.log(uuid);
  }

  for (var i=0; i<max; i++) {
    attachEdgeToNode(edges[i], nodes[i], 0);
    //placeNodeAtEdge(nodes[i], edges[i-1]);

    //var randomDir = null;
    //if (i === 0) {
    //  randomDir = 1;
    //  attachEdgeToNode(edges[i], nodes[i], randomDir);
    //} else {
    //  randomDir = dirNotInDir(dirs[i - 1]);
    //}
    if (i > 0) {
      placeNodeAtEdge(nodes[i], edges[i-1]);
    }
    //attachEdgeToNode(edges[i], nodes[i], randomDir);
    dirs.push(0);
  }

  var ball = createBall();
  ball.add(camera);
  scene.add(ball);

  var cameraLine = updateCameraLine(ball);
  camera.position.copy(cameraLine.start);
  camera.lookAt(cameraLine.end);

  scene.updateMatrix();
  scene.updateMatrixWorld();

  var thingy = {
    subdivide: subdivide,
    then: Date.now(),
    st: 0,
    foward: new THREE.Vector3(0, 0, 0),
    skyBoxCamera: skyBoxCamera,
    skyBoxScene: skyBoxScene,
    camera: camera,
    debugCamera: debugCamera,
    debugCameraHelper: debugCameraHelper,
    leftPointerID: -1,
    leftPointerStartPos: new THREE.Vector2(0, 0),
    leftPointerPos: new THREE.Vector2(0, 0),
    leftVector: new THREE.Vector2(0, 0),
    wsa: wsa,
    pointers: [],
    fs: null,
    scene: scene,
    paused: false,
    renderer: renderer,
    container: container,
    scene: scene,
    dirty: false,
    clock: new THREE.Clock(true),
    paused: false,
    //
    ball: ball,
    ballRayCaster: new THREE.Raycaster(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)),
    forward_angle: 0,
    edges: edges,
    nodes: nodes,
    dirs: dirs,
    resetTimeout: 1.0,
    resetTimer: 0.0,
    currentNode: max - 1,
    oldestNode: 0,
    downDirectionVector: new THREE.Vector3(0, -1, 0),
    speed: 8,
    renderDebugCamera: false,
    resizeTimeout: null,
    turnDir: 0.0,
    startedMusic: false,
    aiTurnAssistTimer: 0,
    aiTurnAssistTimeout: 0.1,
    aiTurnAssistFired: true,
    aiGraceTimeout: 0.0,
    lastTurnAssist: 0,
    turnLock: false,
    gameOverCount: 0,
  };

  var fullscreenButton = document.getElementById("fullscreen-button");

  fullscreenButton.addEventListener('click', function(ev) {
    if (screenfull.enabled) {
      screenfull.onchange = function() {
        //console.log('Am I fullscreen? ' + screenfull.isFullscreen ? 'Yes' : 'No');
      };
      screenfull.toggle(container);
    }
  }, false);

  var pauseButton = document.getElementById("pause-button");
  var debugCameraButton = document.getElementById("debug-camera-button");

  pauseButton.addEventListener('click', function(ev) {
    this.paused = !this.paused;
  }.bind(thingy), false);

  debugCameraButton.addEventListener('click', function(ev) {
    this.renderDebugCamera = !this.renderDebugCamera;
  }.bind(thingy), false);

  var onWindowUnload = function(ev) {
    container.removeChild(renderer.domElement);
    delete renderer.domElement;
    renderer.domElement = null;
  };

  // event listeners
  renderer.domElement.addEventListener('pointerdown', onPointerDown.bind(thingy), false);
  renderer.domElement.addEventListener('pointermove', onPointerMove.bind(thingy), false);
  renderer.domElement.addEventListener('pointerup', onPointerUp.bind(thingy), false);
  window.addEventListener('keydown', onKeyDown.bind(thingy), false);
  window.addEventListener('resize', onWindowResize.bind(thingy), false);
  window.addEventListener('unload', onWindowUnload.bind(thingy), false);
  tick.apply(thingy);
};
