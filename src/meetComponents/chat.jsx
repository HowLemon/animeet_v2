import React from "react";
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './chat.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    render() {
        return (
            <div className="container-fluid vh-100 position-relative">
                <div className="row chat-container">
                    <div className="container">
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat"/>
                        <ChatItem message="waatatat wadwdawdwa dwa wad awd awd awd awdaw dawd awd awd wad awd aw"/>
                    </div>

                </div>
                <div className="row mt-3 chat-input-container">
                    <div className="form-floating input-group col-12">
                        <textarea className="form-control chat-input p-1" placeholder="Leave a comment here" id="floatingTextarea"></textarea>
                        <button type="button" className="btn btn-primary"><FontAwesomeIcon icon={faPaperPlane} /></button>
                    </div>
                </div>
            </div>
        )
    }
}

class ChatItem extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="border mt-3 p-2 mw-75 min-w-25 chat-item">{this.props.message}</div>
        )
    }
}

export default Chat;