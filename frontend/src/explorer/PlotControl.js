import React from "react";
import MultiRangeSlider from "multi-range-slider-react";
import MetadataUpload from "./MetadataUpload";

export const var_names = {
    hist: ["x"],
    scatter: ["x", "y"],
};

export default class PlotControl extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			variables: props.variables,
			chosen: "hist",
		}

		this.choose_plot_form = React.createRef();
        this.variable_form = React.createRef();
		this.metadata_upload = React.createRef();

		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.filter = this.filter.bind(this);
	}

	handleSubmit(event) {
		this.props.handleSubmit(event);
	}

	handleChange(data) {
		this.setState({chosen: data.chosen});
	}

	get_int_bool_vars() {
		/*
		 * get the integer (slider filter) and boolean (checkbox filter)
		 * variables and their corresponding filter data. This will be passed
		 * to the PlotContainer class to filter the plotly data
		 */
		var int_vars = {};
		var bool_vars = {};
		for (let key in this.state.variables) {
			var variable = this.state.variables[key];
			if (variable.dtype.includes('int')) {
				int_vars[key] = variable;
			}
			if (variable.dtype.includes('bool')) {
				bool_vars[key] = variable;
			}
		}

		return [int_vars, bool_vars];
	}

	filter(update) {
		/*
		 * driver function to get the updated data and modify the state
		 * this will then call the super filter method to update the plot
		 */
		let state = {...this.state};
		let update_variable = update.variable;

		if(state.variables[update_variable].dtype.includes('int')) {
			state.variables[update_variable].currentMin = update.currentMin;
			state.variables[update_variable].currentMax = update.currentMax;
		} else if(state.variables[update_variable].dtype.includes('bool')) {
			state.variables[update_variable].checked = update.checked;
		}

		this.setState(state, function() {
			let vars = this.get_int_bool_vars();
			this.props.filter(vars[0], vars[1]);
		});
	}

	componentDidUpdate() {
		/*
		 * get the updated variable data
		 */
		this.choose_plot_form.current.setState({
			'variables': this.state.variables,
		});
		this.variable_form.current.setState({
			'variables': this.state.variables,
		});
	}

	render() {
		var int_vars = [];
		var bool_vars = [];

        for (let key in this.state.variables) {
			var variable = this.state.variables[key];
			if (variable.dtype.includes('int')) {
				int_vars.push(key);
			}
			if (variable.dtype.includes('bool')) {
				bool_vars.push(key);
			}
        }

		return (
			<section id="plot-info">
            	<section id="choose-plot-container">
					<ChoosePlotType
						ref={this.choose_plot_form}
						variables={this.state.variables}
						handleChange={this.handleChange}
					/>
					<CreatePlotForm
						variables={this.state.variables}
						key={this.state.chosen + this.state.variables}
						plot_name={this.state.chosen}
						var_names={var_names[this.state.chosen]}
						ref={this.variable_form}
						onSubmit={this.handleSubmit}
					/>
            	</section>
				{int_vars.map((v) => (
					<Subset 
						key={v + "_range"}
						variable={v}
						minValue={this.state.variables[v].minValue}
						maxValue={this.state.variables[v].maxValue}
						onChange={this.filter} 
					/>
				))
				}
				{bool_vars.map((v) => (
					<Selector
						key={v + "_selector"}
						variable={v}
						checked={this.state.variables[v].checked}
						onChange={this.filter} 
					/>
				))
				}
				<MetadataUpload
					ref={this.metadata_upload}
					onSubmit={this.props.handleFileUpload}
				/>
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
            variables: props.variables,
            chosen: "hist",
        };


        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        var plot_type = event.target.id;
		this.setState({chosen: plot_type});
		this.props.handleChange({'chosen': plot_type});
    }

    render() {
        return (
			<section id="plot-header">
				<h1>Choose the plot type</h1>
				<nav id="plot-type">
					<span>
						<input
							type="radio"
							name="plot-type"
							className="plot-type"
							id="hist"
							onChange={this.handleChange}
							defaultChecked
						/>
						<label htmlFor="hist" className="radio plot-type">
							Histogram
						</label>
					</span>
					<span>
						<input
							type="radio"
							name="plot-type"
							className="plot-type"
							id="scatter"
							onChange={this.handleChange}
						/>
						<label htmlFor="scatter" className="radio plot-type">
							Scatter plot
						</label>
					</span>
				</nav>
			</section>
        );
    }
}

class CreatePlotForm extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {
            variables: props.variables,
			dtypes: props.dtypes,
            n_vars: props.var_names.length,
            var_names: props.var_names,
            plot_name: props.plot_name,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        this.props.onSubmit(event);
    }
    render() {
        var var_selects = [];
        var variables = [];

        for (var i = 0; i < this.state.n_vars; i++) {
            var_selects.push({ name: this.state.var_names[i] });
        }

        for (let key in this.state.variables) {
			var variable = this.state.variables[key];
			if ((variable.dtype.includes('float'))||(variable.dtype.includes('int'))) {
	            variables.push({ name: key, variable: key });
			}
        }

        return (
			<section id="variable-picker">
				<div
					id="hist-variable"
					className="variable-picker-container"
					key={"var_container"}
				>
					<form
						id="hist-variables"
						className="plot-variable"
						onSubmit={this.handleSubmit}
						key={"var_form"}
					>
						{var_selects.map((vx) => (
							<span key={vx.name + "_span"}>
								<label htmlFor={vx.name} key={vx.name + "_label"}>
									{vx.name}:{" "}
								</label>
								<select
									name={vx.name}
									id={vx.name}
									defaultValue=""
									className="variable-select"
									key={vx.name + "_select"}
								>
									<option value="" disabled key={vx.name + "_default"}>
										Choose a variable
									</option>
									{variables.map((vi) => (
										<option
											value={vi.variable}
											key={vx.name + vi.name + "_label"}
										>
											{vi.variable}
										</option>
									))}
								</select>
							</span>
						))}
						<input
							type="submit"
							value="Plot!"
							key={this.state.subject_set_id + "_var_submit"}
						/>
					</form>
				</div>
			</section>
        );
    }
}

class Subset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
			minValue: props.minValue,
			maxValue: props.maxValue,
			currentMin: props.minValue,
			currentMax: props.maxValue,
			variable: props.variable
		};
    }

    handleInput(e) {
        this.setState({ currentMax: e.maxValue, currentMin: e.minValue });

        this.props.onChange(this.state);
    }

    render() {
        return (
            <div id="filter">
                <label>Filter by {this.state.variable}</label>
                <MultiRangeSlider
                    min={this.state.minValue}
                    max={this.state.maxValue}
                    step={1}
                    ruler={false}
                    label={true}
                    preventWheel={false}
                    minValue={this.state.currentMin}
                    maxValue={this.state.currentMax}
                    onInput={(e) => {
                        this.handleInput(e);
                    }}
                />
            </div>
        );
    }
}

class Selector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
			checked: props.checked,
			variable: props.variable
		};

        this.handleInput = this.handleInput.bind(this);
    }

    handleInput() {
        this.setState({ checked: !this.state.checked }, function () {
            this.props.onChange(this.state);
        });
    }

    render() {
        return (
            <div id="selector_checkbox">
                <input
                    type="checkbox"
                    name={this.state.variable+"_only"}
                    id={this.state.variable+"_only"}
                    onChange={this.handleInput}
                    checked={this.state.checked}
                />
                <label htmlFor={this.state.variable+"_only"}>Show only {this.state.variable} </label>
            </div>
        );
    }
}



