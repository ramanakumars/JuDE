import React from 'react';

class Loading extends React.Component {
	constructor(props) {
		super(props);

		this.state = {enabled: false};
	}

	render() {
		if (this.state.enabled===false) {
			return (
				<div className="notloading">
					&nbsp;
				</div>
			)
		} else {
			return (
				<div className="notloading">
					<div className="loadingspin">
						&nbsp;
					</div>
				</div>
			)
		}

	}
}

export default Loading;
