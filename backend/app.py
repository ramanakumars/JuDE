from re import sub
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, Response
from panoptes_client import Project, Workflow, Subject, SubjectSet
import subprocess
import json
import ast
import time
import tqdm
import os
import base64
import io
from skimage import io as skio
import numpy as np
import netCDF4 as nc
from astropy.io import ascii
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from flask_cors import CORS, cross_origin
import plotly
import plotly.express as px
import plotly.graph_objects as go

flat   = 0.06487
re     = 71492e3
rp     = re*(1 - flat)
pixres = 25./np.radians(1)

urls = []
lats = []
lons = []
PJs  = []
IDs  = []

plotly_type = {'hist': 'histogram', 'scatter': 'scattergl'}

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "Hello"

#@cross_origin()
@app.route('/get-subject-info/<subject_id>', methods=['GET','POST'])
def get_subject_info(subject_id):
    print(subject_id)
    try:
        subject   = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    url = subject.raw['locations'][0]['image/png']
    lat = float(subject.metadata['latitude'])
    PJ  = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    response = Response(json.dumps({'subject_id': subject_id, 'subject_url': url, 
                                    'latitude': lat, 'longitude': lon, 'PJ': PJ}))
    print('done')
    return response

@app.route('/get-context-image/<subject_id>', methods=['GET'])
def get_context_image(subject_id):
    try:
        subject   = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    lat = float(subject.metadata['latitude'])
    PJ  = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # get the image subset and new lat/lon
    PJ_nc = f'../../projects/junocam/junodata/PJ{PJ}/nc/multi_proj_raw.nc'

    with nc.Dataset(PJ_nc, 'r') as dset:

        lon_rot = dset.lon_rot

        img  = dset.variables['img_corr']
        lats = dset.variables['lat'][:]
        lons = dset.variables['lon'][:]

        lat_mask = (lats>lat-20)&(lats<lat+20)
        lon_mask = (lons>lon-30)&(lons<lon+30)

        img_sub = img[lat_mask,lon_mask,:]
    lon_sub = lons[lon_mask]
    lat_sub = lats[lat_mask]

    # find the physical extents again for this image
    LON, LAT = np.meshgrid(lon_sub, lat_sub)

    rln = re/np.sqrt( 1. + ((rp/re)*np.tan(np.radians(LAT)))**2. )
    rlt = rln/(np.cos(np.radians(LAT))*((np.sin(np.radians(LAT)))**2. + 
                                        ((re/rp)*np.cos(np.radians(LAT)))**2.))
    
    dX = rln*np.abs(np.radians(LON - lon))
    dY = rlt*np.abs(np.radians(LAT - lat))

    dX[dY>3.5e6] = 1.e20
    dY[dX>3.5e6] = 1.e20

    img_c_x = img_sub.shape[1]/2
    img_c_y = img_sub.shape[0]/2

    # plot out the image and bounding box
    fig, ax = plt.subplots(1,1,dpi=50,facecolor='black')
    ax.imshow(img_sub, origin='lower', extent=(lon_sub.min(), lon_sub.max(), lat_sub.min(), lat_sub.max()))
    c1 = ax.contour(lon_sub, lat_sub, np.abs(dX), [3.5e6], colors='k', linewidths=0.75)
    c2 = ax.contour(lon_sub, lat_sub, np.abs(dY), [3.5e6], colors='k', linewidths=0.75)

    c1vert0 = c1.collections[0].get_paths()[0].vertices
    #c1vert1 = c1.collections[0].get_paths()[1].vertices
    c2vert0 = c2.collections[0].get_paths()[0].vertices
    #c2vert1 = c2.collections[0].get_paths()[1].vertices

    plt.close()

    fig = px.imshow(img_sub, x=lon_sub, y=lat_sub,
                    labels={'x':'longitude', 'y': 'latitude'}, 
                    origin='lower', aspect='equal')
    fig.update_traces(hovertemplate='lon: %{x:4.2f}&deg;<br>lat: %{y:4.2f}&deg;', name='')

    fig.add_trace(go.Scattergl(x=c1vert0[:,0], y=c1vert0[:,1], 
                               line=(dict(width=5, color='black')), hoverinfo='skip'))
    fig.add_trace(go.Scattergl(x=c2vert0[:,0], y=c2vert0[:,1], 
                               line=(dict(width=5, color='black')), hoverinfo='skip'))

    fig.update_layout(coloraxis_showscale=False)
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showticklabels=False)
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), 
                      autosize=True, 
                      paper_bgcolor='white')
    fig.update(layout_showlegend=False)
    fig.update_yaxes(range=[lat-10,lat+10], autorange=False)
    fig.update_xaxes(range=[lon-15,lon+15], autorange=False)
    fig.update_xaxes(automargin=True)
    
    print('done')
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)#Response(json.dumps({"url": plot_url}))
    #return Response(json.dumps({"url": plot_url}))


@app.route('/get-global-image/<subject_id>', methods=['GET'])
def get_mosaic_image(subject_id):
    try:
        subject   = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    lat = float(subject.metadata['latitude'])
    PJ  = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # plot out the image and bounding box
    '''
    fig, ax = plt.subplots(1,1,dpi=300,facecolor='black')
    img_globe = plt.imread(f'../../projects/junocam/junodata/PJ{PJ}/globe_mosaic.png')
    ax.imshow(img_globe, extent=(-180, 180, -90, 90))
    #ax.scatter(sub_lons, sub_lats, s=0.5, color='k', marker='o')
    ax.plot(lon, lat, 'kx', markersize=8)
    ax.set_xlim(-180, 180)
    ax.set_ylim(-90, 90)
    ax.axis('off')
    plt.tight_layout(pad=0)
    plt.subplots_adjust(top = 1, bottom = 0, right = 1, left = 0, 
            hspace = 0, wspace = 0)
    plt.margins(0,0)

    # save the output as a BytesIO object
    output = io.BytesIO()
    plt.savefig(output, bbox_inches='tight', pad_inches=0)
    plot_url = base64.b64encode(output.getvalue()).decode('utf8')
    plt.close()
    '''

    img_globe = skio.imread(f'../../projects/junocam/junodata/PJ{PJ}/globe_mosaic.png')


    x = np.linspace(-180, 180, img_globe.shape[1])
    y = np.linspace(-90, 90, img_globe.shape[0])

    layout = go.Layout(
        autosize=False,
        margin=go.Margin(
            l=0,
            r=0,
            b=0,
            t=0,
            pad=0
        ),
        paper_bgcolor= 'black',
        plot_bgcolor= 'black',
    )
    fig = px.imshow(img_globe[::-1,:], x=x, y=y,
                    labels={'x':'longitude', 'y': 'latitude'}, 
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

    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)#Response(json.dumps({"url": plot_url}))

def get_subjects_in_frame(lon, lat, PJ):

    with nc.Dataset('../projects/junocam/junodata/segments_20220419_384.nc', 'r') as dset:
        lats = dset.variables['lat'][:]
        lons = dset.variables['lon'][:]
        PJs  = dset.variables['PJ'][:]

    lat_mask = (lats>lat-10)&(lats<lat+10)&(lats!=lat)
    lon_mask = (lons>lon-15)&(lons<lon+15)&(lons!=lon)

    mask = lat_mask&lon_mask&(PJs==PJ)

    return lats[mask], lons[mask]

@app.route('/plot-exploration/', methods=['POST'])
def create_plot():
    print(request.json)
    if request.method=='POST':
        plot_type      = request.json['plot_type']
        if plot_type not in ['scatter']:
            metadata_key   = request.json['x']
        else:
            meta_x = request.json['x']
            meta_y = request.json['y']


    layout = {}
    if plot_type not in ['scatter']:
        layout['xaxis'] = {'title': metadata_key}

        if metadata_key=='latitude':
            values = lats.tolist()
        elif metadata_key=='longitude':
            values = lons.tolist()
        elif metadata_key=='perijove':
            values = PJs.tolist()

        output = {'x': values, 'type': plotly_type[plot_type]}
    else:
        layout['xaxis'] = {'title': meta_x}
        layout['yaxis'] = {'title': meta_y}
        
        if meta_x=='latitude':
            x = lats.tolist()
        elif meta_x=='longitude':
            x = lons.tolist()
        elif meta_x=='perijove':
            x = PJs.tolist()
        
        if meta_y=='latitude':
            y = lats.tolist()
        elif meta_y=='longitude':
            y = lons.tolist()
        elif meta_y=='perijove':
            y = PJs.tolist()

        output = {'x': x, 'y': y, 'mode': 'markers', 'type': plotly_type[plot_type]}


    return json.dumps({'data': output, 'layout': layout, 'subject_urls': urls.tolist(), 
                       'lats': lats.tolist(), 'lons': lons.tolist(), 'PJs': PJs.tolist(), "IDs": IDs.tolist()})

@app.route('/get-random-images/', methods=['POST'])
def get_rand_imgs():
    print(request.json)
    if request.method=='POST':
        n_images = request.json['n_images']

    idxs = np.random.randint(0, len(lats), (n_images,))

    sub_lats = lats[idxs].tolist()
    sub_lons = lons[idxs].tolist()
    sub_urls = urls[idxs].tolist()
    sub_PJs  = PJs[idxs].tolist()
    sub_IDs  = IDs[idxs].tolist()

    return json.dumps({'lons': sub_lons, 'lats': sub_lats, 'IDs': sub_IDs, 
                       'PJs': sub_PJs, 'urls': sub_urls})

# prepare the subject data
subject_data = ascii.read('jvh_subjects.csv', format='csv')

for subject in tqdm.tqdm(subject_data):
    try:
        meta = ast.literal_eval(subject['metadata'])
        lons.append(float(meta['longitude']))
        lats.append(float(meta['latitude']))
        PJs.append(int(meta['perijove']))
        urls.append(ast.literal_eval(subject['locations'])["0"])
        IDs.append(int(subject['subject_id']))
    except KeyError as e:
        continue

lons = np.asarray(lons)
lats = np.asarray(lats)
PJs  = np.asarray(PJs)
urls = np.asarray(urls)
IDs  = np.asarray(IDs)


if __name__=='__main__':
    app.run(debug=True, port=5500)
    
