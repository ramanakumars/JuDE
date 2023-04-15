import React from "react";

const var_names = {
    hist: ["x"],
    scatter: ["x", "y"],
    bar: ["x"],
};

class Explorer extends React.Component {
    constructor(props) {
        super(props);

        this.choose_plot_form = React.createRef();
        this.create_plot_form = React.createRef();
        this.subject_plotter = React.createRef();
    }

    render() {
        <article id="main">
            <section id="subject-info">
                <ChoosePlotType ref={this.choose_plot_form} />
                <CreatePlotForm ref={this.create_plot_form} />
            </section>
            <section id="plotter">
                <SubjectPlotter ref={this.subject_plotter} />
            </section>
        </article>;
    }
}

class ChoosePlotType extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            variables: props.variables,
            chosen: "hist",
        };

        this.variable_form = React.createRef();

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        var plot_type = event.target.id;
        this.setState({ chosen: plot_type });
    }

    handleSubmit(event) {
        this.props.onSubmit(event);
    }

    render() {
        return (
            <section id="choose-plot-container">
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
                        <span>
                            <input
                                type="radio"
                                name="plot-type"
                                className="plot-type"
                                id="bar"
                                onChange={this.handleChange}
                            />
                            <label htmlFor="bar" className="radio plot-type">
                                Bar graph
                            </label>
                        </span>
                    </nav>
                </section>
                <section id="variable-picker">
                    <CreatePlotForm
                        variables={this.state.variables}
                        plot_name={this.state.chosen}
                        var_names={var_names[this.state.chosen]}
                        key={this.state.chosen}
                        ref={this.variable_form}
                        onSubmit={this.handleSubmit}
                    />
                </section>
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

        for (var key in this.state.variables) {
            variables.push({ name: key, variable: this.state.variables[key] });
        }

        return (
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
                                    Select a project and subject set!
                                </option>
                                {variables.map((vi) => (
                                    <option
                                        value={vi.variable}
                                        key={vx.name + vi.name + "_label"}
                                    >
                                        {vi.name}
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
            variables: props.variables,
            n_vars: props.variables.length,
            subject_urls: props.subject_urls,
            plot_name: props.plot_name,
        };

        ReactDOM.render(
            <SubjectImages
                variables={this.state.variables}
                render_type={"selection"}
                subject_urls={this.state.subject_urls}
                ref={(SubjectImages) => {
                    this.images = SubjectImages;
                }}
            />,
            document.getElementById("images")
        );

        ReactDOM.render(
            <SubjectImages
                key="hover"
                variables={this.state.variables}
                render_type={"hover"}
                subject_urls={[this.state.subject_urls[0]]}
                ref={(SubjectImages) => {
                    this.hoverimage = SubjectImages;
                }}
            />,
            document.getElementById("hover-image")
        );

        this.handleHover = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
    }

    handleHover(data) {
        var urls = [];
        if (this.state.plot_name == "hist") {
            for (var i = 0; i < data.points[0].pointNumbers.length; i++) {
                urls.push(this.state.subject_urls[data.points[0].pointNumbers[i]]);
            }
        } else if (this.state.plot_name == "scatter") {
            for (var i = 0; i < data.points.length; i++) {
                urls.push(this.state.subject_urls[data.points[i].pointNumber]);
            }
        }

        this.hoverimage.setState({ subject_urls: urls, page: 0 });
    }

    handleSelect(data) {
        if (data == undefined) {
            return;
        }

        var urls = [];
        if (this.state.plot_name == "hist") {
            for (var i = 0; i < data.points[0].pointNumbers.length; i++) {
                urls.push(this.state.subject_urls[data.points[0].pointNumbers[i]]);
            }
        } else if (this.state.plot_name == "scatter") {
            for (var i = 0; i < data.points.length; i++) {
                urls.push(this.state.subject_urls[data.points[i].pointNumber]);
            }
        }

        this.images.setState({ subject_urls: urls, page: 0 });
    }

    resetSelection() {
        this.images.setState({ subject_urls: this.state.subject_urls, page: 0 });
    }

    render() {
        return (
            <Plot
                data={this.state.data}
                layout={this.state.layout}
                onHover={this.handleHover}
                onSelected={this.handleSelect}
                onDeselect={this.resetSelection}
            />
        );
    }
}

class SubjectImages extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {
            variables: props.variables,
            n_vars: props.variables.length,
            subject_urls: props.subject_urls,
            render_type: props.render_type,
            page: 0,
        };

        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);
    }

    prevPage(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.page > 0) {
            this.setState({ page: this.state.page - 1 });
        }

        return false;
    }

    nextPage(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.page < this.state.npages - 1) {
            this.setState({ page: this.state.page + 1 });
        }
        return false;
    }

    render() {
        var nmax = 25;
        if (this.state.render_type == "hover") {
            nmax = 6;
        }

        this.state.nimages = nmax;
        this.state.npages = Math.ceil(this.state.subject_urls.length / nmax);

        var urls = [];

        const startind = this.state.page * this.state.nimages;

        for (
            var i = startind;
            i < Math.min(this.state.subject_urls.length, startind + this.state.nimages);
            i++
        ) {
            urls.push({ idx: i, url: this.state.subject_urls[i] });
        }

        var style = {};
        if ((urls.length > 1) & (this.state.render_type == "hover")) {
            style = { width: "28%" };
        }

        return (
            <div
                className={
                    "subject-images-container subject-images-container-" +
                    this.state.render_type
                }
            >
                <div className="image-page">
                    <button onClick={this.prevPage}>&laquo;</button>
                    {this.state.page + 1} / {this.state.npages}
                    <button onClick={this.nextPage}>&raquo;</button>
                </div>
                {urls.map((url) => (
                    <span
                        key={this.state.render_type + "_" + url.url + "_span"}
                        style={style}
                        id={"subject_" + url.idx}
                    >
                        <img
                            key={this.state.render_type + "_" + url.url + "_img"}
                            src={url.url}
                            className="subject-image"
                        />
                    </span>
                ))}
            </div>
        );
    }
}

export default Explorer;
