import React from "react";
import LoadingPage from "../util/LoadingPage.js";
import SubjectImage from '../subject/SubjectImage.js'


export default class SubjectImages extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        var nmax = 16;

        this.state = {
            variables: props.variables,
            n_vars: props.variables.length,
            subject_data: props.subject_data,
            render_type: props.render_type,
            page: 0,
            nimages: nmax
        };

        this.prevPage = this.prevPage.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.getExport = this.getExport.bind(this);

        this.loading_page = React.createRef();
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
        if (this.state.page < this.npages - 1) {
            this.setState({ page: this.state.page + 1 });
        }
        return false;
    }

    getExport() {
		var postdata = { subject_IDs: this.state.subject_data.map((data) => data.subject_ID) };

        this.loading_page.current.enable();

        // send to the backend
        fetch("/backend/create-export/", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            // the input/output are in JSON format
            body: JSON.stringify(postdata),
        })
            .then((result) => result.json())
            .then((data) => {
                if (!data.error) {
                    // create a link holding the file download
                    const element = document.createElement("a");

                    // save the file blob
                    const file = new Blob([data.filedata], {
                        type: "text/csv",
                    });

                    // save the link attributes
                    element.href = URL.createObjectURL(file);
                    element.download = "subject_export.csv";

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
        if (this.state.subject_data == null) {
            return null;
        }

		this.npages = Math.ceil(this.state.subject_data.length / this.state.nimages);

        var subject_data = [];

        const startind = this.state.page * this.state.nimages;

        for (
            var i = startind;
            i < Math.min(this.state.subject_data.length, startind + this.state.nimages);
            i++
        ) {
            subject_data.push({
                idx: i,
                url: this.state.subject_data[i].url,
                subject_ID: this.state.subject_data[i].subject_ID,
                longitude: this.state.subject_data[i].longitude,
                latitude: this.state.subject_data[i].latitude,
                perijove: this.state.subject_data[i].perijove
            });
        }

        var style = {};

        if (this.state.subject_data.length < 1) {
            return null;
        }

        var rand_key = Math.random();

        return (
            <div
                key={rand_key}
                className={
                    "subject-images-container subject-images-container-" +
                    this.state.render_type
                }
            >
                <div className="image-page">
                    <button onClick={this.prevPage}>&laquo;</button>
                    {this.state.page + 1} / {this.npages}
                    <button onClick={this.nextPage}>&raquo;</button>
                </div>
                {subject_data.map(data => (
                    <SubjectImage
                        key={data.subject_ID + "_" + this.state.render_type}
                        url={data.url}
						metadata={data}
                        style={style}
                    />
                ))}

                <div className="subject-export-container">
                    <button onClick={this.getExport}>Export subjects</button>
                </div>
                <LoadingPage ref={this.loading_page} enable={false} />
            </div>
        );
    }
}

