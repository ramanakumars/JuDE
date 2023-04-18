import React from "react";

export default class MetadataUpload extends React.Component {

	handleSubmit = (e) => {
		e.preventDefault();

		this.props.onSubmit(e);
	}

	render() {
		return (
			<section id='metadata-upload'>
				<form onSubmit={this.handleSubmit} method="POST" encType="multipart/form-data" className="upload">
					<span>
						<label htmlFor="file">Upload additional metdata</label>
						<input type="file" id="umap" name='umap' accept='text/csv' />
					</span>
					<input type="submit" value="Submit" />
				</form>
			</section>
		)
	}

}
