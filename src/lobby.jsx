import React from "react";

import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './lobby.css';
import PeerCore from "./peerCore";

class Lobby extends React.Component {
    constructor(prop) {
        super(prop);
        this.state = {
            hostSession: null
        }
    }

    handleHostInput = (e) => {
        this.setState({
            hostSession: e.target.value
        })
    }

    createPeer = () => {
        this.props.setPeer(new PeerCore(this.props.account.name, this.state.hostSession));
    }

    createPeerAsHost = () => {
        this.props.setPeer(new PeerCore(this.props.account.name))
    }

    render() {
        return (
            <div>
                <div className="container-sm position-absolute top-50 start-50 translate-middle p-5 border rounded-3">
                    <h2>Hello, {this.props.account.name}</h2>
                    <div className="mt-3">
                        <div className="m-1">
                            <button onClick={this.createPeerAsHost} className="btn btn-secondary">Host Room</button><br />
                        </div>
                        <div className="row justify-content-center">
                            <div className="input-group m-3 col-3 short">
                                <input type="text" onChange={this.handleHostInput} className="form-control" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" aria-label="Recipient's username" aria-describedby="button-addon2" />
                                <button onClick={this.createPeer} className="btn btn-secondary" type="button" id="button-addon2">Join Room</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}

export default Lobby;