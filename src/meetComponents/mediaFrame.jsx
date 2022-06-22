import React from "react";
import './mediaframe.css';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import PeerCore from "../peerCore";
// import { createProgramInfo, createTexture, m4, primitives, setBuffersAndAttributes, setUniforms, createBufferInfoFromArrays } from "twgl.js";
import { createProgram } from "twgl.js/dist/4.x/twgl";

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
                    return (<AvatarMedia peerId={this.peer.id} localStream={e.stream} stream-type={"avatar"} key={e.stream.id} isHost={e.isHost} />)
                case "screen":
                    return (<StreamMedia peerId={this.peer.id} localStream={e.stream} stream-type={"screen"} key={e.stream.id} isHost={e.isHost} />)
                case "webcam":
                    return (<StreamMedia peerId={this.peer.id} localStream={e.stream} stream-type={"webcam"} key={e.stream.id} isHost={e.isHost} />)
                default:
                // return (<StreamMedia mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession}/>)
            }
        })
    }

    displayScreenShares() {
        return this.props.localStreams.map((e, i) => {
            switch (e.type) {
                case "avatar":
                    return (<AvatarMedia peerId={e.peer} localStream={e.stream} stream-type={"avatar"} key={e.stream.id} isHost={e.isHost} />)
                case "screen":
                    return (<StreamMedia peerId={e.peer} localStream={e.stream} stream-type={"screen"} key={e.stream.id} isHost={e.isHost} />)
                default:
                // return (<StreamMedia mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession}/>)
            }
        })
    }


    displayStreams() {
        return this.state.incomingStreams.map((e, i) => {
            switch (e.metadata.info) {
                case "avatar":
                    return (<RemoteAvatarMedia peerId={e.peer} mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession} />)
                default:
                    return (<RemoteStreamMedia peerId={e.peer} mediaConnection={e} stream-type={e.metadata.info} key={e.connectionId} isHost={e.peer === this.peer.currentSession} />)
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
            ready: false,
            offset: null
        }
        this.initStream = this.initStream.bind(this);
        this.followOffset = this.followOffset.bind(this);
        this.videoRef = React.createRef();
        this.title = "Your Camera";
        this.interval = null;
        // this.followTarget = null;
    }

    componentDidMount() {
        this.initStream(this.props.localStream);
        this.interval = setInterval(() => {
            this.setState({
                offset: this.followOffset()
            });
        }, 1000 / 20);
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    }

    //stupid followng function lol
    followOffset(){
        // return;
        if(this.props['stream-type'] !== "webcam") return;
        let followTarget = document.querySelector(`.media-items .avatar[data-peer='${this.props.peerId}']`);
        if(!followTarget) return ;
        let bound = followTarget.getBoundingClientRect();
        let styletext = {
            bottom: bound.height * 0.7,
            left: bound.width * 0.7 + bound.x,
            transform: "scale(0.5)"
        }
        return styletext;
    }

    initStream(stream) {
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
        const offset = this.state.offset;
        const css = `${this.state.ready ? "d-inline-block" : "d-none"} border border-primary ${offset?"position-absolute":"position-relative"} ${this.props['stream-type']}`
        return (

            <div style={offset} className={css} data-peer={this.props.peerId}>
                <span className="position-absolute">
                    {this.title}
                </span>
                <div className="video-limitor">
                <video className="d-block" ref={this.videoRef} />
                </div>
            </div>
        )
    }
}

class RemoteStreamMedia extends StreamMedia {
    constructor(props) {
        super(props);
        this.state = {
            ready: false
        }
        this.title = `${this.props.mediaConnection.metadata.owner}'s Camera`;
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        this.props.mediaConnection.on("stream", this.initStream);
        this.interval = setInterval(() => {
            this.setState({
                offset: this.followOffset()
            });
        }, 1000 / 20);
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


        /** @type {WebGLRenderingContext} */
        let ctx = this.canvasRef.current.getContext('webgl');
        console.log(ctx);
        const program = createProgram(ctx, [vs, fs]);
        const srcTex = initTexture(ctx);
        const alphaTex = initTexture(ctx);
        let step = () => {
            updateTexture(ctx, srcTex, this.avatarVideoRef.current);
            updateTexture(ctx, alphaTex, this.alphaVideoRef.current);
            render(ctx, program, [srcTex, alphaTex]);

            requestAnimationFrame(step)
        }
        requestAnimationFrame(step);
    }

    render() {
        const css = `${this.state.ready ? "" : "d-none"} position-relative avatar ${this.props.isHost ? "host" : ""}`
        return (
            <div className={css} data-peer={this.props.peerId}>
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



//------------------------------- WEBGL Processings----------------------------

function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

/**
 * 
 * @param {GPU} gpu 
 */
function createApplier(gpu) {
    return gpu.createKernel(function (src, alpha) {
        console.log(src)
        const pixel = src[this.thread.y][this.thread.x];
        const pixel_alpha = alpha[this.thread.y][this.thread.x];
        this.color(pixel[0], pixel[1], pixel[2], pixel_alpha[0]);
    }).setGraphical(true)
        .setOutput([500, 500]);
}


/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @returns 
 */
function initTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because video has to be download over the internet
    // they might take a moment until it's ready so
    // put a single pixel in the texture so we can
    // use it immediately.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

    // Turn off mips and set wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {WebGLTexture} texture 
 * @param {*} video 
 */
function updateTexture(gl, texture, video) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, video);
}

const vs = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}
`;

const fs = `
precision mediump float;

// our textures
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = vec4(color0[0],color0[1],color0[2],color1[0]);
}
`;

function render(gl, program, textures) {
    // Get A WebGL context

    // setup GLSL program
    // var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, 500, 500);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    // create 2 textures


    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    // lookup the sampler locations.
    var u_image0Location = gl.getUniformLocation(program, "u_image0");
    var u_image1Location = gl.getUniformLocation(program, "u_image1");

    // webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // set which texture units to render with.
    gl.uniform1i(u_image0Location, 0);  // texture unit 0
    gl.uniform1i(u_image1Location, 1);  // texture unit 1

    // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[1]);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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