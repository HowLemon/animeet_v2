import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignal } from "@fortawesome/free-solid-svg-icons";
import 'bootstrap/dist/css/bootstrap.min.css';
import './frameControl.css'
import * as bootstrap from 'bootstrap';

class FrameControl extends React.Component {
    render() {
        return (
            <div>
                <div type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasScrolling" aria-controls="offcanvasScrolling" className="btn btn-light framecontrol position-absolute top-0 start-0 m-3 border rounded-3">
                    <FontAwesomeIcon icon={faBars} />
                </div>
                <div className="offcanvas offcanvas-start" data-bs-scroll="true" data-bs-backdrop="false" tabIndex="-1" id="offcanvasScrolling" aria-labelledby="offcanvasScrollingLabel">
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasScrollingLabel">Settings</h5>
                        <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body settings-body">
                        <p id="name">Name: {this.props.account.name}</p>
                        <p id="session">Current Session: {this.props.session}</p>
                        <p id="connectors">Connected Users:
                            <ul className="list-group list-group-flush mt-3 ps-3 pe-3">
                                {this.props.friends.map((x,index)=>(
                                    <li key={index} className="list-group-item"><FontAwesomeIcon icon={faSignal} />  {x.name}</li>
                                ))}
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}

export default FrameControl;