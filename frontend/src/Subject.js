import React from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import Loading from './Loading.js'
import MainNav from './Nav.js';

class Subject extends React.Component {
	constructor(props) {
		super(props);

		this.state = {subject_id: props.subject_id};

		this.subject_viewer = React.createRef();
		this.context_viewer = React.createRef();
		this.globe_viewer = React.createRef();

	}


	render() {
		return (
			<article id='main'>
				<MainNav />
				<section id='app'>
					<section id='subject-info'>
						<SubjectViewer  subject_id={this.state.subject_id} ref={this.subject_viewer}/>
						<SubjectMosaicContextViewer subject_id={this.state.subject_id} type='global' ref={this.globe_viewer} />
					</section>
					<section id="plotter">
						<SubjectContextViewer subject_id={this.state.subject_id} type='context' ref={this.context_viewer} />
					</section>
				</section>
			</article>
		)
	}
}

class SubjectViewer extends React.Component {
    constructor(props) {
        super(props);
		this.state = {subject_id: props.subject_id, 
			url: props.url, latitude: props.latitude, longitude: props.longitude, PJ: props.PJ};

		this.loadingdiv = React.createRef();
    }

	async componentDidMount() {
		// get the sset id and the type of plot selected by the user
		const post_url = '/backend/get-subject-info/' + this.state.subject_id;

		var url, latitude, longitude, PJ;

		this.loadingdiv.current.setState({enabled: true});
		// send the data to Flask
		await axios.request(post_url, {
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin': '*',
			  'Access-Control-Allow-Methods': '*',
			  'Access-Control-Allow-Headers': '*'
			},
		}).then( result => result.data).then(  data => {
			 url = data.subject_url;
			 latitude = data.latitude;
			 longitude = data.longitude;
			 PJ = data.PJ;
		});

		this.setState({'url': url, 'PJ': PJ, 'latitude': latitude, 'longitude': longitude});
		this.loadingdiv.current.setState({enabled: false});

	}

    render() {
		if(this.state.url != null) {
			return (
				<section className='subject-image'>
					<Loading ref={this.loadingdiv} />
					<h2>Subject {this.state.subject_id } </h2>
					<img src={this.state.url} alt={this.state.subject_id} />
					<section id='subject-metadata'>
						<p>
							<span><b>Latitude</b></span>
							<span>{this.state.latitude.toFixed(2)}&deg;</span>
						</p>
						<p>
							<span><b>Longitude</b></span>
							<span>{this.state.longitude.toFixed(2)}&deg;</span>
						</p>
						<p>
							<span><b>Perijove</b></span>
							<span>{this.state.PJ}</span>
						</p>
					</section>
				</section>
			)
		} else {
			return (
				<section className='subject-image'>
					<Loading ref={this.loadingdiv} />
				</section>
			)
		}
    }
}

class SubjectContextViewer extends React.Component {
    constructor(props) {
        super(props);
		this.state = {subject_id: props.subject_id, type: props.type, url: props.url, 
			plotly_data: props.plotly_data};

		this.loadingdiv = React.createRef();
    }
	
	async componentDidMount() {

		if(this.loadingdiv.current != null) {
			this.loadingdiv.current.setState({enabled: true});
		}
		var post_url;
		if (this.state.type==='context') {
			post_url = '/backend/get-context-image/' + this.state.subject_id;
		} else {
			post_url = '/backend/get-global-image/' + this.state.subject_id;
		}

		// send the data to Flask
		await axios.request(post_url, {
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin': '*',
			  'Access-Control-Allow-Methods': '*',
			  'Access-Control-Allow-Headers': '*'
			},
		}).then( result => result.data).then(  data => {
			 //url = ;
			this.setState({plotly_data: data});
		});

		if(this.loadingdiv.current!=null) {
			this.loadingdiv.current.setState({enabled: false});
		}

	}

    render() {
		if(this.state.plotly_data != null) {
			return (
				<section className='subject-image'>
					<Plot data={this.state.plotly_data.data} 
						layout={this.state.plotly_data.layout}
						useResizeHandler
						style={{width: '100%', height: '100%', minHeight: '800px'}} />
				</section>
			)
		} else {
			return (
				<section className='subject-image'>
					<Loading ref={this.loadingdiv} />
				</section>
			)
		}
    }
}

class SubjectMosaicContextViewer extends SubjectContextViewer {
    render() {
		if(this.state.plotly_data != null) {
			return (
				<section className='subject-image'>
					<Plot data={this.state.plotly_data.data} 
						layout={this.state.plotly_data.layout}
						style={{'width': '100%'}} config={{'staticPlot': true}} />
				</section>
			)
		} else {
			return (
				<section className='subject-image'>
				</section>
			)
		}
    }
}

export default Subject;
