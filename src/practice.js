import React from "react";

import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./practice.css";

class Board extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            squares: Array(9).fill(null),
            xTurn: true
        }
    }

    renderSquare(i) {
        return (
            <Square key={`sq${i}`} value={this.state.squares[i]} onClick={()=>this.clickSquare(i)}/>
        );
    }

    clickSquare(i) {
        // console.log(i)
        const squares = this.state.squares.slice();
        if(squares[i]) return;
        squares[i] = this.state.xTurn ? 'X' : 'O';
        this.setState({
            squares: squares,
            xTurn: !this.state.xTurn
        })
        let result = this.caculateWinner(squares);
        if(result){
            alert(result + " wins!")
        }
    }

    caculateWinner(squares){
        const lines = [
            [0,1,2],
            [3,4,5],
            [6,7,8],
            [0,3,6],
            [1,4,7],
            [2,5,8],
            [0,4,8],
            [2,4,6]
        ];
        let result = null;
        lines.forEach(([a,b,c]) => {
            if(squares[a] && squares[a] === squares[b] && squares[b] === squares[c] && squares[a] === squares[c]){
                result = squares[a];
            }
        });
        return result;
    }



    render() {
        
        
        return (
            <div>
                <div className="status">{"Player: " + (this.state.xTurn ? 'X' : 'O')}</div>
                <div className="board-container">
                    <div className="board">
                        {/* {[...Array(9)].map((x, i) => this.renderSquare(this.state.squares[i]))} */}
                        {this.renderSquare(0)}
                        {this.renderSquare(1)}
                        {this.renderSquare(2)}
                        {this.renderSquare(3)}
                        {this.renderSquare(4)}
                        {this.renderSquare(5)}
                        {this.renderSquare(6)}
                        {this.renderSquare(7)}
                        {this.renderSquare(8)}
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
            <button className="square btn border" onClick={()=>this.props.onClick()}>
                {this.props.value}
            </button>
        )
    }
}

export default Board;