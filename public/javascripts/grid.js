var tick = function() {
  requestAnimationFrame(tick.bind(this));

  var dt = createDeltaTime.apply(this);

  this.forward_angle += dt * 1;

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
    this.camera.position.set(0 + reallyFarBack.x, 10.0, 0 + reallyFarBack.z);
  }

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

var createNodeBase = function(nodeMaterial) {
  var x = 16.0;
  var y = 1.0;
  var z = 16.0;

  var nodeGeometry = new THREE.CubeGeometry(x, y, z, 2, 2, 2, null, true);
  var nodeMesh  = new THREE.Mesh(nodeGeometry, nodeMaterial);
  var nodeObject = new THREE.Object3D();
  nodeObject.add(nodeMesh);
  return nodeObject;
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


  var camera = createCamera(wsa, 2000);
  var scene = createScene();

  var directionalLight = createDirectionalLight();
  scene.add(directionalLight);

  var pointLight = createPointLight();
  scene.add(pointLight);

  var skyBoxCamera = createCamera(wsa, 1000);
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

  var baseNodeMaterial = createMeshBasicWireframeMaterial();
  var baseNode = createNodeBase(baseNodeMaterial);
  scene.add(baseNode);

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
    scene: scene,
    dirty: false,
    //
    ball: ball,
    forward_angle: 0,
  };

  // event listeners
  renderer.domElement.addEventListener('pointerdown', onPointerDown.bind(thingy), false);
  renderer.domElement.addEventListener('pointermove', onPointerMove.bind(thingy), false);
  renderer.domElement.addEventListener('pointerup', onPointerUp.bind(thingy), false);
  window.addEventListener('resize', onWindowResize.bind(thingy), false);
  tick.apply(thingy);
};
