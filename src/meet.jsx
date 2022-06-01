import React from "react";
// import PeerCore from "./peerCore";
// import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import Chat from "./meetComponents/chat";
import MediaFrame from './meetComponents/mediaFrame';
import FrameControl from "./meetComponents/frameControl";


class Meet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentSession: "unknown",
            connectedNames: [],
            messages: []
        }
        this.sendMessage = this.sendMessage.bind(this);
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

    render() {
        return (
            <div className="container-fluid vh-100">
                <div className="row">
                    <div className="col-12 p-0 border-end vh-100">
                        <MediaFrame account={this.props.account} peer={this.peer}/>
                    </div>
                    <Chat messages={this.state.messages} sendMessage={this.sendMessage} />
                    <FrameControl account={this.props.account} session={this.state.currentSession} friends={this.state.connectedNames}/>
                </div>
            </div>
        )
    }
}

export default Meet;