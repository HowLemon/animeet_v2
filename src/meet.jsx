import React from "react";
// import PeerCore from "./peerCore";
// import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import Chat from "./meetComponents/chat";
import MediaFrame from './meetComponents/mediaFrame';
import FrameControl from "./meetComponents/frameControl";
import Peer from "peerjs";


class Meet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentSession: "unknown",
            connectedNames: [],
            messages: [],
            streams: [] //local MediaStreams
        }

        this.sendMessage = this.sendMessage.bind(this);
        // this.addStream = this.addStream.bind(this);
        this.registerStream = this.registerStream.bind(this);
        this.stopStream = this.stopStream.bind(this);

        /** @type {PeerCore} */
        this.peer = this.props.peer;
    }

    componentDidMount() {
        this.peer.init();
        this.peer.onMessageReceived((message, role, timestamp, owner) => {
            let obj = { message: message, role: role, timestamp: timestamp|| Date.now(), owner: owner }
            // alert(JSON.stringify(obj));
            let messageSnapshot = this.state.messages.slice();
            messageSnapshot.push(obj);

            this.setState({ messages: messageSnapshot })
        })
        this.peer.on("open",()=>{
            window.history.pushState({}, null,`?sid=${this.peer.currentSession}`)
            this.setState({currentSession:this.peer.currentSession})
            this.setState({connectedNames: this.peer.connectedNames})
        })
        this.peer.on("connection", ()=>{
            this.setState({connectedNames: this.peer.connectedNames})
        })

        window.onbeforeunload = ()=>{
            this.peer.destroy();
        }

    }

    sendMessage(message) {
        this.peer.sendTextMessage(message);
        // kinda dislike how I treated messages
        const messageSnapshot = this.state.messages.slice();
        const obj = {message: message, role: "self", timestamp: Date.now(), owner:this.props.account.name}
        messageSnapshot.push(obj);
        this.setState({ messages: messageSnapshot })
    }

    registerStream = (stream, type) => {
        console.log("register stream", stream);
        this.peer.startCustomCall(stream, type);
        const streamSnapshot = this.state.streams.slice();
        //wrapping the stream as mediaconnection
        streamSnapshot.push({stream:stream, type:type, isHost:this.peer.isHost})
        this.setState({streams:streamSnapshot})
    }
    stopStream = (stream) => {
        console.log("stop stream", stream);
        this.peer.stopCustomCall(stream);
        const streamSnapshot = this.state.streams.filter(e=>e.stream !== stream);
        this.setState({streams:streamSnapshot});
    }

    render() {
        return (
            <div className="container-fluid vh-100">
                <div className="row">
                    <div className="col-12 p-0 border-end vh-100">
                        <MediaFrame account={this.props.account} localStreams={this.state.streams} peer={this.peer}/>
                    </div>
                    <Chat messages={this.state.messages} sendMessage={this.sendMessage} />
                    <FrameControl isHost={this.peer.isHost} registerStream={this.registerStream} stopStream={this.stopStream} account={this.props.account} session={this.state.currentSession} friends={this.state.connectedNames}/>
                </div>
            </div>
        )
    }
}

export default Meet;