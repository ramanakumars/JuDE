from panoptes_client import Panoptes, Project
from panoptes_client.panoptes import PanoptesAPIException
import os
from astropy.io import ascii
from astropy.io.ascii.core import InconsistentTableError

with open('/run/secrets/panoptes_username') as ufile:
    username = ufile.read().strip()
with open('/run/secrets/panoptes_password') as pfile:
    password = pfile.read().strip()

Panoptes.connect(username=username, password=password)

project = Project(17032)

export = project.get_export('subjects', generate=True)

with open('jvh_subjects.csv', 'w') as out_file:
    out_file.write(export.content.decode('utf-8'))
