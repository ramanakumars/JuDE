import React from "react";
import SubjectImages from './SubjectImages.js'
import Plot from "react-plotly.js";

const plotly_type = {'hist': 'histogram', 'scatter': 'scattergl'};
export const blue = "#2e86c1";
export const red = "#922b21";

export default class PlotContainer extends React.Component {
    /*
     * Main display component for the Plotly plots and the subject images
     * also handles the data distribution between the plotly components
     * and the subject image display
     */

    constructor(props) {
        super(props);

        // create links to child components for plotting the
        // subject images and the plotly component
        this.subject_images = React.createRef();
        this.subject_plotter = React.createRef();
        this.hover_images = React.createRef();

        // create handlers for hovering over/selecting the plotly data
        this.handleHover = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    set_data(plot_variables, layout, plot_type, int_vars, bool_vars) {
        /*
         * main function for setting the data received from the backend
         * immediately calls `filter_PJ` which calls the
         * `set_plot_data` to set the plotly data
         */

		var data = {}
		if(plot_type === "hist") {
			var metadata_key = plot_variables['x']

			var values = this.state.subject_data.map((data) => (
				data[metadata_key]
			));

			var binstart = 0;
			var binend = 0;
			var binwidth = 0;
			var nbins = 0;
			if(metadata_key === "latitude") {
				binstart = -70;
				binend = 70;
				binwidth = 5;
				nbins = 28;
			} else if (metadata_key === "longitude") {
				binstart = -180;
				binend = 180;
				binwidth = 10;
				nbins = 36;
			} else if (metadata_key === "perijove") {
				binstart = 13;
				binend = 36;
				binwidth = 1;
				nbins = 24;
			}

			data = {'x': values, 'type': plotly_type[plot_type],
				'xbins': {'start': binstart, 'end': binend, 'size': binwidth},
				'nbinsx': nbins, 
				'marker': {'color': Array(nbins).fill(blue) }
			};
		} else if (plot_type === "scatter") {
			var data_x = this.state.subject_data.map((data) => (
				data[plot_variables['x']]));
			var data_y = this.state.subject_data.map((data) => (
				data[plot_variables['y']]));
			
			data = {'x': data_x, 'y': data_y, 'mode': 'markers',
				'type': plotly_type[plot_type],
				'marker': {'color': Array(data_x.length).fill("dodgerblue")}
			};
		}

        this.setState(
            {
                data: data,
                layout: layout,
                plot_name: plot_type,
            },
            function () {
                this.filter(int_vars, bool_vars);
            }
        );
    }

    set_plot_data(data, subject_data) {
        /*
         * sets the relevant data to the plotly component and subject image
         * display for plotting purposes
         * by default is called when the backend receives data from clicking
         * "Plot!"
         */

        // set the data for the main set of subject images at the bottom
        this.subject_images.current.setState({ subject_data: subject_data });

        // set the data for the images on hover on the right
        // by default only sets the first element of the subject list
        this.hover_images.current.setState({ subject_data: [subject_data[0]] });

        // set the data for the plotly component
        this.subject_plotter.current.setState({
            data: [data],
            layout: this.state.layout,
            subject_data: subject_data,
            plot_name: this.state.plot_name,
        });
    }

    filter(int_vars, bool_vars) {
        /*
         * filters the range of perijoves displayed
         * called after plotting and also when the PJ slider is changed
         */
        var data = {};
        var subject_data = [];

        if (!this.state.data) {
            return null;
        }

        // duplicate the plotly structure
        for (var key in this.state.data) {
            if (key !== "x" || key !== "y") {
                data[key] = this.state.data[key];
            }
        }

        data.marker.color = new Array(data.marker.color.length).fill(blue);

        // create the same set of variables as the original plot
        data.x = [];
        if ("y" in this.state.data) {
            data.y = [];
        }

        // copy over the data for the given perijove range
        for (var i = 0; i < this.state.subject_data.length; i++) {
			let metadata = this.state.subject_data[i];
			let skip_row = false;
			for (let variable in metadata) {
				if (variable in int_vars) {
					if (
						(metadata[variable] < int_vars[variable].currentMin) || (metadata[variable] > int_vars[variable].currentMax)
					) {
						skip_row = true;
						break;
					}
				}

				if (variable in bool_vars) {
					if ((bool_vars[variable].checked) & (!metadata[variable])) {
						skip_row = true;
						break;
					}
				}
			}

			if (skip_row) {
				continue;
			}

			data.x.push(this.state.data.x[i]);
			subject_data.push(this.state.subject_data[i]);

			if ("y" in this.state.data) {
				data.y.push(this.state.data.y[i]);
			}
        }

        // refresh the plot
        this.set_plot_data(data, subject_data);
    }

    handleHover(data) {
        /*
         * function that handles the change of the hover image panel when
         * hovering over the plotly component
         */
        this.hover_images.current.setState({ subject_data: data, page: 0 });
    }

    handleSelect(data) {
        /*
         * function that handles the change of the selection image panel when
         * lasso or box selecting data in the plotly component
         */
        this.subject_images.current.setState({ subject_data: data, page: 0 });
    }

    render() {
        return (
            <section id="plotter">
                <section id="plot-container">
                    <SubjectPlotter
                        ref={this.subject_plotter}
                        variables={[]}
                        data={null}
                        layout={null}
                        subject_data={[]}
                        handleHover={this.handleHover}
                        handleSelect={this.handleSelect}
                    />
                </section>
                <section id="images-container">
                    <SubjectImages
                        variables={[]}
                        render_type={"selection"}
                        subject_data={[]}
                        ref={this.subject_images}
                    />
                    <SubjectImages
                        variables={[]}
                        render_type={"hover"}
                        subject_data={[]}
                        ref={this.hover_images}
                    />
                </section>
            </section>
        );
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
            subject_data: props.subject_data,
            plot_name: props.plot_name,
        };

        this.handleHover = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
        this.plot = React.createRef();
    }

    handleHover(event_data) {
        var data = [];
		var colors = [];
        if (this.state.plot_name === "hist") {
            var binNumber = [];
            for (var i = 0; i < event_data.points[0].pointNumbers.length; i++) {
                data.push(this.state.subject_data[event_data.points[0].pointNumbers[i]]);
                binNumber.push(event_data.points[0].binNumber);
            }

            binNumber = [...new Set(binNumber)];

            // change the bin corresponding to the hover data
            colors = new Array(this.state.data[0].marker.color.length).fill(blue);
            for (i = 0; i < binNumber.length; i++) {
                colors[binNumber[i]] = red;
            }
        } else if (this.state.plot_name === "scatter") {
            colors = new Array(this.state.data[0].x.length).fill(blue);
            for (i = 0; i < event_data.points.length; i++) {
                data.push(this.state.subject_data[event_data.points[i].pointNumber]);
                colors[event_data.points[i].pointNumber] = red;
            }
        }

        var state_data = this.state.data[0];
        state_data.marker.color = colors;
        this.setState({ data: [state_data] });

        this.props.handleHover(data);
    }

    handleSelect(event_data) {
        if (event_data === undefined) {
            return;
        }

        var data = [];
        if (this.state.plot_name === "hist") {
            for (var j = 0; j < event_data.points.length; j++) {
                for (var i = 0; i < event_data.points[j].pointNumbers.length; i++) {
                    data.push(this.state.subject_data[event_data.points[0].pointNumbers[i]]);
                }
            }
        } else if (this.state.plot_name === "scatter") {
            for (i = 0; i < event_data.points.length; i++) {
                data.push(this.state.subject_data[event_data.points[i].pointNumber]);
            }
        }

        this.props.handleSelect(data);
    }

    resetSelection() {
        var data = [];
        if (this.state.plot_name === "hist") {
            for (var i = 0; i < this.state.subject_data.length; i++) {
                data.push(this.state.subject_data[i]);
            }
        } else if (this.state.plot_name === "scatter") {
            for (i = 0; i < this.state.subject_data.length; i++) {
                data.push(this.state.subject_data[i]);
            }
        }

        this.props.handleSelect(data);
    }

    render() {
        if (this.state.data != null) {
            return (
                <div id="plot">
                    <Plot
                        ref={this.plot}
                        data={this.state.data}
                        layout={this.state.layout}
                        onHover={this.handleHover}
                        onSelected={this.handleSelect}
                        onDeselect={this.resetSelection}
                    />
                </div>
            );
        } else {
            return <div id="plot"></div>;
        }
    }
}
