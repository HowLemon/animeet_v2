import React from "react";

import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

//TODO implement Google Login IDK

class Login extends React.Component {
    constructor(prop) {
        super(prop);
        this.state = {
            inputValue: null
        }

        this.handleInput = this.handleInput.bind(this);
        this.checkUserName = this.checkUserName.bind(this);
    }

    handleInput(e) {
        // console.log(e)
        this.setState({
            inputValue: e.target.value
        })
    }

    checkUserName(e) {
        if (!this.state.inputValue || this.state.inputValue.trim() === "") {
            alert("please enter a name");
            return;
        }
        this.props.setAccount({
            name: this.state.inputValue
        })
    }

    render() {
        return (
            <div className="container-sm position-absolute top-50 start-50 translate-middle p-5 border rounded-3">
                <div >
                    <h1>Animeet V2</h1>
                    <label>Enter Your Username: </label><input className="ms-1" onChange={this.handleInput}></input><br></br>
                    <button onClick={this.checkUserName} className="btn btn-primary m-3">Login</button>
                </div>
            </div>


        )
    }
}

export default Login;