import React from "react";
import "../css/loading.css";

class LoadingPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = { enabled: props.enable, text: "Loading..." };

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    enable() {
        this.setState({ enabled: true });
    }

    disable() {
        this.setState({ enabled: false });
    }

    render() {
        if (this.state.enabled === false) {
            return <div className="not-loading">&nbsp;</div>;
        } else {
            return (
                <div className="loading-page-container">
                    <div className="loading-frame">
                        <div className="loading-spin">&nbsp;</div>
                        <span>{this.state.text}</span>
                    </div>
                </div>
            );
        }
    }
}

export default LoadingPage;
