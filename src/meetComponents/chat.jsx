import React from "react";
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './chat.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { timeConverter } from "../utils";

class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessage: ''
        }
        this.handleInput = this.handleInput.bind(this);
        this.submit = this.submit.bind(this);
        this.chatContainerRef = React.createRef();
    }

    handleInput(e){
        // console.log("WHAT",e.target.value);
        this.setState({inputMessage:e.target.value});
    }
    
    submit(){
        if(this.state.inputMessage.trim() === '' || !this.state.inputMessage)return;
        this.props.sendMessage(this.state.inputMessage.trim());
        this.setState({inputMessage:''});
    }

    componentDidUpdate(prevProps) {
        if(prevProps.messages !== this.props.messages) this.chatContainerRef.current.scrollTop = this.chatContainerRef.current.scrollHeight;
    }
    

    render() {
        return (
            <div className="container-fluid vh-100 position-relative">
                <div className="row chat-container" ref={this.chatContainerRef}>
                    <div className="container">
                        {this.props.messages.map((obj,i)=>(<ChatItem key={`${i}-${obj.timestamp}`} message={obj.message} owner={obj.owner} time={obj.timestamp} type={obj.role} />))}
                    </div>

                </div>
                <div className="row mt-3 chat-input-container">
                    <div className="form-floating input-group col-12">
                        <textarea value={this.state.inputMessage} onKeyDown={(e)=>{if(e.key==="Enter" && !e.shiftKey){e.preventDefault();this.submit();}}} onChange={this.handleInput} className="form-control chat-input p-1 shadow-none" placeholder="Leave a comment here" id="floatingTextarea"></textarea>
                        <button onClick={this.submit} type="button" className="btn btn-primary shadow-none"><FontAwesomeIcon icon={faPaperPlane} /></button>
                    </div>
                </div>
            </div>
        )
    }
}

class ChatItem extends React.Component {
    constructor(props) {
        super(props);
        this.message = this.props.message || "NO MESSAGE?????";
        this.owner = this.props.owner || "NO OWNER???";
        this.time = this.props.time || "NO TIME???";
        this.type = this.props.type || "other";
    }
    render() {
        return (
            <div className="chat-item-container pt-3 ">
                <div type={this.type} className="border p-2 ps-3 pe-3 mw-75 min-w-25 chat-item">
                    {this.props.message}
                    <div className="chat-attribute">
                    <label>{this.owner}</label>
                    <label>{timeConverter(this.time)}</label>
                </div>  
                </div>
            </div>
        )
    }
}

export default Chat;