import React from "react";
import './mediaframe.css';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import PeerCore from "../peerCore";

class MediaFrame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            streams: []
        }
        this.registerStream = this.registerStream.bind(this);
        // this.getStreams = this.getStreams.bind(this);
        /** @type {PeerCore} */
        this.peer = this.props.peer;

    }

    componentDidMount() {
        this.peer.on("call", () => {
            console.log("getting call", this.peer.activeCustomStreamList);
            this.setState({ streams: this.peer.activeCustomStreamList });
        })
    }

    registerStream = (stream, type) => {
        console.log("register stream", stream);
        stream.metadata = {};
        stream.metadata.custom = type;
        this.peer.startCustomCall(stream);
    }


    render() {
        return (
            <div className="media-container vh-100 container-fluid pt-10 p-5 position-relative">
                <div className="col-6 position-absolute top-50 start-50 translate-middle">
                    <DummyMedia registerStream={this.registerStream} width={300} height={300} />
                    {this.state.streams.map((e, i) => <StreamMedia mediaConnection={e} stream-type={e.metadata.type} key={i} />)}
                </div>
            </div>
        )
    }
}

class StreamMedia extends React.Component {
    constructor(props) {
        super(props);
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        this.props.mediaConnection.on("stream", (stream) => {
            console.log(stream);
            this.videoRef.current.srcObject = stream;
            this.videoRef.current.onloadedmetadata = ((video) => {
                return (e) => {
                    video.play();
                }
            })(this.videoRef.current);
            this.videoRef.current.oninactive = ((video) => {
                return (e) => {
                    alert("bye");
                }
            })(this.videoRef.current);
        })

    }

    render() {
        return (
            <div className="d-inline-block border border-primary position-relative"><video ref={this.videoRef} /></div>
        )
    }
}


class DummyMedia extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            checker: false
        }

        this.canvasRef = React.createRef();

        /** @type {THREE.Renderer} */
        this.renderer = null;
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        this.setState({ checker: e.target.checked });
    }

    componentDidMount() {
        try {
            const scene = new THREE.Scene();

            const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer();

            const spotlight = new THREE.SpotLight(0xffffff, 0.5, 0);
            spotlight.castShadow = true;
            spotlight.shadow.mapSize.width = 1024;
            spotlight.shadow.mapSize.height = 1024;

            spotlight.lookAt(-0.1, -0.5, -0.1);

            spotlight.shadow.camera.near = 500;
            spotlight.shadow.camera.far = 4000;
            spotlight.shadow.camera.fov = 30;

            scene.add(spotlight);

            this.renderer = renderer;
            renderer.setSize(this.props.width, this.props.height);
            renderer.setClearColor(0xFFFFFF);
            this.canvasRef.current.appendChild(renderer.domElement);

            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            const light = new THREE.DirectionalLight(0xffffff, 2);
            light.position.set(2, 2, 2);
            light.castShadow = true;
            scene.add(light);

            const light2 = new THREE.PointLight(0xffefc2, 2);
            light2.position.set(-3, -3, -3);
            scene.add(light2);


            const ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
            scene.add(ambientLight);

            const envMap = new THREE.CubeTextureLoader()
                .setPath('./assets/three/cubemap/')
                .load([
                    'px.png',
                    'nx.png',
                    'py.png',
                    'ny.png',
                    'pz.png',
                    'nz.png'
                ]);


            scene.background = envMap;


            const texLoader = new THREE.TextureLoader();
            texLoader.setPath('./assets/three/');
            const uv = texLoader.load("CARUV 2.png")
            const checker = texLoader.load("checker.jpg")
            const spec = texLoader.load("CAR_SPEC 2.png")
            const occl = texLoader.load("CAR_OCCL.png")
            const carMat = new THREE.MeshPhongMaterial({ map: uv, aoMap: occl, specularMap: spec, reflectivity: 0.3, envMap: envMap, combine: THREE.MixOperation, shininess: 70 })
            const loader = new OBJLoader();
            /** @type {THREE.Group} */
            let car = null;

            const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 10);
            const wheelMat = new THREE.MeshPhongMaterial({ color: 0x0f0f0f });

            loader.load("./assets/three/CAR2.obj",
                (obj) => {
                    console.log(obj);
                    obj.children[0].material = carMat;
                    obj.children[0].castShadow = true;
                    obj.children[0].receiveShadow = true;
                    car = obj;
                    scene.add(obj);
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },

                // onError callback
                function (err) {
                    console.error('THREE OBJ LOADING ERROR', err);
                }
            )

            camera.position.z = 5;
            camera.position.y = 2;
            camera.position.x = 2;
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.update();

            const parent = this;
            function animate() {
                requestAnimationFrame(animate);
                if (car) {
                    if (parent.state.checker) {
                        car.children[0].material.map = checker;
                    } else {
                        car.children[0].material.map = uv;
                    }
                    car.rotateY = Date.now() * 0.01;
                }
                spotlight.position.set(camera.position.x + 0.2, camera.position.y + 1, camera.position.z + 0.2);
                // spotlight.rotation.set(camera.rotation.x + 0.2, camera.rotation.y + 0.2,camera.rotation.z + 0.2);
                controls.update();
                renderer.render(scene, camera);

            }
            console.log("THIS", this);
            animate();
            const stream = renderer.domElement.captureStream(60);
            console.log("threejs Stream", stream)
            this.props.registerStream(stream, "dummy media");
        } catch (err) {
            console.error("THREEJS ERROR", err);
        }

    }

    componentWillUnmount() {
        console.log("bye");
        this.renderer.dispose();
    }

    render() {
        return (
            <div className="d-inline-block border border-primary position-relative">
                <label className="d-inline-block position-absolute top-0" id="title">Your dummy media</label>
                <div ref={this.canvasRef}>
                    <div className="form-check position-absolute bottom-0 m-3">
                        <input onClick={this.handleInput} className="form-check-input" type="checkbox" value="" id="checkerboard" />
                        <label className="form-check-label" htmlFor="checkerboard">Toggle Checkerboard</label>
                    </div>
                </div>
            </div>
        )
    }
}

export default MediaFrame;