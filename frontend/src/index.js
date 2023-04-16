import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./css/main.css";
import "./css/explorer.css";
import "./css/subject.css";
import "./css/nav.css";
import "./css/index.css";
import Subject from "./subject/Subject.js";
import Explorer from "./explorer/Explorer.js";
import SubjectImage from "./subject/SubjectImage.js";
import MainNav from "./util/Nav.js";

import scatter from "./images/scatter.png";
import hist from "./images/hist.png";
import tutorial from "./images/tutorial_jude.png";
import subject_viewer from "./images/subject_viewer.png";

import ReactGA from "react-ga4";

const root = ReactDOM.createRoot(document.getElementById("root"));

function SubjectApp() {
    const params = useParams();

    return <Subject subject_id={params.id} />;
}

function ExplorerApp() {
    return <Explorer />;
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
			nimages: 8,
			subject_data: []
		};
    }

    async componentDidMount() {
        var data = { n_images: this.state.nimages };

        await fetch("/backend/get-random-images/", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify(data),
        })
            .then((result) => result.json())
            .then((data) => {
                this.setState({
					subject_data: data.subject_data
                });
            });
    }

    render() {
        return (
            <article id="main">
                <MainNav />
                <section id="index">
                    <section id="hero">
                        <h1>Welcome to JuDE (JunoCam Data Explorer)!</h1>
                        <section id="mosaic-images">
                            {this.state.subject_data.map((d) => (
                                <SubjectImage
                                    key={d.subject_ID + "_mosaic"}
									metadata={d}
									url={d.url}
                                    style={{}}
                                />
                            ))}
                        </section>
                        <p>
                            This is a webtool to explore the data associated with the{" "}
                            <a href="https://zooniverse.org/projects/ramanakumars/jovian-vortex-hunter">
                                Jovian Vortex Hunter
                            </a>{" "}
                            project. You can browse and filter the subjects by latitude,
                            longitude and perijove by clicking{" "}
                            <a href="/explore/">explore data</a> above. You can also view more
                            information about a subject by clicking on any of the subject
                            images.
                        </p>
                    </section>
                    <section id="desc">
                        <h2>Data plotting and exploration</h2>
                        <p>
                            The exploration tool allows you to plot the distribution of subject
                            metadata (i.e., the latitude, longitude and perijove info) and view
                            how each piece of information affects the type of features shown in
                            the subject. There are currently two types of plots you can
                            generate:
                        </p>

                        <ul>
                            <li>
                                <b>Scatter plots</b>: With this, you can create a plot of one
                                metadata key against the other. For example, you can see the
                                locations of all the subjects by plotting latitude against
                                longitude.
                            </li>
                            <img src={scatter} alt="Example of a scatter plot"/>
                            <li>
                                <b>Histogram</b>: The histogram allows you to see how many
                                subjects correspond to a given range of values. For examples,
                                plotting a histogram of perijoves shows you how many images are
                                taken from each perijove.
                            </li>
                            <img src={hist} alt="Example of a histogram"/>
                        </ul>

                        <p>
                            In both plots, hovering over each plot element shows a preview of
                            the corresponding subject(s) on the bottom right. You can use the
                            lasso or box selection tool to filter the subjects shown in the
                            bottom left box.
                        </p>

                        <img src={tutorial} alt="Tutorial to show how hover state works"/>

                        <h2>Subject specific information</h2>

                        <p>
                            Clicking on a subject will open a detailed page about that image,
                            showing the location of the image in the context of the global
                            image taken by JunoCam during that perijove pass. You will also see
                            a zoomed out of the region around the subject to provide context to
                            the features seen in the subject.
                        </p>

                        <img src={subject_viewer} alt="Example of a subject specific page"/>
                    </section>
                </section>
            </article>
        );
    }
}

const App = () => {
    useEffect(() => {
        ReactGA.initialize("G-CS6MJNR2FM");
        ReactGA.send({
            hitType: "pageview",
            page: window.location.pathname + window.location.search,
        });
    }, []);

    return (
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={<Home />} />
                    <Route exact path="/explore" element={<ExplorerApp />} />
                    <Route exact path="/subject/:id" element={<SubjectApp />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
};

root.render(<App />);
