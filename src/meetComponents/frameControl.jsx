import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignal } from "@fortawesome/free-solid-svg-icons";
import { FaceMesh } from "@mediapipe/face_mesh";
import 'bootstrap/dist/css/bootstrap.min.css';
import './frameControl.css'
// import * as bootstrap from 'bootstrap';

class FrameControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            devices: [],
            audioContext: null,
            volume: 0
        }
        this.updateMediadevices = this.updateMediadevices.bind(this);
        this.updateVideoInput = this.updateVideoInput.bind(this);
        this.updateAudioInput = this.updateAudioInput.bind(this);
        this.updateAvatar = this.updateAvatar.bind(this);
        this.micRef = React.createRef();
        this.camRef = React.createRef();
        this.audioRef = React.createRef();
        this.previewRef = React.createRef();
        this.avatarRef = React.createRef();
        this.faceDataRef = React.createRef();
        this.avatar = null;
        this.faceDetectinterval = null;
    }

    async updateMediadevices() {
        let devices = await navigator.mediaDevices.enumerateDevices();
        this.setState({ devices: devices })
    }

    async componentDidMount() {
        init();
        window.initFramework();
        const constraints = {
            video: {
                deviceId: undefined,
                height: 480
            }
        };
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.previewRef.current.srcObject = stream;
        this.previewRef.current.play();
        this.updateMediadevices();

        console.log(this.micRef.current);

        this.avatarRef.current.appendChild(document.querySelector("canvas.live2D"))
        this.avatar = await window.loadModel("./cubismSDK/resource/hiyori/Hiyori.model3.json");
        this.faceDetectinterval = setInterval(() => {
            if (!this.avatar) return;
            let x = ((window.faceXRotation - window.faceXOffset) * (180 / Math.PI)) || 0;
            let y = ((window.faceYRotation - window.faceYOffset) * (180 / Math.PI))  || 0;
            let z = ((window.faceZRotation - window.faceZOffset) * (180 / Math.PI)) || 0;
            if(y > 180) y -= 360;
            if(x > 180) x -= 360;
            if(z > 180) z -= 360;
            this.avatar.character.setMotion(y, -x * 2, -z * 2, 1, 0);
            this.avatar.character.setEyes(y * 0.1, -x * 0.1, 1,1);
            this.faceDataRef.current.innerHTML = `${y},<br/> ${-x * 2},<br/> ${-z * 2}`
        }, 100)
    }

    componentWillUnmount(){
        clearInterval(this.faceDetectinterval);
    }

    async updateVideoInput(e) {
        this.previewRef.current.srcObject.getTracks().forEach(track => {
            track.stop();
        });

        let cameraDevice = e.target.value;
        const constraints = {
            video: {
                deviceId: cameraDevice,
                height: 480
            }
        };
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.previewRef.current.srcObject = stream;
        this.previewRef.current.play();
    }

    async updateAudioInput(e) {
        if (this.state.audioContext) this.state.audioContext.close();

        let audioDevice = e.target.value;
        const constraints = {
            audio: {
                deviceId: audioDevice
            }
        };
        let stream = await navigator.mediaDevices.getUserMedia(constraints);


        let audioContext = new AudioContext();
        this.setState({ audioContext: audioContext });
        let analyser = audioContext.createAnalyser();
        let microphone = audioContext.createMediaStreamSource(stream);
        let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 32;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        let scope = this;

        javascriptNode.onaudioprocess = function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += (array[i]);
            }
            scope.setState(
                { volume: values / length }
            )
            //  console.log(Math.round(average - 40));

        } // end fn stream
    }

    async updateAvatar(e) {
        this.avatar.character.remove();
        this.avatar = await window.loadModel(e.target.value);
    }




    render() {
        return (
            <div>
                <div type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasScrolling" aria-controls="offcanvasScrolling" className="btn btn-light framecontrol position-absolute top-0 start-0 m-3 border rounded-3">
                    <FontAwesomeIcon icon={faBars} />
                </div>
                <div className="offcanvas offcanvas-start" data-bs-scroll="true" data-bs-backdrop="false" tabIndex="-1" id="offcanvasScrolling" aria-labelledby="offcanvasScrollingLabel">
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasScrollingLabel">Settings</h5>
                        <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body settings-body">
                        <p id="name">Name: {this.props.account.name}</p>
                        <p id="session">Current Session: {this.props.session}</p>
                        <div id="connectors">Connected Users: ({this.props.friends.length + 1})
                            <ul className="list-group list-group-flush mt-3 mb-3 ps-3 pe-3">
                                {this.props.friends.map((x, index) => (
                                    <li key={index} className="list-group-item"><FontAwesomeIcon icon={faSignal} />  {x.name}{x.peer === this.props.session ? " (host)" : ""}</li>
                                ))}
                                <li className="list-group-item"><FontAwesomeIcon icon={faSignal} />  You</li>
                            </ul>
                        </div>
                        <p>
                            Microphone:
                            <select onChange={this.updateAudioInput} ref={this.micRef} className="form-select" aria-label="Default select example">
                                {
                                    this.state.devices.filter(device => device.kind === "audioinput").map((val, ind) =>
                                        (<option key={ind} value={val.deviceId}>{val.label || "Mic " + ind}</option>)
                                    )
                                }
                            </select>
                            <div ref={this.audioRef}>{this.state.volume}</div>
                        </p>
                        <p>
                            Camera:
                            <select onChange={this.updateVideoInput} ref={this.camRef} className="form-select" aria-label="Default select example">
                                {
                                    this.state.devices.filter(device => device.kind === "videoinput").map((val, ind) =>
                                        (<option key={ind} value={val.deviceId}>{val.label || "Camera " + ind}</option>)
                                    )
                                }
                            </select>
                            Preview:<br />

                            <video id="video-player" ref={this.previewRef} className="border col-12" src=""></video>


                        </p>
                        <p>
                            Avatar:
                            <select onChange={this.updateAvatar} className="form-select" aria-label="Default select example">
                                <option value="cubismSDK/resource/hiyori/Hiyori.model3.json">Hiyori</option>
                                <option value="cubismSDK/resource/Haru/Haru.model3.json">Haru</option>
                                <option value="cubismSDK/resource/Natori/Natori.model3.json">Natori</option>
                                <option value="cubismSDK/resource/miku/miku_sample_t04.model3.json">Miku</option>
                            </select>
                            <button onClick={() => {
                                window.faceXOffset = window.faceXRotation;
                                window.faceYOffset = window.faceYRotation;
                                window.faceZOffset = window.faceZRotation;
                            }} className="btn btn-primary mt-1 mb-1">Calibrate</button>
                            <p ref={this.faceDataRef} ></p>
                            <div id="avatar-container" ref={this.avatarRef}>
                                <div className="canvas-container border" width="500px" height="500px">

                                </div>
                            </div>
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}

async function init() {
    let calibrated = false;
    const videoElement = document.getElementById("video-player");
    const faceMesh = await new FaceMesh({
        locateFile: (file) => {
            return `assets/${file}`;
        }
    });

    console.log("face model loaded")


    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onDetectedFace);

    async function sendVideoElement(stream) {
        try {
            await faceMesh.send({ image: videoElement });
        } catch (err) {
            console.error("sendVideoElement", err);
        }
        let callback = () => {
            sendVideoElement(stream);
        }
        if (stream.active) requestAnimationFrame(callback);
    }
    // sendVideoElement();
    videoElement.onloadeddata = () => {
        let stream = videoElement.captureStream();
        sendVideoElement(stream);
    }
    // facedetect 
    function onDetectedFace(results) {
        const face = results.multiFaceLandmarks[0] || null;
        if (face) {
            window.lastDetectedFace = face;
            window.lastDetectedFaceImage = results.image;
            notifyDetectedFace();
            calculateFaceData(face);
            // previewFaceMesh(face, results.image);
            if (!calibrated) {
                window.faceXOffset = window.faceXRotation;
                window.faceYOffset = window.faceYRotation;
                window.faceZOffset = window.faceZRotation;
                calibrated = true;
            }
        }
    }
}
let lastTime = 0;
let fpsCounter = document.getElementById("fps");
let smoother = [0, 0, 0, 0, 0, 0, 0, 0, 0]
let detectedFaceListener = [];

function notifyDetectedFace() {
    let diff = (Date.now() - lastTime);
    smoother.unshift(diff);
    smoother.pop();
    try {
        fpsCounter.innerHTML = 1000 / (smoother.reduce((a, b) => a + b, 0) / smoother.length);
    } catch {

    }

    lastTime = Date.now();
    detectedFaceListener.forEach(e => e());
}

window.lastDetectedFace = null;
const filterLength = 10
window.sampleRate = 16
window.cutoff = 22050;
const faceXArray = Array(filterLength).fill(0);
const faceYArray = Array(filterLength).fill(0);
const faceZArray = Array(filterLength).fill(0);
function calculateFaceData(face) {
    let normal = calculateNormal(face[8], face[36], face[266]);

    faceXArray.shift()
    faceYArray.shift()
    faceZArray.shift()

    faceXArray.push(calculateAngle(normal.y, normal.z));
    faceYArray.push(calculateAngle(normal.x, normal.z));
    faceZArray.push(calculateAngle(face[266].y, face[36].y) * 4);
    if (window.filter) {
        // console.log(faceXArray, faceYArray, faceZArray)
        let faceXArraySnapshot = faceXArray.slice();
        let faceYArraySnapshot = faceYArray.slice();
        let faceZArraySnapshot = faceZArray.slice();

        // lowPassFilter.lowPassFilter(faceXArraySnapshot, window.cutoff, window.sampleRate, 1);
        // lowPassFilter.lowPassFilter(faceYArraySnapshot, window.cutoff, window.sampleRate, 1);
        // lowPassFilter.lowPassFilter(faceZArraySnapshot, window.cutoff, window.sampleRate, 1);
        console.log(faceXArraySnapshot);

        window.faceXRotation = faceXArraySnapshot[5];
        window.faceYRotation = faceYArraySnapshot[5];
        window.faceZRotation = faceZArraySnapshot[5];
    } else {
        window.faceXRotation = faceXArray.at(-1)
        window.faceYRotation = faceYArray.at(-1)
        window.faceZRotation = faceZArray.at(-1)
    }

}

function calculateNormal(a, b, c) {
    let k = Vector.sub(b, a);
    let j = Vector.sub(c, a);
    let Nx = k.y * j.z - k.z * j.y;
    let Ny = k.z * j.x - k.x * j.z;
    let Nz = k.x * j.y - k.y * j.x;
    return { x: Nx, y: Ny, z: Nz }
}

function calculateAngle(x, y) {
    var rad = Math.atan(y / x);   // arcus tangent in radians
    if (x < 0) rad += Math.PI;
    rad += (Math.PI / 2) * 3;
    return rad;
}

const Vector = {
    sub: (b, a) => {
        return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    }
}


export default FrameControl;