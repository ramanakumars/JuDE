import React from "react";
import "../css/loading.css";

class Loading extends React.Component {
    constructor(props) {
        super(props);

        this.state = { enabled: false };
    }

    render() {
        if (this.state.enabled === false) {
            return <div className="not-loading">&nbsp;</div>;
        } else {
            return (
                <div className="not-loading">
                    <div className="loading-spin">&nbsp;</div>
                </div>
            );
        }
    }
}

export default Loading;
