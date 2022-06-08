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
            incomingStreams: [],
            calloutStreams: []
        }
        // this.registerStream = this.registerStream.bind(this);
        // this.getStreams = this.getStreams.bind(this);
        /** @type {PeerCore} */
        this.peer = this.props.peer;
        this.displayStreams = this.displayStreams.bind(this);
        this.displayLocalStreams = this.displayLocalStreams.bind(this);
    }

    componentDidMount() {
        this.peer.on("call", () => {
            console.log("getting call", this.peer.activeCustomStreamList);
            this.setState({ incomingStreams: this.peer.activeCustomStreamList });
        })
    }

    componentWillUnmount() {
        this.state.calloutStreams.forEach(e => {
            this.peer.stopCustomCall(e);
        })
    }

    displayLocalStreams() {
        return this.props.localStreams.map((e, i) => {
            switch (e.type) {
                case "avatar":
                    return (<AvatarMedia localStream={e.stream} stream-type={"avatar"} key={e.stream.id} isHost={e.isHost} />)
                case "screen":
                    return (<StreamMedia localStream={e.stream} stream-type={"screen"} key={e.stream.id} isHost={e.isHost} />)
                default:
                // return (<StreamMedia mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession}/>)
            }
        })
    }


    displayStreams() {
        return this.state.incomingStreams.map((e, i) => {
            switch (e.metadata.info) {
                case "avatar":
                    return (<RemoteAvatarMedia mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession} />)
                default:
                    return (<RemoteStreamMedia mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession} />)
            }
        })
    }

    render() {
        return (
            <div className="media-container vh-100 container-fluid pt-10 p-5 position-relative">
                <div className="col-6 position-absolute top-50 start-50 translate-middle media-items">
                    <div className="avatars d-flex">
                        {this.displayLocalStreams()}
                        {this.displayStreams()}
                    </div>

                </div>
            </div>
        )
    }
}

class StreamMedia extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ready: false
        }
        this.initStream = this.initStream.bind(this);
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        this.initStream(this.props.localStream);

    }

    initStream(stream){
        this.setState({ ready: true })
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
    }

    render() {
        const css = `${this.state.ready ? "d-inline-block" : "d-none"} border border-primary position-relative ${this.props['stream-type']}`
        return (
            <div className={css}><video className="d-block" ref={this.videoRef} /></div>
        )
    }
}

class RemoteStreamMedia extends StreamMedia {
    constructor(props) {
        super(props);
        this.state = {
            ready: false
        }
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        this.props.mediaConnection.on("stream", this.initStream)
    }
}

class AvatarMedia extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ready: true
        }
        this.alphaVideoRef = React.createRef();
        this.avatarVideoRef = React.createRef();
        this.canvasRef = React.createRef();
        this.initStream = this.initStream.bind(this)

        this.title = "Your Avatar"
    }
    componentDidMount() {
        this.initStream(this.props.localStream);
    }

    initStream = (stream) => {
        console.log("ON STREAM", stream);
        const tracks = stream.getTracks();
        const avatarStream = new MediaStream([tracks[0]]);
        const alphaStream = new MediaStream([tracks[1]]);
        this.avatarVideoRef.current.srcObject = avatarStream;
        this.alphaVideoRef.current.srcObject = alphaStream;

        this.avatarVideoRef.current.onloadedmetadata = ((video) => {
            return (e) => {
                video.play();
            }
        })(this.avatarVideoRef.current);
        this.avatarVideoRef.current.oninactive = ((video) => {
            return (e) => {
                alert("bye");
            }
        })(this.avatarVideoRef.current);

        this.alphaVideoRef.current.onloadedmetadata = ((video) => {
            return (e) => {
                video.play();
            }
        })(this.alphaVideoRef.current);
        this.alphaVideoRef.current.oninactive = ((video) => {
            return (e) => {
                alert("bye");
            }
        })(this.alphaVideoRef.current);
        let ctx = this.canvasRef.current.getContext('2d');
        let step = () => {
            ctx.drawImage(this.avatarVideoRef.current, 0, 0, 500, 500);
            let frame1 = ctx.getImageData(0, 0, 500, 500);
            let l = frame1.data.length / 4;
            ctx.drawImage(this.alphaVideoRef.current, 0, 0, 500, 500);
            let frame2 = ctx.getImageData(0, 0, 500, 500);

            for (let i = 0; i < l; i++) {
                frame1.data[i * 4 + 3] = frame2.data[i * 4];
            }

            ctx.putImageData(frame1, 0, 0);
            requestAnimationFrame(step)
        }
        requestAnimationFrame(step);
    }

    render() {
        const css = `${this.state.ready ? "" : "d-none"} position-relative avatar ${this.props.isHost ? "host" : ""}`
        return (
            <div className={css}>
                <span className="position-absolute">
                    {this.title}
                </span>

                <video className="d-none" ref={this.avatarVideoRef} />
                <video className="d-none" ref={this.alphaVideoRef} />
                <canvas width={500} height={500} className="d-block" ref={this.canvasRef} />
            </div>
        )
    }

}


class RemoteAvatarMedia extends AvatarMedia {
    constructor(props) {
        super(props);
        this.title = `${this.props.mediaConnection.metadata.owner}'s avatar`;
    }

    componentDidMount() {
        this.props.mediaConnection.on("stream", this.initStream)
    }


}





// class DummyMedia extends React.Component {

//     constructor(props) {
//         super(props);

//         this.state = {
//             checker: false
//         }

//         this.canvasRef = React.createRef();

//         /** @type {THREE.Renderer} */
//         this.renderer = null;
//         this.handleInput = this.handleInput.bind(this);
//     }

//     handleInput(e) {
//         this.setState({ checker: e.target.checked });
//     }

//     componentDidMount() {
//         try {
//             const scene = new THREE.Scene();

//             const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
//             const renderer = new THREE.WebGLRenderer();

//             const spotlight = new THREE.SpotLight(0xffffff, 0.5, 0);
//             spotlight.castShadow = true;
//             spotlight.shadow.mapSize.width = 1024;
//             spotlight.shadow.mapSize.height = 1024;

//             spotlight.lookAt(-0.1, -0.5, -0.1);

//             spotlight.shadow.camera.near = 500;
//             spotlight.shadow.camera.far = 4000;
//             spotlight.shadow.camera.fov = 30;

//             scene.add(spotlight);

//             this.renderer = renderer;
//             renderer.setSize(this.props.width, this.props.height);
//             renderer.setClearColor(0xFFFFFF);
//             this.canvasRef.current.appendChild(renderer.domElement);

//             renderer.shadowMap.enabled = true;
//             renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//             const light = new THREE.DirectionalLight(0xffffff, 2);
//             light.position.set(2, 2, 2);
//             light.castShadow = true;
//             scene.add(light);

//             const light2 = new THREE.PointLight(0xffefc2, 2);
//             light2.position.set(-3, -3, -3);
//             scene.add(light2);


//             const ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
//             scene.add(ambientLight);

//             const envMap = new THREE.CubeTextureLoader()
//                 .setPath('./assets/three/cubemap/')
//                 .load([
//                     'px.png',
//                     'nx.png',
//                     'py.png',
//                     'ny.png',
//                     'pz.png',
//                     'nz.png'
//                 ]);


//             scene.background = envMap;


//             const texLoader = new THREE.TextureLoader();
//             texLoader.setPath('./assets/three/');
//             const uv = texLoader.load("CARUV 2.png")
//             const checker = texLoader.load("checker.jpg")
//             const spec = texLoader.load("CAR_SPEC 2.png")
//             const occl = texLoader.load("CAR_OCCL.png")
//             const carMat = new THREE.MeshPhongMaterial({ map: uv, aoMap: occl, specularMap: spec, reflectivity: 0.3, envMap: envMap, combine: THREE.MixOperation, shininess: 70 })
//             const loader = new OBJLoader();
//             /** @type {THREE.Group} */
//             let car = null;

//             // const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 10);
//             // const wheelMat = new THREE.MeshPhongMaterial({ color: 0x0f0f0f });

//             loader.load("./assets/three/car2.obj",
//                 (obj) => {
//                     console.log(obj);
//                     obj.children[0].material = carMat;
//                     obj.children[0].castShadow = true;
//                     obj.children[0].receiveShadow = true;
//                     car = obj;
//                     scene.add(obj);
//                 },
//                 function (xhr) {
//                     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//                 },

//                 // onError callback
//                 function (err) {
//                     console.error('THREE OBJ LOADING ERROR', err);
//                 }
//             )

//             camera.position.z = 5;
//             camera.position.y = 2;
//             camera.position.x = 2;
//             const controls = new OrbitControls(camera, renderer.domElement);
//             controls.update();

//             const parent = this;
//             function animate() {
//                 requestAnimationFrame(animate);
//                 if (car) {
//                     if (parent.state.checker) {
//                         car.children[0].material.map = checker;
//                     } else {
//                         car.children[0].material.map = uv;
//                     }
//                     car.rotateY = Date.now() * 0.01;
//                 }
//                 spotlight.position.set(camera.position.x + 0.2, camera.position.y + 1, camera.position.z + 0.2);
//                 // spotlight.rotation.set(camera.rotation.x + 0.2, camera.rotation.y + 0.2,camera.rotation.z + 0.2);
//                 controls.update();
//                 renderer.render(scene, camera);

//             }
//             console.log("THIS", this);
//             animate();
//             const stream = renderer.domElement.captureStream(60);
//             console.log("threejs Stream", stream)
//             this.props.registerStream(stream, "dummy media");
//         } catch (err) {
//             console.error("THREEJS ERROR", err);
//         }

//     }

//     componentWillUnmount() {
//         console.log("bye");
//         this.renderer.dispose();
//     }

//     render() {
//         return (
//             <div className="d-inline-block border border-primary position-relative">
//                 <label className="d-inline-block position-absolute top-0" id="title">Your dummy media</label>
//                 <div ref={this.canvasRef}>
//                     <div className="form-check position-absolute bottom-0 m-3">
//                         <input onClick={this.handleInput} className="form-check-input" type="checkbox" value="" id="checkerboard" />
//                         <label className="form-check-label" htmlFor="checkerboard">Toggle Checkerboard</label>
//                     </div>
//                 </div>
//             </div>
//         )
//     }
// }

export default MediaFrame;