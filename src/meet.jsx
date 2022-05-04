import React from "react";
import PeerCore from "./peerCore";
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import Chat from "./meetComponents/chat";

class Meet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    render(){
        return (
            <div className="container-fluid vh-100">
                <div className="row">
                    <div className="col-9 border-end vh-100">Left</div>
                    <div className="col-3 p-0"><Chat/></div>
                    
                </div>
            </div>
        )
    }
}

export default Meet;