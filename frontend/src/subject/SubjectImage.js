import React from "react";

class SubjectImage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            url: props.url,
			metadata: props.metadata,
			ID: props.metadata.subject_ID,
            style: props.style,
        };
    }

    render() {
        return (
            <span key={this.state.ID + "_span"} style={this.state.style}>
                <a href={"/subject/" + this.state.ID} target="_blank" rel="noreferrer">
                    <img
                        key={this.state.ID + "_img"}
                        src={this.state.url}
                        title={"lon: " + this.state.metadata.longitude + " lat: " + this.state.metadata.latitude}
                        alt={"lon: " + this.state.metadata.longitude + " lat: " + this.state.metadata.latitude}
                        className="subject-image"
                    />
                </a>
            </span>
        );
    }
}

export default SubjectImage;
