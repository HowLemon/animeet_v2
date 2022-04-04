import React from "react";

import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./practice.css";

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square key={Math.random()} value={i} />
        );
    }



    render() {
        const status = "Next Player: X";
        const size = 3
        return (
            <div>
                <div className="status">{status}</div>
                <div className="board-container">
                    <div className="board">
                        {[...Array(size * size)].map((x, i) => this.renderSquare(i + 1))}
                    </div>
                </div>
            </div>
        )
    }
}

class Square extends React.Component {

    buttonClicked(){
        console.log("hi");
    }

    render() {
        return (
            <button className="square btn border" onClick={this.buttonClicked}>
                {this.props.value}
            </button>
        )
    }
}

export default Board;