// import logo from './logo.svg';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';

import Login from './login.jsx';
import AlertController from './alertController.jsx'
import Lobby from './lobby';
import Meet from './meet';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            session: null
        }
        this.peer = null;

        this.checkLogin = this.checkLogin.bind(this);
        this.setAccount = this.setAccount.bind(this);
        this.setPeer = this.setPeer.bind(this);
    }

    componentDidMount(){
        const urlParams = new URL(window.location.href);
        console.log(urlParams.searchParams.get("sid"))
    }

    setAccount = (data) => {
        this.setState({
            account: data
        })
    }

    setPeer = (peer) => {
        this.peer = peer;
        this.setState({session: true});
    }

    checkLogin = () => {
        if (this.state.account === null) {
            return (
                <Login setAccount={this.setAccount} />
            )
        } else if (this.peer === null) {
            return (
                <Lobby setPeer={this.setPeer} account={this.state.account}/>
            )
        } else {
            return (
                <Meet /** @type {PeerCore} */peer={this.peer} account={this.state.account}/>
            )
        }
    }

    render() {
        return (
            <div className="App">
                {this.checkLogin()}
                <AlertController />
            </div>
        );
    }
}

export default App;
