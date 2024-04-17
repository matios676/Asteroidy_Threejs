import * as THREE from './js_125/three.module.js';
import {OrbitControls} from './js_125/OrbitControls.js';
import {GLTFLoader} from './js_125/GLTFLoader.js';
import {GUI} from './js_125/dat.gui.module.js';

    
    const _scene = new THREE.Scene();
    
    const _renderer = new THREE.WebGLRenderer();
    _renderer.shadowMap.enabled = true;
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.setPixelRatio(window.devicePixelRatio);
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setClearColor(new THREE.Color(0x404040));
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(_renderer.domElement);

    window.addEventListener('resize', () => {_OnWindowResize();}, false);

    const FOV = 60;
    const ASPECT = 16/9;
    const NEAR = 1.0;
    const FAR = 10000.0;
    let _camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
    _camera.position.set(75, 20, 0);
    _camera.lookAt( _scene.position );
    
    const _orbitControls = new OrbitControls(_camera, _renderer.domElement);
    _orbitControls.maxDistance = 300;
    _orbitControls.update();
    _orbitControls.enableDamping = true;
    _orbitControls.keys = 0;

    let INFO, OPIS, AUTHORS;
    Legend();
    
    let key = [];
    const DeviceState = {Keyboard: 0, Mouse: 0};
    const ObjectState = {Orbit: 1, FreeCam: 0, Jet: 0, Collision: 0};
    
    
    const Params = {JetSpeed: 5.0, JetAfterburner: 2.0, JetRollSpeed: 0.005, AfterburnerColor: 0xffff00};
    const JetState = {forward: 1, pitchUp: 0, pitchDown: 0, rollLeft: 0, rollRight: 0, afterburner: 0};
    const jetMoveVector = new THREE.Vector3();
    const jetRotationVector = new THREE.Vector3();
    const QuaternionHelp = new THREE.Quaternion();
    

    
    let light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    _scene.add(light);
    
    //let DL_helper = new THREE.DirectionalLightHelper( light, 10 );
    //_scene.add( DL_helper );
    
    light = new THREE.AmbientLight(0x404040);
    _scene.add(light);
    
    const sky = new THREE.TextureLoader().load('ESO_-_Milky_Way.jpg');
    sky.mapping = THREE.SphericalReflectionMapping;
    
    
    const skybox_mat = new THREE.MeshBasicMaterial({
       side: THREE.BackSide,
       map: sky,
       //wireframe: true
        });
        
    const skybox = new THREE.Mesh(
        new THREE.SphereGeometry( 10000, 50, 50 ),
        skybox_mat );
    
    _scene.add(skybox);
    
    
    //---------------------Draw---------------------
    //-----------asteroidy--------------------------------------------

    let Ilosc_asteroid = 20*20*20*20;
    let Asteroids = 0;
    AsteroidsGenerator();
    
    _scene.add(Asteroids);
    //----------------------------------------------------
        
    const Jet = new THREE.Group();
    const Jet_model = new GLTFLoader();
        Jet_model.load('./models/f-16_fighter_jet/jet_fixed_-z.glb', (gltf) => {
            gltf.scene.traverse(c => {c.castShadow = true});
            gltf.scene.scale.set(0.1*gltf.scene.scale.x,0.1*gltf.scene.scale.y,0.1*gltf.scene.scale.z);
            Jet.add(gltf.scene);
            
        });
          //radiusTop , radiusBottom, height, radialSegments, heightSegments
    const Afterburner = new THREE.Mesh( 
            new THREE.CylinderGeometry( 0, 2, 30, 6, 1 ),
            new THREE.MeshBasicMaterial( {color: 0xffff00}) 
            );
            Afterburner.position.set(0, 0, 55);
            Afterburner.rotation.set(Math.PI/2, 0, 0);
            Afterburner.visible = false;
    Jet.add(Afterburner);
    
    /*const collision_box = new THREE.Mesh(
        //new THREE.BoxGeometry( 40, 20, 90 ),
        new THREE.SphereGeometry( 40, 16, 16 ),
        new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: true} ) 
        );
        collision_box.name = "collider";
        collision_box.visible = false;
    Jet.add(collision_box);*/
    
    //console.log(Jet);
    _scene.add(Jet);
    
    const Options = new GUI();
    const Env = Options.addFolder('World');
        Env.add(_renderer, 'toneMappingExposure', 0, 3);
        Env.add(Asteroids,'count', 0, Ilosc_asteroid);
        Env.open();
    const JetOptions = Options.addFolder('Jet Options');
        JetOptions.add(Params, 'JetSpeed', 0, 10);
        JetOptions.addColor(Params, 'AfterburnerColor').onChange( function() { 
            Afterburner.material.color.set( Params.AfterburnerColor ); 
        } );
        JetOptions.open();
        
    _RAF();


    
function _RAF() {
    requestAnimationFrame(_RAF);
    keyboard();
    
    skybox.position.set(_camera.position.x, _camera.position.y, _camera.position.z);
    if(ObjectState.Orbit){
        _orbitControls.target.set(Jet.position.x, Jet.position.y, Jet.position.z);
        _orbitControls.update();
    }
    
    if(ObjectState.Jet)
        updateJet();
    /*
    OPIS.innerHTML = "Projekt przedstawia proceduralne generowanie pola asteroid razem z możliwością kontroli samolotu w przestrzeni. Algorytm wykorzystuje technologie Instancji (aka. batch rendering), dzięki której można narysować dowolną ilość obiektów tego samego typu bez utraty optymalizacji.<br><br>";
    OPIS.innerHTML += "Instrukcja: <br>";
    OPIS.innerHTML += "Kontrola Samolotu: Strzalki - Góra,Dół,Lewo,Prawo <br>";
    OPIS.innerHTML += "Dopalacz: Lewy SHIFT <br>";
    OPIS.innerHTML += "Kamera Pościgu: R <br>";
    OPIS.innerHTML += "Reset: SPACJA <br>";
    OPIS.innerHTML += "Lot [F]:"+((ObjectState.Jet)?"<span style='color: green'>Wl</span>":"<span style='color: red'>Wyl</span>")+"<br>";
    OPIS.innerHTML += "Dopalacz [LSHIFT]:"+((JetState.afterburner)?"<span style='color: green'>Wl</span>":"<span style='color: red'>Wyl</span>")+"<br>";
    OPIS.innerHTML += "Follow_Camera [R]:"+((ObjectState.Orbit)?"<span style='color: green'>Wl</span>":"<span style='color: red'>Wyl</span>")+"<br>";
    AUTHORS.innerHTML = "Autor Projektu: Mateusz Podolski, Wydział Fizyki i Informatyki Stosowanej w Łodzi<br>Autor Model Samolotu: This work is based on \"F-16 Fighter Jet\" (https://sketchfab.com/3d-models/f-16-fighter-jet-d84491f443384ee488593cc6f0f0839e) by iedalton (https://sketchfab.com/iedalton)";*/
    
    
    /*INFO.innerHTML += "Kolizje [C]:"+((ObjectState.Collision)?"<span style='color: green'>Wl</span>":"<span style='color: red'>Wyl</span>")+"<br>";
    
    if(ObjectState.Collision){
            const instances = [];
            for (let i = 0; i < Asteroids.count; i++) {
              const instance = new THREE.Object3D();
              Asteroids.getMatrixAt(i, instance.matrix);
              instances.push(instance);
            }
        var collider = Jet.getObjectByName("collider");
        var collider_vertices = collider.geometry.attributes.position.array;
        
        const localVertex = new THREE.Vector3();
        const directionVector = new THREE.Vector3();
        var originPoint = collider.position.clone();
        
        
        for (let i = 0; i < collider_vertices.length; i += 3) {
          localVertex.set(collider_vertices[i], collider_vertices[i + 1], collider_vertices[i + 2]);
          localVertex.applyMatrix4(collider.matrix);
          directionVector.subVectors(localVertex, collider.position);
          
          const ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
          let collisionResults = ray.intersectObjects(instances);
          if(collisionResults.length != 0)
            console.log(collisionResults);
          if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            //INFO.innerHTML += "HIT!!!!!";
            Jet.position.set(0,0,0);
          }
        }
    }*/

    _renderer.render(_scene, _camera);
}

document.addEventListener("keydown", function(event) {
    key[event.keyCode] = true;
    
    //console.log(event.keyCode);
    switch(event.keyCode){
        case ('R'.charCodeAt(0)): 
            ObjectState.Orbit = 1 - ObjectState.Orbit;
            ObjectState.FreeCam = 1 - ObjectState.FreeCam;
            UpdateState();
        break;
        case ('F'.charCodeAt(0)): 
            ObjectState.Jet = 1 - ObjectState.Jet;
            //JetState.forward = 1 - JetState.forward;
            UpdateState();
        break;
        case ('C'.charCodeAt(0)): 
            ObjectState.Collision = 1 - ObjectState.Collision;
            //UpdateState();
        break;
        case (' '.charCodeAt(0)): 
            Jet.position.set(0,0,0);
            UpdateState();
        break;
        
        
    }
    
    
});

document.addEventListener("keyup", function(event) {
    key[event.keyCode] = false;
    
    if(ObjectState.Jet){
        JetState.pitchUp = 0;
        JetState.pitchDown = 0;
        JetState.rollLeft = 0;
        JetState.rollRight = 0;
        JetState.afterburner = 0;
        Afterburner.visible = false;
    }
    
});

function keyboard() {
    
    if (key[38]) { //ArrowUp
        JetState.pitchDown = 1;
    }
    if (key[40]) { //ArrowDown
        JetState.pitchUp = 1;
    }
    if (key[37]) { //ArrowLeft
        JetState.rollLeft = 1;
    }
    if (key[39]) { //ArrowRight
        JetState.rollRight = 1;
    }
    if (key[16]) { //ShiftLeft
        JetState.afterburner = 1;
    }
    if (key[17]) { //ControlLeft
        
    }

    if(ObjectState.Jet)
        updateRotationJet();

    }

  
function UpdateState(){
    if(ObjectState.Orbit){
        _camera.lookAt( _orbitControls.target );
        _orbitControls.enabled = true;
        //_orbitControls.reset();
    }else{
        _orbitControls.enabled = false;
    }
    
}

function updateRotationJet(){
    
    jetRotationVector.x = ( -JetState.pitchUp + JetState.pitchDown );
    jetRotationVector.z = ( -JetState.rollLeft + JetState.rollRight );
    
}

function updateJet( delta = 1 ){
    if(JetState.afterburner)
        Afterburner.visible = true;
    var JetspeedMult = delta * Params.JetSpeed * ((JetState.afterburner)? Params.JetAfterburner : 1);
	var JetrotMult = delta * Params.JetRollSpeed;
    
	Jet.translateZ( -JetState.forward * JetspeedMult );

	QuaternionHelp.set( -jetRotationVector.x * JetrotMult, 0, -jetRotationVector.z * JetrotMult, 1 ).normalize();
	Jet.quaternion.multiply( QuaternionHelp );

	Jet.rotation.setFromQuaternion( Jet.quaternion, Jet.rotation.order );

    
}


function Legend(){
    
        INFO = document.createElement('div');
        INFO.id = "Info";
        INFO.setAttribute("style", "left:0; top:0; position: fixed; color: white; font-size:20px; font-family: Consolas");
        
        document.body.appendChild(INFO);
        
        OPIS = document.createElement('div');
        OPIS.id = "Opis";
        OPIS.setAttribute("style", "width: 500px; left:0; top:0; position: fixed;");
        document.getElementById('Info').appendChild(OPIS);
        
        AUTHORS = document.createElement('div');
        AUTHORS.id = "Autorzy";
        AUTHORS.setAttribute("style", "width: 1000px; left:0; bottom:0; position: fixed; font-size:15px;");
        document.getElementById('Info').appendChild(AUTHORS);
            
}

function AsteroidsGenerator(){
    console.log("Start Generate!!!");
    if(Asteroids != 0){
        console.log("Start Clear!!!");
        Asteroids.dispose();
    }
    const Object_emulation = new THREE.Object3D();
    Asteroids = new THREE.InstancedMesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshBasicMaterial({color: 0xffffff}),
                    Ilosc_asteroid
                );
    
    let i = 0;
    for(let x = -30; x < 30; x++){
        for(let y = -30; y < 30; y++){
            for(let z = -30; z< 30; z++){

                
                Object_emulation.position.set(
                    Math.random()*500 + x * 500,
                    Math.random()*500 + y * 500,
                    Math.random()*500 + z * 500
                );
                Object_emulation.scale.set(20.0, 20.0 ,20.0);
                Object_emulation.rotation.set(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI);

				Object_emulation.updateMatrix();
                
				Asteroids.setMatrixAt( i, Object_emulation.matrix );
                Asteroids.setColorAt( i, new THREE.Color(Math.random(), Math.random(), Math.random()) );
                
                i++;
    }}}
    console.log("Generate Done!!!");
}


function _OnWindowResize(){
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
}