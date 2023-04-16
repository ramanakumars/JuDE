import React from "react";

import subject_viewer from "../images/subject_viewer_annotated.png";
import explore_data from "../images/explore_data_annotated.png";

import scatter from "../images/scatter.png";
import hist from "../images/hist.png";

class MainNav extends React.Component {
    constructor(props) {
        super(props);

        this.state = { target: props.target };
    }

    render() {
        return (
            <nav id="mainnav">
                <section className="apptitle">JuDE</section>

                <section className="feedback-container">
                    We'd love to hear your thoughts! If you have a few minutes, please provide
                    feedback on JuDE{" "}
                    <a href="https://umn.qualtrics.com/jfe/form/SV_8qYD90HcNJCcuO2">here!</a>
                </section>

                <section className="nav">
                    {(this.state.target === "explore" || this.state.target === "subject") && (
                        <Help target={this.state.target} />
                    )}

                    <a className="nav" href="/">
                        home
                    </a>
                    <a className="nav" href="/explore/">
                        explore data
                    </a>
                </section>
            </nav>
        );
    }
}

class Help extends React.Component {
    constructor(props) {
        super(props);

        this.state = { target: props.target };
    }

    toggleHelp = () => {
        this.setState({ showHelp: !this.state.showHelp });
    };

    render() {
        return (
            <section className="help">
                <button onClick={this.toggleHelp}>
                    <i className="material-icons">help</i>
                </button>
                {this.state.showHelp === true && <HelpText target={this.state.target} />}
            </section>
        );
    }
}

class HelpText extends React.Component {
    constructor(props) {
        super(props);

        this.state = { target: props.target };
    }

    render() {
        return (
            <section className="helptext-container">
                <section className="helptext">
                    {this.state.target === "explore" && exploreHelpText()}
                    {this.state.target === "subject" && subjectHelpText()}
                </section>
            </section>
        );
    }
}

const subjectHelpText = () => {
    return (
        <div>
            <p>
                The subject page contains three things:
                <img src={subject_viewer} alt="Example of a subject specific page"/>
                <ol>
                    <li>
                        On the left panel, you will see the <b>subject image</b>
                        as seen during classification, followed by the{" "}
                        <b>associated metadata</b>.
                    </li>

                    <li>
                        Below this, there is a map showing the{" "}
                        <b>mosaic of all images from this perijove</b>, and the{" "}
                        <b>location of this subject</b>.
                    </li>

                    <li>
                        On the right, you will see an <b>interactive window</b> which shows a
                        small segment of this mosaic, centered on the subject. The black
                        outline shows the <b>edge of the subject on the mosaic</b> (note that
                        this outline will be very curved near the polar regions, since the
                        physical spacing between longitude lines will shrink).
                    </li>
                </ol>
            </p>

            <p>
                On the interactive window, the panel on the top right will show a selection of
                tools that can be used to interact with the mosaic. You can use the zoom tool
                to zoom into a specific region, or the pan tool to move around. If you would
                like to share this mosaic on Talk, you can click the first option (camera icon)
                to download the image and share it with Talk (note that you will need to use an
                image upload service, like
                <a href="https://imgur.com/"> Imgur</a> to get a link to the image).
            </p>
        </div>
    );
};

const exploreHelpText = () => {
    return (
        <div>
            <p>
                The exploration page contains four elements. To illustrate the different
                options available on this page, please watch this overview:
            </p>

            <p>
                <iframe
                    width="100%"
                    height="315"
                    src="https://www.youtube.com/embed/ttDVrAhwHh8"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            </p>

            <p>
                Each element is described in detail below:
                <img src={explore_data} alt="Overview of the exploration page"/>
                <ol>
                    <li>
                        On the left panel, you will see a set of options for creating plots. In
                        this panel, you can select the type of plot and the variables
                        (latitude, latitude or perijove). On plotting, you can filter the data
                        by perijove, and whether you want to show only vortices found by
                        volunteers in the "Is there a Vortex" workflow.
                        <br />
                        There are currently two plot types to choose from:
                        <ul>
                            <li>
                                <b>Histogram</b>: This is good for finding the number of
                                subjects that fall within specific ranges. For example,
                                plotting a histogram of latitude values will show the
                                distribution of cloud features by latitude (e.g., features in
                                the equator look different from those at the poles!). On
                                picking the histogram option, you will be asked to choose the
                                variable to use for plotting.
                            </li>

                            <img src={hist} alt="Example of a histogram"/>

                            <li>
                                <b>Scatter</b>: A scatter plot is 2-dimensional plot type, and
                                is useful for identifying relationships between the two
                                variables. For example, you can plot longitude on the x-axis
                                and latitude on the y-axis to show the locations of features on
                                the jovian map. On selecting this option, you will be asked to
                                choose the x- and the y-variable to plot.
                            </li>

                            <img src={scatter} alt="Example of a scatter plot"/>
                        </ul>
                    </li>

                    <li>
                        Once you have selected your plot type and variables, you can click
                        "Plot!" to generate the plot. This will create an interactive window in
                        the center of the page with the requested plot. You can use the toolbar
                        in the top right of the plot to zoom, pan or select the data. You can
                        also save the plot out to an image and use it for discussions in Talk.
                        There will also be two windows below the plot that will show a set of
                        subject images, as discussed below:
                    </li>

                    <li>
                        The left window show the set of subjects currently{" "}
                        <span style={{ color: "#2e86c1" }}>selected</span>. By default, all the
                        data will be selected, so you will see the full set of subjects that
                        were used in the plot. You can cycle through the pages of subjects with
                        the
                        <span style={{ color: "var(--tertiary)" }}>
                            {" "}
                            <b>&laquo;</b>
                        </span>{" "}
                        and
                        <span style={{ color: "var(--tertiary)" }}>
                            {" "}
                            <b>&raquo;</b>{" "}
                        </span>
                        buttons. To subset the data, you will need to use either the box select
                        or lasso select tool and drag over the plot to select the subjects that
                        you want. On selection, this box will update with the selection.
                    </li>

                    <li>
                        The right window shows the subject(s) that you are currently
                        <span style={{ color: "#922b21" }}> hovering over with a mouse</span>.
                        For histograms, hovering over a bin will turn the bin
                        <span style={{ color: "#922b21" }}> red</span>, and this window will
                        populate with all the subjects within that bin. For scatter plots, the
                        point that you are hovering over will turn{" "}
                        <span style={{ color: "#922b21" }}>red</span>, and the subject
                        associated with that point will be displayed in this window. You can
                        use the hover window to find subjects you are interested in and select
                        those with lasso/box tool to populate the selection box.
                    </li>
                </ol>
            </p>

            <p>
                For both boxes, once you have the subjects that you were interested in, you can
                click the "Export subjects" button to generate a subject export. This will
                generate a CSV file with the subjects within the box. The CSV file will have
                the subject ID, longitude, latitude and perijove of the subject. Furthermore,
                the export will also show Zooniverse-specific information for each subject,
                such as the URL of the image (if you would like to see the corresponding
                image), and the classification/retirement data. Note that the
                classification/retirement information is not real-time and is only updated
                twice a day.
            </p>
        </div>
    );
};

export default MainNav;
