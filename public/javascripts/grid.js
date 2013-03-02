var tick = function() {
  requestAnimationFrame(tick.bind(this));

  var dt = this.clock.getDelta();

  this.forward_angle += dt * 1.0;

  var skid = (this.leftVector.x * 1.0);
  var drift = this.foward.clone();
  drift.x = Math.cos(this.forward_angle + skid);
  drift.z = Math.sin(this.forward_angle + skid);
  this.foward.x = Math.cos(this.forward_angle);
  this.foward.z = Math.sin(this.forward_angle);

  if (this.ball != null) {

    var farForward = this.foward.clone().multiplyScalar(100.0); //how far in front
    var farBack = this.foward.clone().negate().multiplyScalar(150.0); //how far in back

    var reallyFarOut = this.ball.position.clone().add(farForward);
    var reallyFarBack = this.ball.position.clone().add(farBack);

    var whereCarIsPointing = this.ball.position.clone().add(drift);

    this.camera.lookAt(reallyFarOut);
    //this.camera.lookAt(this.nodes[this.nodes.length / 2].position);
    //this.camera.position = (this.nodes[3].position);
    this.camera.position.set(0 + reallyFarBack.x, 100.0, 0 + reallyFarBack.z);
  }

  //var d = parseInt(this.st * 0.5) % 4;
  //var dd = (parseInt(this.st * 0.5) + 1) % 4
  //console.log(parseInt(this.st * 0.1) % 2);

  /*
  this.resetTimer += dt;

  if (this.resetTimer > this.resetTimeout) {
    this.resetTimer = 0.0;
    //(parseInt(this.st * 0.5) % 4) == 0) {
    //attachEdgeToNode(edges[0], nodes[0], 3);
    //attachEdgeToNode(edges[0], nodes[0], 3);
    var d = 0;
    var f = 0;
    var g = 0;

    for (var i=0; i<20 - 1; i++) {
      d = parseInt(Math.random() * 4.0);

      //console.log("connecting edge", i, " to node ", i);
      attachEdgeToNode(this.edges[i], this.nodes[i], d % 4);
      //console.log("connecting node", i+1, " to edge ", i);
      placeNodeAtEdge(this.nodes[i+1], this.edges[i]);
      this.nodes[i+1].position.y = i * 2;
      g++;
    }
  }
  */

  this.camera.updateProjectionMatrix();
  this.skyBoxCamera.rotation.copy(this.camera.rotation);

  this.renderer.clear(false, true, false);
  this.renderer.render(this.skyBoxScene, this.skyBoxCamera);
  this.renderer.render(this.scene, this.camera);
};

var createBall = function() {
  var ballObject = new THREE.Object3D();
  var textMat = new THREE.MeshBasicMaterial({color: 0xffaa00, wireframe: true});
  var radius = 5;
  var trackPointGeo = new THREE.SphereGeometry(radius, 3, 3);
  var trackPointMesh = new THREE.Mesh(trackPointGeo, textMat);
  ballObject.add(trackPointMesh);
  ballObject.position.set(0, 0, 0);
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

  edgePosition[0] = new THREE.Vector3(0, 0, 16);
  edgeDirection[0] = new THREE.Vector3(16, 0, 16);

  edgePosition[1] = new THREE.Vector3(16, 0, 0);
  edgeDirection[1] = new THREE.Vector3(16, 0, -16);

  edgePosition[2] = new THREE.Vector3(0, 0, -16);
  edgeDirection[2] = new THREE.Vector3(-16, 0, -16);

  edgePosition[3] = new THREE.Vector3(-16, 0, 0);
  edgeDirection[3] = new THREE.Vector3(-16, 0, 16);

  return function(edge, node, position) {
    edge.position.addVectors(edgePosition[position], node.position);
    var la = new THREE.Vector3();
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


  var camera = createCamera(wsa, 2000, 30);
  var scene = createScene();

  var directionalLight = createDirectionalLight();
  scene.add(directionalLight);

  var pointLight = createPointLight();
  scene.add(pointLight);

  var skyBoxCamera = createCamera(wsa, 1000, 30);
  var skyBoxScene = createScene();
  var skyBoxMaterial = createMeshBasicWireframeMaterial();
  var skyBox = createSkyBox(skyBoxMaterial);
  skyBoxScene.add(skyBox);

  var renderer = new THREE.WebGLRenderer({});

  //renderer.setFaceCulling("back");
  renderer.setSize(wsa.x, wsa.y);
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);

  var ball = createBall();
  scene.add(ball);

  var nodes = new Array();
  var edges = new Array();

  var max = 20;

  for (var i=0; i<max; i++) {
    var baseNodeMaterial = createMeshBasicWireframeMaterial();
    var baseNode = createNodeObject(baseNodeMaterial);
    scene.add(baseNode);
    nodes.push(baseNode);
  }

  for (var i=0; i<max - 1; i++) {
    var baseEdgeMaterial = createMeshBasicWireframeMaterial();
    var baseEdge = createEdgeObject(baseEdgeMaterial);
    scene.add(baseEdge);
    edges.push(baseEdge);
  }


  var thingy = {
    fps: 35.0,
    then: Date.now(),
    st: 0,
    foward: new THREE.Vector3(0, 0, 0),
    skyBoxCamera: skyBoxCamera,
    skyBoxScene: skyBoxScene,
    camera: camera,
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
    forward_angle: 0,
    edges: edges,
    nodes: nodes,
    resetTimeout: 2.0,
    resetTimer: 0.0,
  };

  // event listeners
  renderer.domElement.addEventListener('pointerdown', onPointerDown.bind(thingy), false);
  renderer.domElement.addEventListener('pointermove', onPointerMove.bind(thingy), false);
  renderer.domElement.addEventListener('pointerup', onPointerUp.bind(thingy), false);
  window.addEventListener('resize', onWindowResize.bind(thingy), false);
  tick.apply(thingy);
};
