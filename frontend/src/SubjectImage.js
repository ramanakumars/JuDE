import React from 'react'; 

class SubjectImage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {url: props.url, lon: props.lon, lat: props.lat, ID: props.ID, PJ: props.PJ, style: props.style };
		
	}

	render() {
		return (
			<span key={this.state.ID+"_span"} style={this.state.style}>
				<a href={"/subject/"+this.state.ID} target="_blank"  rel="noreferrer">
					<img key={this.state.ID+"_img"} src={this.state.url} 
						title={"lon: " + this.state.lon + " lat: " + this.state.lat}	
						alt={"lon: " + this.state.lon + " lat: " + this.state.lat} className='subject-image' />
				</a>
			</span>
		)
	}
}

export default SubjectImage;
