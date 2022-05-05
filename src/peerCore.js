import Peer from "peerjs";
import * as util from "./utils";


const corePingingInterval = 3000;
const coreMissedPingTolerance = 10;
/**
 * handles connection, host session, call, data 
 */
class PeerCore {

    constructor(name, hostSession = null) {
        this._ready = false;
        this._name = name

        //TODO find a smarter way to signify a host???
        //null if is host
        this._hostSession = hostSession
        /** @type {Peer} */
        this.peer = null;
        this.started = false;
        this.connectors = 0;

        this._connectorConnList = [];

        this._connList = [];

        this._connectorMissedPings = {}

        this._activeAudioCalloutList = [];
        this._activeCameraCalloutList = [];
        this._activeCaptureCalloutList = [];
        this._activeWebGLCalloutList = [];

        this._activeCustomCalloutList = [];

        this._incomingAudioList = [];
        this._incomingCameraList = [];
        this._incomingCaptureList = [];
        this._incomingWebGLList = [];

        this._incomingCustomList = [];

        //event subscription list to notify UI
        this._messageEvList = [];
        this._streamEvList = [];
        this._openEvList = [];
        this._connEvList = [];

        /** @type {MediaStream} */
        this.audioStream = null
        /** 
         * is interchangable between cam and vtuber
         * @type {MediaStream} */
        this.cameraStream = null;
        /** @type {MediaStream} */
        this.captureStream = null;

    }

    //------------------getters--------------------------

    get ready() { return this._ready };
    get name() { return this._name }
    get id() { return this.peer.id; }

    get isHost() { return (this._hostSession === '' || !this._hostSession) }
    get currentSession() { return this.isHost ? this.peer.id : this._hostSession }
    get connectedIDs() {
        return this._connList.map(x => x.peer);
    }
    get connectedMetadatas() {
        return this._connList.map(x => x.metadata);
    }


    //--------------------------------------------------
    init() {

        // TODO setup a proper TURN server of my own
        this.peer = new Peer({
            secure: true,
            host: "howlemon-peerjs.herokuapp.com",
            port: 443,
            config: {
                'iceServers': [
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun1.l.google.com:19302' },
                    { url: 'stun:stun2.l.google.com:19302' },
                    { url: 'stun:stun3.l.google.com:19302' },
                    { url: 'stun:stun4.l.google.com:19302' },
                    {
                        url: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                    {
                        url: 'turn:192.158.29.39:3478?transport=udp',
                        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        username: '28224511:1379330808'
                    },
                    {
                        url: 'turn:192.158.29.39:3478?transport=tcp',
                        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        username: '28224511:1379330808'
                    },
                    {
                        url: 'turn:turn.bistri.com:80',
                        credential: 'homeo',
                        username: 'homeo'
                    },
                    {
                        url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                        credential: 'webrtc',
                        username: 'webrtc'
                    }

                ]
            }
        });

        // peer built-in events

        this.peer.on('open', (id) => {
            this._localMessageEvent(`session ID: ${id}`, "system", Date.now())
            this._localMessageEvent(`is host: ${this.isHost}`, "system", Date.now())
            console.log("PeerCore open", id);
            this._openEvList.forEach(e => e(id));
            //if is not host, connect to a specified session
            if (!this.isHost) {
                this._localMessageEvent(`Attempting to connect to Host`, "system", Date.now())
                this._requestConnect(this._hostSession);
            }
        });

        this.peer.on('connection', (conn) => {
            this._localMessageEvent(`${conn.metadata.name} has connected to this session`, "system", Date.now());
            this._handleDataConnection(conn);

            console.log("PeerCore conn", conn);
        });

        this.peer.on('error', (err) => {
            console.log("PeerCore error", err);
        });

        this.peer.on("call", (call) => {
            console.log("PeerCore call", call);
            this.handleStreamInput(call);
        });
    }

    //event subscriber
    on(event, fn) {
        switch (event) {
            case "open":
                this._openEvList.push(fn);
                break;
            case "connection":
                this._connEvList.push(fn);
                break;
            case "message":
                this._messageEvList.push(fn);
                break;
            case "call":
                this._streamEvList.push(fn);
                break;
            default:
                console.log("unknown event type????")
        }
    }

    //-------------------streaming data handlers--------------------------

    handleStreamInput(incomingStream) {

        console.log("incoming call stream data")


        incomingStream.assignStreamCallBack = (fn) => {
            incomingStream.on("stream", fn);
        }

        incomingStream.on("stream", (st) => {
            incomingStream.activeStream = st;
        });

        switch (incomingStream.metadata.type) {
            case STREAM_TYPE.AUDIO:

                this._incomingAudioList.push(incomingStream);
                break;
            case STREAM_TYPE.CAMERA:
                this._localMessageEvent(`${incomingStream.metadata.owner} is sharing their camera`, "system", Date.now())
                this._incomingCameraList.push(incomingStream);
                break;
            case STREAM_TYPE.CAPTURE:
                this._localMessageEvent(`${incomingStream.metadata.owner} is sharing their screen`, "system", Date.now())
                this._incomingCaptureList.push(incomingStream);
                break;
            case STREAM_TYPE.WEBGL:
                break;
            case STREAM_TYPE.CUSTOM:
                this._localMessageEvent(`${incomingStream.metadata.owner} is sharing their ${incomingStream.metadata.custom}`, "system", Date.now());
                this._incomingCustomList.push(incomingStream);
                break;
            default:
                console.log("unknown stream type????");
                return;
        }
        incomingStream.answer();

        this._localStreamEvent();
    }

    _localStreamEvent() {
        this._streamEvList.forEach((fn) => {
            fn();
        })
    }

    //-------------------binary data transfer handlers--------------------



    onMessageReceived(fn) {
        this.on("message", fn);
    }

    /**
     * send string to every connecters
     * @param {*} content 
     * @param {number} type 
     */
    sendDataToPeers(content, type) {
        var payload = util.generatePayload(content, type, this.name);
        this._connList.forEach((p) => {
            p.send(payload)
        })
    }

    sendTextMessage(content) {
        this.sendDataToPeers(content, DATA_TYPE.MESSAGE);
    }


    _localMessageEvent(message, role, timestamp, owner = "unknown") {
        console.log("msg:", message, role, timestamp, owner);
        this._messageEvList.forEach((fn) => {
            fn(message, role, timestamp, owner);
        })
    }

    // --------------------- connection handlers --------------------------

    _requestConnect(sessionID) {
        /** @type {Peer.DataConnection} */
        var conn = this.peer.connect(sessionID, { metadata: { name: this.name } });
        //data connection handlers
        this._handleDataConnection(conn);
    }




    // handles individual connector's data input
    _handleDataConnection(conn) {

        conn.on("open", () => {
            if (conn.peer === this._hostSession) {
                //this.generateChatMessage("connected to host", "system", Date.now()); 
                this._localMessageEvent("connected to host", "system", Date.now())
            }
            conn.send(util.generatePayload("hi", DATA_TYPE.DEBUG));

            if (this.isHost) { //if this instance is host, send connection list to the connector
                console.log("sending conn info", this._connList);
                conn.send(util.generatePayload(this.connectedIDs, DATA_TYPE.REQUEST_CONNECT));
            }
            this._connList.push(conn);
            this.connectors++;
            this._connEvList.forEach(e => e());
        })

        conn.on("close", () => {
            if (conn.peer === this._hostSession) {
                //this.generateChatMessage("host session ended", "system", Date.now());
                this._localMessageEvent("host session ended", "system", Date.now());
                this.peer.disconnect();
            } else {
                //this.generateChatMessage(`${conn.metadata.name} has left this session`, "system", Date.now());
                this._localMessageEvent(`${conn.metadata.name} has left this session`, "system", Date.now());
            }
            this._removeConnFromList(conn);
            this._connEvList.forEach(e => e());
        });

        // processes incoming data, distinguished by custom-made types
        // could be more modular
        conn.on("data", (data) => {
            console.log("data", data);
            const findbyMetadata = (Element) => {
                Element.UUID = data.content.metadata.UUID;
            }
            switch (data.type) {
                case (DATA_TYPE.REQUEST_CONNECT):

                    console.log("conn", data.content);
                    if (conn.peer === this._hostSession) {
                        data.content.forEach(id => {
                            if (id !== this.peer.id) {
                                this._requestConnect(id);
                            }
                        });
                    } else {
                        console.log("an non-host peer provided connection list???", data);
                    }
                    break;



                case (DATA_TYPE.MESSAGE):
                    //this.generateChatMessage(data.content, "other", data.timestamp, data.sender);
                    this._localMessageEvent(data.content, "other", data.timestamp, data.sender);
                    break;



                case (DATA_TYPE.DEBUG):
                    console.log(util.timeConverter(data.timestamp), data.content, conn.metadata);
                    break;



                case (DATA_TYPE.PING)://WIP
                    this._connectorMissedPings[conn.peer] = 0;
                    break;


                case (DATA_TYPE.CLOSE_STREAM):
                    this._localStreamEvent();
                    console.log(data);
                    console.log("capture list", this._incomingCaptureList);
                    console.log("camera list", this._incomingCameraList);
                    console.log("audio list", this._incomingAudioList);
                    switch (data.content.metadata.type) {
                        case (STREAM_TYPE.AUDIO):
                            this._incomingAudioList.splice(this._incomingAudioList.findIndex(findbyMetadata), 1);
                            break;
                        case (STREAM_TYPE.CAMERA):
                            this._localMessageEvent(`${data.content.metadata.owner} stopped sharing their camera`, "system", Date.now())
                            this._incomingCameraList.splice(this._incomingCameraList.findIndex(findbyMetadata), 1);
                            break;
                        case (STREAM_TYPE.CAPTURE):
                            this._localMessageEvent(`${data.content.metadata.owner} stopped sharing their capture`, "system", Date.now())
                            this._incomingCaptureList.splice(this._incomingCaptureList.findIndex(findbyMetadata), 1);
                            break;
                        case (STREAM_TYPE.WEBGL): this._localMessageEvent(`${data.content.metadata.owner} stoped their avatar`, "system", Date.now())
                            this._incomingWebGLList.splice(this._incomingWebGLList.findIndex(findbyMetadata), 1);
                            break;
                        case (STREAM_TYPE.CUSTOM): this._localMessageEvent(`${data.content.metadata.owner} stoped their ${this._incomingWebGLList.findIndex(findbyMetadata).metadata.custom}`, "system", Date.now())
                            this._incomingWebGLList.splice(this._incomingWebGLList.findIndex(findbyMetadata), 1);
                            break;
                        default:
                            break;
                    }
                    break;



                default:
                    console.log("NO TYPE", data);
                    break;
            }
        })
        // this._connList.push(conn);

    }

    /**
     * 
     * @param {Peer.DataConnection} conn 
     */
    _connectPinger(conn) {
        var interval = setInterval(() => {
            if (this._connectorMissedPings[conn.peer] > coreMissedPingTolerance) {
                conn.close();
                clearInterval(interval);
            }
            conn.send(util.generatePayload('', DATA_TYPE.PING));
            this._connectorMissedPings[conn.peer]++;

        }, corePingingInterval);


    }

    _removeConnFromList(conn) {
        this._connList.splice(this._connList.indexOf(conn), 1);
    }

    // ---------------------------------streams----------------------------------------

    // stream metadata generator
    generateStreamMeta(stream_type) {
        return { metadata: { type: stream_type, owner: this.name, UUID: this.id } };
    }

    /**
     * stream closing signal sender
     */
    _sendCloseStreamSignal(stream_type) {
        this.sendDataToPeers(this.generateStreamMeta(stream_type), DATA_TYPE.CLOSE_STREAM);
    }



    // ---------------------------------audio calls

    stopAudioCall() {
        this.audioStream.getAudioTracks()[0].stop();
        this._activeAudioCalloutList.forEach((call) => {
            call.close();
        })
        this._sendCloseStreamSignal(STREAM_TYPE.AUDIO)
        this._activeAudioCalloutList = [];
    }

    startAudioCall() {
        this.userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        this.userMedia({
            audio: {
                sampleSize: 8,
                echoCancellation: true
            }
        }, (stream) => {
            this.audioStream = stream;

            this.connectedIDs.forEach((ID) => {
                var calling = this.peer.call(ID, this.audioStream, this.generateStreamMeta(STREAM_TYPE.AUDIO));
                this._activeAudioCalloutList.push(calling);
            })

        }, (err) => {
            console.log("mediastream error:", err);
        })
    }

    //-----------------------webcam calls---------------------

    startCamCall() {
        this.userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        this.userMedia({ video: true }, (stream) => {
            this.cameraStream = stream;

            this.connectedIDs.forEach((ID) => {
                var calling = this.peer.call(ID, this.cameraStream, this.generateStreamMeta(STREAM_TYPE.CAMERA));
                this._activeCameraCalloutList.push(calling);
            })

        }, (err) => {
            console.log("mediastream error:", err);
        })


    }

    stopCamCall() {
        this.cameraStream.getVideoTracks()[0].stop();
        this._activeCameraCalloutList.forEach((call) => {
            call.close();
        })
        this._sendCloseStreamSignal(STREAM_TYPE.CAMERA)
        this._activeCameraCalloutList = [];
    }

    //-------------- captures --------------------

    startCaptureCall() {
        var capture = navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
        capture.then((s) => {
            this.captureStream = s;

            this.connectedIDs.forEach((ID) => {
                var calling = this.peer.call(ID, this.captureStream, this.generateStreamMeta(STREAM_TYPE.CAPTURE));
                this._activeCaptureCalloutList.push(calling);
            })

        });
    }

    stopCaptureCall() {
        this.captureStream.getVideoTracks()[0].stop();
        this._activeCaptureCalloutList.forEach((call) => {
            call.close();
        })
        this._sendCloseStreamSignal(STREAM_TYPE.CAPTURE);
        this._activeCaptureCalloutList = [];
    }


    //TODO webGL capture
    //------------ Custom --------------
    startCustomCall(stream){
        
    }
    //preparing streaming data


}

//enums
const DATA_TYPE = {
    MESSAGE: 0,
    REQUEST_CONNECT: 1,
    FACE: 2,
    DEBUG: 4,
    PING: 5,
    CURSOR: 6,
    CLOSE_STREAM: 7
}

const STREAM_TYPE = {
    AUDIO: 0,
    CAMERA: 1,
    CAPTURE: 2,
    WEBGL: 3,
    CUSTOM: 4
}

export default PeerCore;