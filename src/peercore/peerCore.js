import Peer from "peerjs";
import * as util from "./utils";

class PeerCore {
    constructor(name, hostSession = null){
        this._ready = false;
        this._name = name;
        this._hostSession = hostSession;
        /** @type {Peer} */
        this.peer = null;
        this.started = false;
        this.connectors = [];
        /**
         * @type {[MediaStream]}
         * A list of currently active local sterams
         */
        this._activeStreamList = [];
        this._activeCalloutList = [];

        //event subscribers 
        this._evLists = [];
    }
    //--------GETTERS---------
    get ready() {return this._ready};
    get name() {return this._name};
    get node() {return this.peer.id};
    // if hostSession is empty then it means it must be host??
    get isHost() { return (this._hostSession === '' || !this._hostSession) }
    init() {
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

        //create an connection node
        this.peer.on('open', (id)=>{
            this._localMessageEvent(`Peer ID: ${id}`, "system", Date.now())
            this._localMessageEvent(`is host: ${this.isHost}`, "system", Date.now())
            this._trigger('open')
            if(!this.isHost){
                this._localMessageEvent(`Attempting to connect to Host`, "system", Date.now())
            }

        })
    }
    //------------ Event Handlers ---------------
    /**
     * event subscriber
     * @param {string} event 
     * @param {function} fn 
     */
    on(event, fn){
        this._evLists({ev:"event", fn:fn});
    }
    /**
     * event trigger
     * @param {string} event 
     * @param {any} params 
     */
    _trigger(event, params = []){
        this._evLists.forEach(e=>{
            if(e.ev === event){
                e.fn(...params);
            }
        })
    }
    _localMessageEvent(message, role, timestamp, owner = "unknown"){
        console.log("msg:", message, role, timestamp, owner);
        this._trigger("message",[message, role, timestamp, owner])
    }

    //----------- Connection Handlers --------------
    /**
     * (internal)
     * connect to the peers
     * @param {string} sessionID the session ID
     */
     _requestConnect(sessionID) {
        /** @type {Peer.DataConnection} */
        var conn = this.peer.connect(sessionID, { metadata: { name: this.name, host: this._hostSession } });
        //data connection handlers
        this._handleDataConnection(conn);
    }

    _handleDataConnection(conn){
        const onPeerOpen = ()=>{
            if (conn.peer === this._hostSession) {
                //this.generateChatMessage("connected to host", "system", Date.now()); 
                this._localMessageEvent("connected to host", "system", Date.now())
            }
            conn.send(util.generatePayload("hi", DATA_TYPE.DEBUG))
        }
    }
}
//enums
const DATA_TYPE = {
    MESSAGE: 0,
    REQUEST_CONNECT: 1,
    FACE: 2,
    DEBUG: 4,
    PING: 5,
    CURSOR: 6,
    CLOSE_STREAM: 7,
    REQUEST_STREAMS: 8
}

const STREAM_TYPE = {
    AUDIO: 0,
    CAMERA: 1,
    CAPTURE: 2,
    WEBGL: 3,
    CUSTOM: 4
}

export default PeerCore;