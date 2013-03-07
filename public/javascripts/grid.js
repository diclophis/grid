var tick = function() {
  requestAnimationFrame(tick.bind(this));
  var dt = this.clock.getDelta();

  if (this.paused || dt > 0.04) {
    return;
  }

  this.st += dt;

  TWEEN.update();

  if (this.speed < 100) {
    this.speed += 10.0 * dt;
  }

  var turn = (1 / (this.speed / 10.0)) * 1100;

  var foo = new THREE.Vector3(Math.round(this.ball.position.x), this.ball.position.y, Math.round(this.ball.position.z));
  this.ballRayCaster.set(foo, this.downDirectionVector);
  var nextNodeToIntersectWith = ((this.oldestNode + 1) % this.nodes.length);
  var thisNodeToIntersectWith = ((this.oldestNode) % this.nodes.length);
  var nextEdgeToIntersectWith = (((this.oldestNode)) % this.nodes.length);
  var intersectsWithNode = this.ballRayCaster.intersectObject(this.nodes[nextNodeToIntersectWith], true);
  var intersectsWithThisNode = this.ballRayCaster.intersectObject(this.nodes[thisNodeToIntersectWith], true);
  var intersectsWithEdge = this.ballRayCaster.intersectObject(this.edges[nextEdgeToIntersectWith], true);

  if ((intersectsWithEdge.length === 0) && (intersectsWithThisNode.length === 0)) {
    this.paused = true;
  }

  if (intersectsWithNode.length > 0) {
    var newDir = dirNotInDir(this.dirs[this.currentNode]);
    placeNodeAtEdge(this.nodes[this.oldestNode], this.edges[this.currentNode]);
    attachEdgeToNode(this.edges[this.oldestNode], this.nodes[this.oldestNode], newDir);

    if (this.edges[this.oldestNode].scale.z > 0.5) {
      this.edges[this.oldestNode].scale.z = ((1 / (this.speed / 10.0)) * 0.9) - (Math.random() * 0.075);
    }

    this.oldestNode++;
    if (this.oldestNode >= this.nodes.length) {
      this.oldestNode = 0;
    }

    this.currentNode++;
    if (this.currentNode >= this.nodes.length) {
      this.currentNode = 0;
    }

    this.dirs[this.currentNode] = newDir;

    var oldRad = this.ball.rotation.y;
    var oldRot = { r: 0 };
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

    var newRot = { r: deltaDeg };
    var b = this.ball;
    var ballRotTween = new TWEEN.Tween(oldRot).to(newRot, turn);
    ballRotTween.onUpdate(function() {
      b.rotation.y = oldRad - THREE.Math.degToRad(this.r);
    });
    ballRotTween.start();
  }

  this.ball.translateX(this.speed * dt);

  this.debugCamera.position.set(this.ball.position.x - 55, 55, this.ball.position.z - 55);
  this.debugCamera.lookAt(this.ball.position);

  this.skyBoxCamera.rotation.y += dt * 1.0;
  this.debugCameraHelper.visible = false;

  this.renderer.setViewport(0, 0, this.wsa.ax, this.wsa.ay);
  this.renderer.clear(true, true, true);
  this.renderer.render(this.skyBoxScene, this.skyBoxCamera);
  this.renderer.render(this.scene, this.camera);

  if (this.renderDebugCamera) {
    this.debugCameraHelper.visible = true;
    var view_left = 0.5;
    var view_bottom = 0.5;
    var view_width = 0.5;
    var view_height = 0.5;
    var left   = Math.floor(this.wsa.ax  * view_left);
    var bottom = Math.floor(this.wsa.ay * view_bottom);
    var width  = Math.floor(this.wsa.ax  * view_width);
    var height = Math.floor(this.wsa.ay * view_height);
    this.renderer.setViewport(left, bottom, width, height);
    this.debugCamera.aspect = width / height;
    this.renderer.render(this.scene, this.debugCamera);
  }
};

var createBall = function() {
  var ballObject = new THREE.Object3D();
  var textMat = new THREE.MeshBasicMaterial({color: 0xffaa00, wireframe: true});
  var radius = 5;
  var sections = 10;
  var trackPointGeo = new THREE.SphereGeometry(radius, sections, sections);
  var trackPointMesh = new THREE.Mesh(trackPointGeo, textMat);
  ballObject.add(trackPointMesh);
  ballObject.position.set(0, 5, 0);
  return ballObject;
};

var createNodeObject = function(nodeMaterial) {
  var x = 16.0;
  var y = 1.0;
  var z = 16.0;

  var nodeGeometry = new THREE.CubeGeometry(x, y, z, 2, 2, 2, null, true);
  var nodeMesh  = new THREE.Mesh(nodeGeometry, nodeMaterial);
  var nodeObject = new THREE.Object3D();
  nodeObject.add(nodeMesh);
  return nodeObject;
};

var createEdgeObject = function(edgeMaterial) {
  var x = 20.0;
  var y = 0.5;
  var z = 16.0;

  var edgeGeometry = new THREE.CubeGeometry(x, y, z, 2, 2, 2, null, true);
  var edgeMesh  = new THREE.Mesh(edgeGeometry, edgeMaterial);
  var edgeObject = new THREE.Object3D();
  edgeObject.scale.z = 0.9;
  edgeObject.add(edgeMesh);
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
    edge.position.y = -0.25;
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
  var d = 50.0;

  return function(ball) {
    ball.translateX(d);
    cameraLineEnd.copy(ball.position);
    ball.translateX(-d);

    ball.translateX(-d * 2.0);
    cameraLineStart.copy(ball.position);
    ball.translateX(d * 2.0);

    cameraLineStart.y = 20.0;

    cameraLine.start.copy(cameraLineStart);
    cameraLine.end.copy(cameraLineEnd);

    return cameraLine;
  }
})();
  
var main = function(body) {

  var wsa = windowSizeAndAspect();

  var container = createContainer();
  body.appendChild(container);

  var camera = createCamera(wsa, 300, 30);
  var debugCamera = createCamera(wsa, 2000, 60);

  var scene = createScene();

  var debugCameraHelper = new THREE.CameraHelper(camera);
  scene.add(debugCameraHelper);

  var directionalLight = createDirectionalLight();
  scene.add(directionalLight);

  var pointLight = createPointLight();
  scene.add(pointLight);

  var skyBoxCamera = createCamera(wsa, 1000, 30);
  var skyBoxScene = createScene();
  var skyBoxMaterial = createMeshBasicWireframeMaterial(true);
  var skyBox = createSkyBox(skyBoxMaterial, 10);
  skyBoxScene.add(skyBox);

  var renderer = new THREE.WebGLRenderer({});

  renderer.setSize(wsa.x, wsa.y);
  renderer.autoClear = false;
  renderer.setClearColorHex(0x000000, 1.0);
  container.appendChild(renderer.domElement);

  var ball = createBall();
  ball.add(camera);
  scene.add(ball);

  var nodes = new Array();
  var edges = new Array();
  var dirs = new Array();

  var max = 3;

  for (var i=0; i<max; i++) {
    var baseNodeMaterial = createMeshBasicWireframeMaterial(false);
    var baseNode = createNodeObject(baseNodeMaterial);
    scene.add(baseNode);
    nodes.push(baseNode);
  }

  for (var i=0; i<max; i++) {
    var baseEdgeMaterial = createMeshBasicWireframeMaterial(false);
    var baseEdge = createEdgeObject(baseEdgeMaterial);
    scene.add(baseEdge);
    edges.push(baseEdge);
  }

  for (var i=0; i<(max); i++) {
    var randomDir = null;
    if (i === 0) {
      randomDir = 1;
      attachEdgeToNode(edges[i], nodes[i], randomDir);
    } else {
      randomDir = dirNotInDir(dirs[i - 1]);
    }
    if (i > 0) {
      placeNodeAtEdge(nodes[i], edges[i-1]);
    }
    attachEdgeToNode(edges[i], nodes[i], randomDir);
    dirs.push(randomDir);
  }

  var cameraLine = updateCameraLine(ball);
  camera.position.copy(cameraLine.start);
  camera.lookAt(cameraLine.end);

  scene.updateMatrix();
  scene.updateMatrixWorld();

  var thingy = {
    fps: 35.0,
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
    resetTimeout: 0.6325,
    resetTimer: 0.0,
    currentNode: max - 1,
    oldestNode: 0,
    downDirectionVector: new THREE.Vector3(0, -1, 0),
    speed: 10,
    renderDebugCamera: false,
    resizeTimeout: null,
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
  window.addEventListener('resize', onWindowResize.bind(thingy), false);
  window.addEventListener('unload', onWindowUnload.bind(thingy), false);
  tick.apply(thingy);
};
