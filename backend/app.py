import matplotlib.pyplot as plt
from flask import Flask, request, Response
from panoptes_client import Subject
import json
import ast
import tqdm
import io
import datetime
import sys
import numpy as np
from astropy.io import ascii
from astropy.table import Table
from flask_cors import CORS
import plotly
import plotly.express as px
import plotly.graph_objects as go


# jupiter's parameters for projection
flat = 0.06487
re = 71492e3
rp = re*(1 - flat)
pixres = 25./np.radians(1)

# create a copy of the variables
# for local usage so we don't have
# to lock all the time
urls = []
lats = []
lons = []
PJs = []
IDs = []

plotly_type = {'hist': 'histogram', 'scatter': 'scattergl'}

app = Flask(__name__)
CORS(app)


@app.route('/backend/get-subject-info/<subject_id>', methods=['GET', 'POST'])
def get_subject_info(subject_id):
    '''
        Retrieve the metadata information for a given subject
    '''
    try:
        # check if the subject exists in the subject set
        subject = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    # get the relevant metadata (including the image for the subject)
    url = subject.raw['locations'][0]['image/png']
    lat = float(subject.metadata['latitude'])
    PJ = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # send the keys back as a response
    response = Response(json.dumps({'subject_id': subject_id,
                                    'subject_url': url,
                                    'latitude': lat,
                                    'longitude': lon,
                                    'PJ': PJ}))
    return response


@app.route('/backend/get-context-image/<subject_id>', methods=['GET'])
def get_context_image(subject_id):
    '''
        Creates a Plotly plot that shows the location of the subject
        in the main mosaic
    '''
    try:
        subject = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    # read in the location of the subject
    lat = float(subject.metadata['latitude'])
    PJ = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # load the subject image
    img = plt.imread(f'PJ{PJ}/globe_mosaic_highres.png')[::-1, :, :3]

    # roll the longitude axis so that the subject
    # is in the center of the mosaic
    nroll = int(lon*25)
    lon0 = lon - nroll/25.

    # create a grid of lat/lon values so that
    # we can draw a contour of lat/lon showing the subject
    # edges
    lons = np.linspace(-180, 180, 9000)
    lats = np.linspace(-90, 90, 4500)

    # subset the image (to speed up processing)
    lat_mask = (lats > lat-25) & (lats < lat+25)
    img_roll = np.roll(img[lat_mask, :, :], -nroll, axis=1)

    lon_mask = (lons > lon0-25) & (lons < lon0+25)
    img_sub = img_roll[:, lon_mask, :]

    # get the subset of the grid
    lon_sub = lons[lon_mask]
    lat_sub = lats[lat_mask]

    # find the physical extents again for this image
    LON, LAT = np.meshgrid(lon_sub, lat_sub)

    rln = re/np.sqrt(1. + ((rp/re)*np.tan(np.radians(LAT)))**2.)
    rlt = rln/(np.cos(np.radians(LAT))*((np.sin(np.radians(LAT)))**2. +
                                        ((re/rp)*np.cos(np.radians(LAT)))**2.))

    dX = rln*np.abs(np.radians(LON - lon0))
    dY = rlt*np.abs(np.radians(LAT - lat))

    # we don't care about the parts of the image
    # outside the subject (for the purpose of drawing the contour)
    dX[dY > 3.5e6] = 1.e20
    dY[dX > 3.5e6] = 1.e20

    # plot out the image and bounding box
    fig, ax = plt.subplots(1, 1, dpi=50, facecolor='black')
    c1 = ax.contour(lon_sub, lat_sub, np.abs(dX), [3.5e6])
    c2 = ax.contour(lon_sub, lat_sub, np.abs(dY), [3.5e6])

    # get the subject bounds contour path
    c1vert0 = c1.collections[0].get_paths()[0].vertices
    c2vert0 = c2.collections[0].get_paths()[0].vertices

    plt.close()

    # rotate the mosaic back to the original axis
    lon_sub = lon_sub + nroll/25.
    lon_sub[lon_sub > 180] -= 360.

    # same for the contour vertices
    c1vert0x = c1vert0[:, 0] + nroll/25.
    c1vert0x[c1vert0x > 180.] -= 360.

    c2vert0x = c2vert0[:, 0] + nroll/25.
    c2vert0x[c2vert0x > 180.] -= 360.

    # plot all this in plotly and send it to the frontend
    fig = px.imshow(img_sub, x=lon_sub, y=lat_sub,
                    labels={'x': 'longitude', 'y': 'latitude'},
                    origin='lower', aspect='equal')
    fig.update_traces(
        hovertemplate='lon: %{x:4.2f}&deg;<br>lat: %{y:4.2f}&deg;', name='')

    fig.add_trace(go.Scattergl(x=c1vert0x, y=c1vert0[:, 1],
                               line=(dict(width=5, color='black')),
                               hoverinfo='skip'))
    fig.add_trace(go.Scattergl(x=c2vert0x, y=c2vert0[:, 1],
                               line=(dict(width=5, color='black')),
                               hoverinfo='skip'))

    fig.update_layout(coloraxis_showscale=False)
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showticklabels=False)
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0),
                      autosize=True,
                      paper_bgcolor='white')
    fig.update(layout_showlegend=False)
    fig.update_yaxes(range=[lat-10, lat+10], autorange=False)
    fig.update_xaxes(range=[lon-15, lon+15], autorange=False)

    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)


@app.route('/backend/get-global-image/<subject_id>', methods=['GET'])
def get_mosaic_image(subject_id):
    '''
        Creates a small static plot with a 'x' marking the location of the
        subject in the main mosaic
    '''
    try:
        subject = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    lat = float(subject.metadata['latitude'])
    PJ = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # plot out the image and bounding box
    img_globe = plt.imread(f'PJ{PJ}/globe_mosaic.png')[:, :, :3]

    x = np.linspace(-180, 180, img_globe.shape[1])
    y = np.linspace(-90, 90, img_globe.shape[0])

    # plot out the mosaic with the center of the subject
    # as an 'X'
    fig = px.imshow(img_globe[::-1, :], x=x, y=y,
                    labels={'x': 'longitude', 'y': 'latitude'},
                    origin='lower', aspect='equal')

    fig.add_trace(go.Scatter(x=[lon], y=[lat], name='Subject location',
                             mode="markers", marker_symbol='x',
                             marker=dict(size=[25], color=['black'])
                             ))
    fig.update_layout(
        font_color="white",
    )
    fig.update_layout(coloraxis_showscale=False)
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showticklabels=False)
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0))
    fig.update_layout(paper_bgcolor='#008080')
    fig.update_layout(hovermode=False)
    fig.update_yaxes(automargin=True)

    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)


@app.route('/backend/plot-exploration/', methods=['POST'])
def create_plot():
    '''
        Creates a Plotly plot with the requested variables and plot type
    '''
    if request.method == 'POST':
        # get the type of plot requested (currently hist/scatter)
        plot_type = request.json['plot_type']
        if plot_type not in ['scatter']:
            metadata_key = request.json['x']
        else:
            meta_x = request.json['x']
            meta_y = request.json['y']

    layout = {}
    if plot_type == 'hist':
        # for histogram, there is only one axis
        layout['xaxis'] = {'title': metadata_key}

        # create custom bins for each variable key
        # knowing what the axis extents are
        if metadata_key == 'latitude':
            values = lats.tolist()
            bins = np.arange(-70, 70, 5).tolist()

        elif metadata_key == 'longitude':
            values = lons.tolist()
            bins = np.arange(-180, 180, 10).tolist()

        elif metadata_key == 'perijove':
            values = PJs.tolist()
            bins = np.arange(13, 36, 1).tolist()

        # create the data output for the frontend to plot this out
        output = {'x': values, 'type': plotly_type[plot_type],
                  'xbins': {'start': min(bins), 'end': max(bins),
                            'size': (bins[1] - bins[0])},
                  'nbinsx': len(bins),
                  'marker': {'color': ['#2e86c1']*len(bins)}}
    elif plot_type == 'scatter':
        # repeat for scatter, but now there are two variables
        layout['xaxis'] = {'title': meta_x}
        layout['yaxis'] = {'title': meta_y}

        if meta_x == 'latitude':
            x = lats.tolist()
        elif meta_x == 'longitude':
            x = lons.tolist()
        elif meta_x == 'perijove':
            x = PJs.tolist()

        if meta_y == 'latitude':
            y = lats.tolist()
        elif meta_y == 'longitude':
            y = lons.tolist()
        elif meta_y == 'perijove':
            y = PJs.tolist()

        output = {'x': x, 'y': y, 'mode': 'markers',
                  'type': plotly_type[plot_type],
                  'marker': {'color': ['dodgerblue']*len(x)}
                  }

    with open('is_vortex.json', 'r') as infile:
        is_vortex = json.load(infile)

    return json.dumps({'data': output, 'layout': layout,
                       'subject_urls': urls.tolist(),
                       'lats': lats.tolist(), 'lons': lons.tolist(),
                       'PJs': PJs.tolist(),
                       "IDs": IDs.tolist(), "is_vortex": is_vortex})


@app.route('/backend/get-random-images/', methods=['POST'])
def get_rand_imgs():
    '''
        For the main page -- retrieves a set of random `n_images`
        number of images to display
    '''
    if request.method == 'POST':
        n_images = request.json['n_images']

    idxs = np.random.randint(0, len(lats), (n_images,))

    sub_lats = lats[idxs].tolist()
    sub_lons = lons[idxs].tolist()
    sub_urls = urls[idxs].tolist()
    sub_PJs = PJs[idxs].tolist()
    sub_IDs = IDs[idxs].tolist()

    return json.dumps({'lons': sub_lons, 'lats': sub_lats, 'IDs': sub_IDs,
                       'PJs': sub_PJs, 'urls': sub_urls})


@app.route('/backend/create-export/', methods=['POST'])
def create_export():
    '''
        Generate a subject export based on the requested
        `subject_IDs` from the POST request
    '''
    if request.method == 'POST':
        # get the set of subject IDs
        subjects = request.json['subject_IDs']
    else:
        return json.dumps({'error': 'error! request failed'})

    # open the subject data CSV
    subject_data = ascii.read('jvh_subjects.csv', format='csv')

    # create a clone of the table that we can fill in
    export_table = Table(names=('subject_id', 'latitude', 'longitude',
                                'perijove', 'location',
                                'classification_count', 'retired_at',
                                'retirement_reason'),
                         dtype=('i8', 'f8', 'f8', 'i8', 'U40', 'i8',
                                'U40', 'U40'))

    # for each requested subject, add the metadata from the CSV file
    for subject_id in subjects:
        datai = subject_data[(subject_data['subject_id'] == subject_id) & (
            subject_data['subject_set_id'] != 105808)]
        for row in datai:
            meta = ast.literal_eval(row[4])

            latitude = float(meta['latitude'])
            longitude = float(meta['longitude'])
            perijove = int(meta['perijove'])

            location = ast.literal_eval(row[5])["0"]

            export_table.add_row([row[0], latitude, longitude, perijove,
                                  location, row[6], row[7], row[8]])

    # save it out to CSV-like string so we can send it to the frontend
    # to package it and submit for download
    outfile = io.StringIO()
    export_table.write(outfile, format='csv')
    output = outfile.getvalue()

    return json.dumps({'filedata': output})


def generate_new_vortex_export():
    '''
        Automated job that refreshes the subject data to
        get the new list of vortices
    '''
    global lons, lats, PJs, urls, IDs

    urls_loc = []
    lats_loc = []
    lons_loc = []
    PJs_loc = []
    IDs_loc = []

    # prepare the subject data
    subject_data = ascii.read('jvh_subjects.csv', format='csv')

    subject_ID_list = np.asarray(subject_data['subject_id'])
    subject_IDs = np.unique(subject_data['subject_id'])

    for subject_id in tqdm.tqdm(subject_IDs):
        try:
            datai = subject_data[np.where(subject_ID_list == subject_id)[0]]

            meta = ast.literal_eval(datai['metadata'][0])
            lons_loc.append(float(meta['longitude']))
            lats_loc.append(float(meta['latitude']))
            PJs_loc.append(int(meta['perijove']))
            urls_loc.append(ast.literal_eval(datai['locations'][0])["0"])
            IDs_loc.append(int(subject_id))
        except KeyError:
            continue

    IDs = np.asarray(IDs_loc)
    lons = np.asarray(lons_loc)
    lats = np.asarray(lats_loc)
    PJs = np.asarray(PJs_loc)
    urls = np.asarray(urls_loc)

    print(f"Done {datetime.datetime.now()}", file=sys.stderr)

    return "Done"


@app.route('/backend/refresh-vortex-list/', methods=['GET'])
def update_vortex_list():
    is_vortex = np.asarray([False]*len(lons))
    # prepare the subject data
    subject_data = ascii.read('jvh_subjects.csv', format='csv')

    subject_data = subject_data[subject_data['subject_set_id'] == 105808]

    subject_ID_list = np.asarray(subject_data['subject_id'])
    subject_IDs = np.unique(subject_ID_list)

    for subject in tqdm.tqdm(subject_IDs, desc='Updating vortex info'):
        is_vortex[np.where(IDs == subject)[0]] = True

    with open('is_vortex.json', 'w') as outfile:
        json.dump(is_vortex.tolist(), outfile)

    return f"Done at {datetime.datetime.now()}"


# refresh the subject list on startup
generate_new_vortex_export()

update_vortex_list()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
