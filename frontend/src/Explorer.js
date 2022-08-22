import React, {useState} from 'react';
import Plot from 'react-plotly.js';
import MainNav from './Nav.js';
import SubjectImage from './SubjectImage.js';
import MultiRangeSlider from "multi-range-slider-react";
import LoadingPage from './LoadingPage.js';

const var_names = {
    hist: ['x'],
    scatter: ['x','y'],
}

const variables = {Latitude: 'latitude', Longitude: 'longitude', Perijove: 'perijove'};

const blue = '#2e86c1';
const red  = '#922b21';


class Explorer extends React.Component {
	/* 
	 * Main explorer app. Creates the forms for choosing plot type and variables
	 * and also the subsequent display for the plot and the subject images
	 */
	constructor(props) {
		super(props);

		// create references for the child components
		this.choose_plot_form = React.createRef();
		this.create_plot_form = React.createRef();
		this.subject_plotter  = React.createRef();
		this.subset_PJ        = React.createRef();
		this.vortex_selector  = React.createRef();

		// handleSubmit will handle the "Plot!" click button
		this.handleSubmit = this.handleSubmit.bind(this);

		// filter will handle the slider for perijove filtering and 
		// "vortex only" selection
		this.filter = this.filter.bind(this);

	}

	handleSubmit(event) {
		/* 
		 * handles the "Plot!" click by fetching the relevant
		 * data from the child component forms
		 * and sending to the backend API to retrieve the subject metadata
		 * (i.e. lat, lon, PJ, ID, url, etc.)
		 */
		event.preventDefault();

		// start building the data structure to send to the backend
        var data = {plot_type: this.choose_plot_form.current.state.chosen};

		const chosen_vars = var_names[data.plot_type];

		// get a list of chosen variables from the form elements
        for(var i=0; i<chosen_vars.length; i++) {
            if(event.target.elements[chosen_vars[i]].value==='') {
                return;
            }
            data[chosen_vars[i]] = event.target.elements[chosen_vars[i]].value;
        }

		// send to the backend
		fetch('/backend/plot-exploration/', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
			// the input/output are in JSON format
            body: JSON.stringify(data)
        }).then( result => result.json()).then( plotly_meta => {
            if(!plotly_meta.error) {

				// layout parameters for the Plotly element
                var layout = plotly_meta.layout;
                layout['hovermode'] = 'closest';
                layout['width'] = 1200;
                layout['height'] = 600;


				// send the retrieved data to the plotter component which will 
				// save the data and distribute it as needed to both the 
				// subject image display component and the plotly component
				this.subject_plotter.current.set_data(plotly_meta, layout, data.plot_type, 
					this.subset_PJ.current.state.minValue, this.subset_PJ.current.state.maxValue,
					this.vortex_selector.current.state.checked
				);
            } else {
                
            }
        })
	}

	filter(event) {
		/* 
		 * handles the perijove slider for filtering the displayed data
		 */

		// this is handled mainly by the plotter component since that is where
		// the data is stored
		this.subject_plotter.current.filter(this.subset_PJ.current.state.minValue, 
			this.subset_PJ.current.state.maxValue, this.vortex_selector.current.state.checked);
	}

	render() {
		document.title = 'JuDE explorer'
		return (
			<article id='main'>
				<MainNav />
				<section id='app'>
					<section id='plot-info'>
						<ChoosePlotType ref={this.choose_plot_form} onSubmit={this.handleSubmit}/>
						<SubsetPJ ref={this.subset_PJ} onChange={this.filter}  />
						<VortexSelector ref={this.vortex_selector} onChange={this.filter} />
					</section>
					<PlotContainer ref={this.subject_plotter} />
				</section>
			</article>
		)
	}
}


class PlotContainer extends React.Component {
	/* 
	 * Main display component for the Plotly plots and the subject images
	 * also handles the data distribution between the plotly components
	 * and the subject image display
	 */

	constructor(props) {
		super(props);

		// create links to child components for plotting the 
		// subject images and the plotly component
		this.subject_images  = React.createRef();
		this.subject_plotter = React.createRef();
		this.hover_images    = React.createRef();

		// create handlers for hovering over/selecting the plotly data
		this.handleHover  = this.handleHover.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	set_data(plotly_meta, layout, plot_type, PJstart, PJend, vortex_only) {
		/* 
		 * main function for setting the data received from the backend
		 * immediately calls `filter_PJ` which calls the 
		 * `set_plot_data` to set the plotly data
		 */
		this.setState({data: plotly_meta.data, layout: layout, 
			subject_lats: plotly_meta.lats, subject_lons: plotly_meta.lons, 
			subject_IDs: plotly_meta.IDs, subject_PJs: plotly_meta.PJs,
			subject_urls: plotly_meta.subject_urls, is_vortex: plotly_meta.is_vortex,
			plot_name: plot_type}, function() {
				this.filter(PJstart, PJend, vortex_only)
			});

	}

	set_plot_data(data, urls, lons, lats, PJs, IDs) {
		/*
		 * sets the relevant data to the plotly component and subject image
		 * display for plotting purposes
		 * by default is called when the backend receives data from clicking 
		 * "Plot!"
		 */

		// set the data for the main set of subject images at the bottom
		this.subject_images.current.setState({subject_urls: urls, 
			subject_lats: lats, subject_lons: lons, 
			subject_IDs: IDs, subject_PJs: PJs
		});

		// set the data for the images on hover on the right
		// by default only sets the first element of the subject list
		this.hover_images.current.setState({subject_urls: [urls[0]], 
			subject_lats: [lats[0]], subject_lons: [lons[0]], 
			subject_IDs: [IDs[0]], subject_PJs: [PJs[0]]
		});

		// set the data for the plotly component
		this.subject_plotter.current.setState({data: [data], layout: this.state.layout, 
			subject_lats: lats, subject_lons: lons, 
			subject_IDs: IDs, subject_PJs: PJs,
			subject_urls: urls, plot_name: this.state.plot_name});
	}

	filter(start, end, vortex_only) {
		/*
		 * filters the range of perijoves displayed 
		 * called after plotting and also when the PJ slider is changed
		 */
		var urls = []; var lats = []; var lons = []; var IDs = []; var PJs = []; var data = {};
		
		// duplicate the plotly structure
		for (var key in this.state.data) {
			if ((key!=='x')||(key!=='y')) {
				data[key] = this.state.data[key];
			}
		}

		data.marker.color = new Array(data.marker.color.length).fill(blue); 

		// create the same set of variables as the original plot
		data.x = [];
		if ('y' in this.state.data) {
			data.y = [];
		}

		// copy over the data for the given perijove range
		for(var i=0; i<this.state.subject_lons.length; i++) {
			if((vortex_only)&(!this.state.is_vortex[i])) {
				continue;
			}

			if ((this.state.subject_PJs[i] >= start)&(this.state.subject_PJs[i] <= end)) {
				urls.push(this.state.subject_urls[i]);
				lons.push(this.state.subject_lons[i]);
				lats.push(this.state.subject_lats[i]);
				IDs.push(this.state.subject_IDs[i]);
				PJs.push(this.state.subject_PJs[i]);
				data.x.push(this.state.data.x[i]);

				if( 'y' in this.state.data) {
					data.y.push(this.state.data.y[i]);
				}
			}
		}

		// refresh the plot
		this.set_plot_data(data, urls, lons, lats, PJs, IDs);
	}
	
	handleHover(data) {
		/*
		 * function that handles the change of the hover image panel when
		 * hovering over the plotly component
		 */
		this.hover_images.current.setState({subject_urls: data.urls, subject_lons: data.lons,
			subject_lats: data.lats, subject_IDs: data.IDs, subject_PJs: data.PJs,
			page: 0});
	}
	
	handleSelect(data) {
		/*
		 * function that handles the change of the selection image panel when
		 * lasso or box selecting data in the plotly component
		 */
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
				</section>
				<section id='images-container'>
					<SubjectImages 
						variables={[]} render_type={'selection'} 
						subject_urls={null} subject_lats={null} subject_lons={null}
						subject_IDs={null} subject_PJs={null}
						ref={this.subject_images} />
					<SubjectImages variables={[]} 
						render_type={'hover'} 
						subject_urls={null} subject_lats={null} subject_lons={null}
						subject_IDs={null} subject_PJs={null}
						ref={this.hover_images} /> 
				</section>

			</section>
		)
	}
}

class ChoosePlotType extends React.Component {
	/*
	 * Form for choosing the type of plot (currently Histogram and Scatter)
	 * will automatically create the subsequent form to choose the required variables
	 */
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


class SubsetPJ extends React.Component {
	constructor(props) {
		super(props);
		this.state = {minValue: 13, maxValue: 36};
	}

	handleInput(e) {
		this.setState({maxValue: e.maxValue, minValue: e.minValue});

		this.props.onChange(e);
	}

	render() {
		return (

			<div id='filter-pj'>
				<label>Filter by perijove</label>
				<MultiRangeSlider
					min={13}
					max={36}
					step={1}
					ruler={false}
					label={true}
					preventWheel={false}
					minValue={this.state.minValue}
					maxValue={this.state.maxValue}
					onInput={(e) => {
						this.handleInput(e);
					}}
				/>
			</div>

		)
	}
}

class VortexSelector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {checked: true};

		this.handleInput = this.handleInput.bind(this);
	}

	handleInput(e) {
		this.setState({checked: !this.state.checked});
		this.props.onChange(e);
	}

	render() {
		return (
			<div id="vortex_checkbox">
				<input type="checkbox" name="vortex_only" id="vortex_only" 
					onChange={this.handleInput} checked={this.state.checked}/>
				<label for="vortex_only">Show vortices only </label>
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
		this.plot           = React.createRef();
    }

    handleHover(event_data) {
		var data = { urls: [], lons: [], lats: [], IDs: [], PJs: [] };
        if(this.state.plot_name==='hist') {
			var binNumber = [];
            for(var i=0; i < event_data.points[0].pointNumbers.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[0].pointNumbers[i]]);
                data.lons.push(this.state.subject_lons[event_data.points[0].pointNumbers[i]]);
                data.lats.push(this.state.subject_lats[event_data.points[0].pointNumbers[i]]);
                data.IDs.push(this.state.subject_IDs[event_data.points[0].pointNumbers[i]]);
                data.PJs.push(this.state.subject_PJs[event_data.points[0].pointNumbers[i]]);
				binNumber.push(event_data.points[0].binNumber);
            };

			binNumber = [...new Set(binNumber) ];

			// change the bin corresponding to the hover data
			var colors = new Array(this.state.data[0].marker.color.length).fill(blue); 
			for (i=0; i < binNumber.length; i++) {
				colors[binNumber[i]] = red;
			}


        } else if(this.state.plot_name==='scatter') {
			var colors = new Array(this.state.data[0].x.length).fill(blue); 
            for(i=0; i < event_data.points.length; i++){
                data.urls.push(this.state.subject_urls[event_data.points[i].pointNumber]);
                data.lons.push(this.state.subject_lons[event_data.points[i].pointNumber]);
                data.lats.push(this.state.subject_lats[event_data.points[i].pointNumber]);
                data.IDs.push(this.state.subject_IDs[event_data.points[i].pointNumber]);
                data.PJs.push(this.state.subject_PJs[event_data.points[i].pointNumber]);
				colors[event_data.points[i].pointNumber] = red;
            };
        }

		var state_data = this.state.data[0];
		state_data.marker.color = colors;
		this.setState({'data': [state_data]});

		
		this.props.handleHover(data);
    }
    
	handleSelect(event_data) {
		if (event_data===undefined) {
			return;
		}

		var data = { urls: [], lons: [], lats: [], IDs: [], PJs: [] };
        if(this.state.plot_name==='hist') {
			for(var j=0; j < event_data.points.length; j++) {
				for(var i=0; i < event_data.points[j].pointNumbers.length; i++){
					data.urls.push(this.state.subject_urls[event_data.points[j].pointNumbers[i]]);
					data.lons.push(this.state.subject_lons[event_data.points[j].pointNumbers[i]]);
					data.lats.push(this.state.subject_lats[event_data.points[j].pointNumbers[i]]);
					data.IDs.push(this.state.subject_IDs[event_data.points[j].pointNumbers[i]]);
					data.PJs.push(this.state.subject_PJs[event_data.points[j].pointNumbers[i]]);
				};
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
		var data = { urls: [], lons: [], lats: [], IDs: [], PJs: [] };
        if(this.state.plot_name==='hist') {
            for(var i=0; i < this.state.subject_urls.length; i++){
                data.urls.push(this.state.subject_urls[i]);
                data.lons.push(this.state.subject_lons[i]);
                data.lats.push(this.state.subject_lats[i]);
                data.IDs.push(this.state.subject_IDs[i]);
                data.PJs.push(this.state.subject_PJs[i]);
            };
        } else if(this.state.plot_name==='scatter') {
            for(i=0; i < this.state.subject_urls.length; i++){
                data.urls.push(this.state.subject_urls[i]);
                data.lons.push(this.state.subject_lons[i]);
                data.lats.push(this.state.subject_lats[i]);
                data.IDs.push(this.state.subject_IDs[i]);
                data.PJs.push(this.state.subject_PJs[i]);
            };
        }
		
		this.props.handleSelect(data);
	}

    render() {
			if (this.state.data != null) {
				return (
					<div id='plot'>
						<Plot ref={this.plot} data={this.state.data} layout={this.state.layout}
							onHover={this.handleHover} onSelected={this.handleSelect} 
							onDeselect={this.resetSelection} />
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
		var nmax = 16;

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

		this.prevPage  = this.prevPage.bind(this);
		this.nextPage  = this.nextPage.bind(this);
		this.getExport = this.getExport.bind(this);
		
		this.loading_page     = React.createRef();
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

	getExport(e) {
		var postdata = {subject_IDs: this.state.subject_IDs};


		this.loading_page.current.enable();

		// send to the backend
		fetch('/backend/create-export/', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
			// the input/output are in JSON format
			body: JSON.stringify(postdata)
        }).then( result => result.json()).then( data => {
			if (!data.error) {
				// create a link holding the file download
				const element = document.createElement('a');

				// save the file blob
				const file = new Blob([data.filedata], {
					type: "text/csv"
				});

				// save the link attributes
				element.href     = URL.createObjectURL(file);
				element.download = 'subject_export.csv';

				// append to body (for Firefox)
				document.body.appendChild(element);

				// click on the link to download the file
				element.click();

				// cleanup
				element.remove();
				this.loading_page.current.disable();
            } else {
                
            }
        });
		
		
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

		if (this.state.subject_urls.length < 1) {
			return null;
		}

		var rand_key = Math.random();

        return (
            <div key={rand_key} className={'subject-images-container subject-images-container-'+this.state.render_type}>
				<div className='image-page'>
					<button onClick={this.prevPage}>&laquo;</button>
						{this.state.page+1} / {this.npages}
					<button onClick={this.nextPage}>&raquo;</button>
				</div>
				{subject_data.map(data => (
					<SubjectImage key={data.ID+"_"+this.state.render_type} lon={data.lon} lat={data.lat} ID={data.ID} PJ={data.PJ} url={data.url} style={style} />
				))
				}

				<div className='subject-export-container'>
					<button onClick={this.getExport}>Export subjects</button>
				</div>
				<LoadingPage ref={this.loading_page} enable={false}/>
            </div>
        )
    }
}


export default Explorer;
