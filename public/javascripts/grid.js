var tick = function() {

  var dt = this.clock.getDelta();
  this.st += dt;

  this.ballRayCaster.set(this.ball.position, this.downDirectionVector);
  var nextNodeToIntersectWith = ((this.oldestNode + 1) % this.nodes.length);
  var intersectsWithNode = this.ballRayCaster.intersectObject(this.nodes[nextNodeToIntersectWith], true);

  if (intersectsWithNode.length > 0) {
    var newDir = dirNotInDir(this.dirs[this.currentNode]);
    placeNodeAtEdge(this.nodes[this.oldestNode], this.edges[this.currentNode]);
    attachEdgeToNode(this.edges[this.oldestNode], this.nodes[this.oldestNode], newDir);

    this.oldestNode++;
    if (this.oldestNode >= this.nodes.length) {
      this.oldestNode = 0;
    }

    this.currentNode++;
    if (this.currentNode >= this.nodes.length) {
      this.currentNode = 0;
    }

    this.dirs[this.currentNode] = newDir;
  }

  var currentDir = this.dirs[this.oldestNode];
  var currentRot = THREE.Math.degToRad((currentDir * 90.00) - 90.00);

  this.ball.rotation.y = currentRot;

  this.ball.translateX(100.0 * dt);

  var d = 50.0;

  this.ball.translateX(d);
  this.frontOfBall.copy(this.ball.position);
  this.ball.translateX(-d);

  this.ball.translateX(-d);
  this.backOfBall.copy(this.ball.position);
  this.ball.translateX(d);

  this.camera.position.set((this.backOfBall.x), (Math.sin(this.st) * 0.0) + 10.0, (this.backOfBall.z));
  this.camera.lookAt(this.frontOfBall);

  this.debugCamera.position.set(this.ball.position.x - 25, 25, this.ball.position.z - 25);
  this.debugCamera.lookAt(this.ball.position);

  //this.skyBoxCamera.rotation.copy(this.camera.rotation);
  this.skyBoxCamera.rotation.y += dt * 1.0;
  this.debugCameraHelper.visible = false;

  this.renderer.setViewport(0, 0, this.wsa.ax, this.wsa.ay);
  //this.renderer.clear(false, true, false);
  this.renderer.clear(true, true, true);
  this.renderer.render(this.skyBoxScene, this.skyBoxCamera);
  this.renderer.render(this.scene, this.camera);

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
  //this.renderer.setScissor(left, bottom, width, height);
  //this.renderer.enableScissorTest(true);
  //renderer.setClearColor( view.background, view.background.a );
  this.debugCamera.aspect = width / height;
  this.renderer.render(this.scene, this.debugCamera);

  requestAnimationFrame(tick.bind(this));
};

var createBall = function() {
  var ballObject = new THREE.Object3D();
  var textMat = new THREE.MeshBasicMaterial({color: 0xffaa00, wireframe: true});
  var radius = 5;
  var trackPointGeo = new THREE.SphereGeometry(radius, 3, 3);
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
  var x = 16.0;
  var y = 1.0;
  var z = 2.0;

  var edgeGeometry = new THREE.CubeGeometry(x, y, z, 2, 2, 2, null, true);
  var edgeMesh  = new THREE.Mesh(edgeGeometry, edgeMaterial);
  var edgeObject = new THREE.Object3D();
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
  }
})();

var placeNodeAtEdge = function(node, edge) {
  var d = -16.0;
  edge.translateX(d);
  node.position = edge.position.clone();
  edge.translateX(-d);
};

var dirNotInDir = function(notDir) {
  var dir = parseInt(Math.random() * 4);
  if (dir === (((notDir + 8) - 2) % 4)) {
    dir = (dir + 1) % 4;
  }
  return dir;
};
  
var main = function(body) {

  var wsa = windowSizeAndAspect();

  var container = createContainer();
  body.appendChild(container);

  var fullscreenButton = document.getElementById("fullscreen-button");

  fullscreenButton.addEventListener('click', function(ev) {
    if (screenfull.enabled) {
      screenfull.onchange = function() {
        //console.log('Am I fullscreen? ' + screenfull.isFullscreen ? 'Yes' : 'No');
      };
      screenfull.toggle(container);
    }
  }, false);

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
  var skyBoxMaterial = createMeshBasicWireframeMaterial();
  var skyBox = createSkyBox(skyBoxMaterial, 10);
  skyBoxScene.add(skyBox);

  var renderer = new THREE.WebGLRenderer({});

  renderer.setSize(wsa.x, wsa.y);
  renderer.autoClear = false;
  renderer.setClearColorHex(0x000000, 1.0);
  container.appendChild(renderer.domElement);

  var ball = createBall();
  scene.add(ball);

  var nodes = new Array();
  var edges = new Array();
  var dirs = new Array();

  var max = 3;

  for (var i=0; i<max; i++) {
    var baseNodeMaterial = createMeshBasicWireframeMaterial();
    var baseNode = createNodeObject(baseNodeMaterial);
    scene.add(baseNode);
    nodes.push(baseNode);
  }

  for (var i=0; i<max; i++) {
    var baseEdgeMaterial = createMeshBasicWireframeMaterial();
    var baseEdge = createEdgeObject(baseEdgeMaterial);
    scene.add(baseEdge);
    edges.push(baseEdge);
  }


  attachEdgeToNode(edges[0], nodes[0], 1);
  dirs.push(1);
  for (var i=0; i<=(max - 2); i++) {
    placeNodeAtEdge(nodes[i + 1], edges[i]);
    var randomDir = dirNotInDir(dirs[i]);
    attachEdgeToNode(edges[i + 1], nodes[i + 1], randomDir);
    dirs.push(randomDir);
  }

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
    //
    ball: ball,
    ballRayCaster: new THREE.Raycaster(ball.position, new THREE.Vector3(0, -1, 0)),
    forward_angle: 0,
    edges: edges,
    nodes: nodes,
    dirs: dirs,
    resetTimeout: 0.6325,
    resetTimer: 0.0,
    currentNode: max - 1,
    oldestNode: 0,
    downDirectionVector: new THREE.Vector3(0, -1, 0),
    frontOfBall: new THREE.Vector3(0, 0, 0),
    backOfBall: new THREE.Vector3(0, 0, 0),

  };

  // event listeners
  renderer.domElement.addEventListener('pointerdown', onPointerDown.bind(thingy), false);
  renderer.domElement.addEventListener('pointermove', onPointerMove.bind(thingy), false);
  renderer.domElement.addEventListener('pointerup', onPointerUp.bind(thingy), false);
  window.addEventListener('resize', onWindowResize.bind(thingy), false);
  tick.apply(thingy);
};
