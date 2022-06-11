import React from 'react';
import Plot from 'react-plotly.js';
import MainNav from './Nav.js';
import SubjectImage from './SubjectImage.js';

const var_names = {
    hist: ['x'],
    scatter: ['x','y'],
}

const variables = {Latitude: 'latitude', Longitude: 'longitude', Perijove: 'perijove'};


class Explorer extends React.Component {
	constructor(props) {
		super(props);

		this.choose_plot_form = React.createRef();
		this.create_plot_form = React.createRef();
		this.subject_plotter  = React.createRef();

		this.handleSubmit = this.handleSubmit.bind(this);

	}

	handleSubmit(event) {


		event.preventDefault();

        var data = {plot_type: this.choose_plot_form.current.state.chosen};

		const chosen_vars = var_names[data.plot_type];
        for(var i=0; i<chosen_vars.length; i++) {
            if(event.target.elements[chosen_vars[i]].value==='') {
                return;
            }
            data[chosen_vars[i]] = event.target.elements[chosen_vars[i]].value;
        }

		fetch('/backend/plot-exploration/', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then( result => result.json()).then( plotly_meta => {
            if(!plotly_meta.error) {
                var layout = plotly_meta.layout;
                layout['hovermode'] = 'closest';
                layout['width'] = 800;
                layout['height'] = 600;


				this.subject_plotter.current.set_data(plotly_meta, layout, data.plot_type);

            } else {
                
            }
        })

	}

	render() {
		return (
			<article id='main'>
				<MainNav />
				<section id='app'>
					<section id='plot-info'>
						<ChoosePlotType ref={this.choose_plot_form} onSubmit={this.handleSubmit}/>
					</section>
					<PlotContainer ref={this.subject_plotter} />
				</section>
			</article>
		)
	}
}


class PlotContainer extends React.Component {
	constructor(props) {
		super(props);

		this.subject_images  = React.createRef();
		this.subject_plotter = React.createRef();
		this.hover_images    = React.createRef();

		this.handleHover  = this.handleHover.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	set_data(plotly_meta, layout, plot_type) {

		this.subject_images.current.setState({subject_urls: plotly_meta.subject_urls, 
			subject_lats: plotly_meta.lats, subject_lons: plotly_meta.lons, 
			subject_IDs: plotly_meta.IDs, subject_PJs: plotly_meta.PJs
		});
		this.hover_images.current.setState({subject_urls: [plotly_meta.subject_urls[0]], 
			subject_lats: [plotly_meta.lats[0]], subject_lons: [plotly_meta.lons[0]], 
			subject_IDs: [plotly_meta.IDs[0]], subject_PJs: [plotly_meta.PJs[0]]
		});

		this.subject_plotter.current.setState({data: [plotly_meta.data], layout: layout, 
			subject_lats: plotly_meta.lats, subject_lons: plotly_meta.lons, 
			subject_IDs: plotly_meta.IDs, subject_PJs: plotly_meta.PJs,
			subject_urls: plotly_meta.subject_urls, plot_name: plot_type});
		
	}

	handleHover(data) {
		this.hover_images.current.setState({subject_urls: data.urls, subject_lons: data.lons,
			subject_lats: data.lats, subject_IDs: data.IDs, subject_PJs: data.PJs,
			page: 0});
	}
	
	handleSelect(data) {
		this.subject_images.current.setState({subject_urls: data.urls, subject_lons: data.lons,
			subject_lats: data.lats, subject_IDs: data.IDs, subject_PJs: data.PJs,
			page: 0});
	}

	render() {
		return (

			<section id='plotter'>
		
				<section id='plot-container'>
					<SubjectPlotter ref={this.subject_plotter} 
						variables={[]}
						data={null}
						layout={null}
						subject_urls={[]}
						handleHover={this.handleHover}
						handleSelect={this.handleSelect}
					/>
					<div id='hover-image'>
						<SubjectImages variables={[]} 
							render_type={'hover'} 
							subject_urls={null} subject_lats={null} subject_lons={null}
							subject_IDs={null} subject_PJs={null}
							ref={this.hover_images} /> 
					</div>
				</section>
				<section id='images-container'>
        			<SubjectImages 
						variables={[]} render_type={'selection'} 
						subject_urls={null} subject_lats={null} subject_lons={null}
						subject_IDs={null} subject_PJs={null}
						ref={this.subject_images} />
				</section>

			</section>
		)
	}
}

class ChoosePlotType extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
			variables: variables,  chosen: 'hist'
        };

		this.variable_form = React.createRef();

        this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        var plot_type = event.target.id;
		this.setState({chosen: plot_type});
    }

	handleSubmit(event) {
		this.props.onSubmit(event);
	}

    render() {

        return (
			<section id="choose-plot-container">
				<section id='plot-header'>
					<h1>Choose the plot type</h1>
					<nav id='plot-type'>
						<span>
							<input type="radio" name="plot-type" className="plot-type" id="hist" onChange={this.handleChange} defaultChecked />
							<label htmlFor="hist" className="radio plot-type">Histogram</label>
						</span>
						<span>
							<input type="radio" name="plot-type" className="plot-type" id="scatter" onChange={this.handleChange} />
							<label htmlFor="scatter" className="radio plot-type">Scatter plot</label>
						</span>
					</nav>
				</section> 
				<section id='variable-picker'>
					<CreatePlotForm variables={this.state.variables} key={this.state.chosen} 
						plot_name={this.state.chosen} var_names={var_names[this.state.chosen]} 
						ref={this.variable_form} onSubmit={this.handleSubmit} />
				</section>
			</section>
        )
    }

}

class CreatePlotForm extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {
            variables: props.variables, 
            n_vars: props.var_names.length, 
            var_names: props.var_names,
            plot_name: props.plot_name
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
		
		this.props.onSubmit(event);
    }
    render() {
        var var_selects = [];
        var variables   = [];

        for( var i=0; i<this.state.n_vars; i++) {
            var_selects.push({name: this.state.var_names[i]});
        }

        for( var key in this.state.variables) {
			variables.push({name: key, variable: this.state.variables[key]});
        }

        return (
            <div id="hist-variable" className="variable-picker-container" key={"var_container"}>
                <form id="hist-variables" className="plot-variable" onSubmit={this.handleSubmit} key={"var_form"}>
                    {var_selects.map(vx => (
                        <span key={vx.name+"_span"}>
                            <label htmlFor={vx.name} key={vx.name+"_label"}>{vx.name}: </label>
                            <select name={vx.name} id={vx.name} defaultValue='' className="variable-select" key={vx.name+"_select"}>
                                <option value="" disabled key={vx.name+"_default"}>Choose a variable</option>
                                {variables.map(vi => (
                                    <option value={vi.variable} key={vx.name+vi.name+"_label"}>{vi.name}</option>
                                ))
                                }
                            </select>
                        </span>
                        ))
                    }
                    <input type="submit" value="Plot!" key={this.state.subject_set_id+"_var_submit"}/>
                </form>
            </div>
        )
    }
}


class SubjectPlotter extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {
            data: props.data,
            layout: props.layout,
            n_vars: props.variables.length, 
            subject_urls: props.subject_urls,
			subject_lats: props.subject_lats,
			subject_lons: props.subject_lons,
			subject_IDs: props.subject_IDs,
			subject_PJs: props.subject_PJs,
            plot_name: props.plot_name
        };


        this.handleHover    = this.handleHover.bind(this);
        this.handleSelect   = this.handleSelect.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
    }

    handleHover(event_data) {
		/*
        var urls = [];
        if(this.state.plot_name==='hist') {
            for(var i=0; i < data.points[0].pointNumbers.length; i++){
                urls.push(this.state.subject_urls[data.points[0].pointNumbers[i]]);
            };
        } else if(this.state.plot_name==='scatter') {
            for(i=0; i < data.points.length; i++){
                urls.push(this.state.subject_urls[data.points[i].pointNumber]);
            };
        }

		this.props.handleHover(urls);
		*/
		var data = { urls: [], lons: [], lats: [], IDs: [], PJs: [] };
        if(this.state.plot_name==='hist') {
            for(var i=0; i < event_data.points[0].pointNumbers.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[0].pointNumbers[i]]);
                data.lons.push(this.state.subject_lons[event_data.points[0].pointNumbers[i]]);
                data.lats.push(this.state.subject_lats[event_data.points[0].pointNumbers[i]]);
                data.IDs.push(this.state.subject_IDs[event_data.points[0].pointNumbers[i]]);
                data.PJs.push(this.state.subject_PJs[event_data.points[0].pointNumbers[i]]);
            };
        } else if(this.state.plot_name==='scatter') {
            for(i=0; i < event_data.points.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[i].pointNumber]);
                data.lons.push(this.state.subject_lons[event_data.points[i].pointNumber]);
                data.lats.push(this.state.subject_lats[event_data.points[i].pointNumber]);
                data.IDs.push(this.state.subject_IDs[event_data.points[i].pointNumber]);
                data.PJs.push(this.state.subject_PJs[event_data.points[i].pointNumber]);
            };
        }
		
		this.props.handleHover(data);

		//this.hoverimage.setState({subject_urls: urls, page: 0});
    }
    
	handleSelect(event_data) {
		if (event_data===undefined) {
			return;
		}

		var data = { urls: [], lons: [], lats: [], IDs: [], PJs: [] };
        if(this.state.plot_name==='hist') {
            for(var i=0; i < event_data.points[0].pointNumbers.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[0].pointNumbers[i]]);
                data.lons.push(this.state.subject_lons[event_data.points[0].pointNumbers[i]]);
                data.lats.push(this.state.subject_lats[event_data.points[0].pointNumbers[i]]);
                data.IDs.push(this.state.subject_IDs[event_data.points[0].pointNumbers[i]]);
                data.PJs.push(this.state.subject_PJs[event_data.points[0].pointNumbers[i]]);
            };
        } else if(this.state.plot_name==='scatter') {
            for(i=0; i < event_data.points.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[i].pointNumber]);
                data.lons.push(this.state.subject_lons[event_data.points[i].pointNumber]);
                data.lats.push(this.state.subject_lats[event_data.points[i].pointNumber]);
                data.IDs.push(this.state.subject_IDs[event_data.points[i].pointNumber]);
                data.PJs.push(this.state.subject_PJs[event_data.points[i].pointNumber]);
            };
        }
		
		this.props.handleSelect(data);

		//this.images.setState({subject_urls: urls, page: 0});
    }

	resetSelection() {
		this.images.setState({subject_urls: this.state.subject_urls, page: 0});
	}

    render() {
			if (this.state.data != null) {
				return (
					<div id='plot'>
						<Plot data={this.state.data} layout={this.state.layout}
							onHover={this.handleHover} onSelected={this.handleSelect} onDeselect={this.resetSelection} />
					</div>
				)
			} else {
				return (
					<div id='plot'>
					</div>
				)
			}

    }
}

class SubjectImages extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
		var nmax = 24;
        if(props.render_type==='hover') {
            nmax = 6;
        }

        this.state = {
            variables: props.variables, 
            n_vars: props.variables.length, 
            subject_urls: props.subject_urls,
			subject_lats: props.subject_lats,
			subject_lons: props.subject_lons,
			subject_IDs: props.subject_IDs,
			subject_PJs: props.subject_PJs,
            render_type: props.render_type,
			page: 0,
			nimages: nmax
        };
        
		this.npages = 1;

		this.prevPage = this.prevPage.bind(this);
		this.nextPage = this.nextPage.bind(this);
		
    }

	prevPage(e) {
		e.preventDefault();
		e.stopPropagation();
		if(this.state.page > 0) {
			this.setState({page: this.state.page -1});
		}

		return false;
	}

	nextPage(e) {
		e.preventDefault();
		e.stopPropagation();
		if(this.state.page < this.npages - 1) {
			this.setState({page: this.state.page + 1});
		}
		return false;
	}

    render() {


		if (this.state.subject_urls == null) {
			return null;
		}

		const nmax = this.state.nimages;
		
		this.npages = Math.ceil(this.state.subject_urls.length / nmax);

        var subject_data = [];

		const startind = this.state.page*this.state.nimages;

        for(var i=startind; i<Math.min(this.state.subject_urls.length, startind+this.state.nimages); i++) {

			subject_data.push({idx: i, url: this.state.subject_urls[i], ID: this.state.subject_IDs[i], 
				lon: this.state.subject_lons[i], lat: this.state.subject_lats[i], PJ: this.state.subject_PJs[i]
			});
        }

        var style = {};
        if(( subject_data.length > 1 )&(this.state.render_type==='hover')) {
            style = {width: '28%'};
        }

        return (
            <div className={'subject-images-container subject-images-container-'+this.state.render_type}>
				<div className='image-page'>
					<button onClick={this.prevPage}>&laquo;</button>
						{this.state.page+1} / {this.npages}
					<button onClick={this.nextPage}>&raquo;</button>
				</div>
				{subject_data.map(data => (
					<SubjectImage key={data.ID+"_"+this.state.render_type} lon={data.lon} lat={data.lat} ID={data.ID} PJ={data.PJ} url={data.url} style={style} />
				))
				}
            </div>
        )
    }
}


export default Explorer;
