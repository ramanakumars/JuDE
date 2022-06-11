from panoptes_client import Panoptes, Project
import os
from astropy.io import ascii
from astropy.io.ascii.core import InconsistentTableError


username = os.environ['PANOPTES_USERNAME']
password = os.environ['PANOPTES_PASSWORD']

Panoptes.connect(username=username, password=password)

project = Project(17032)

print("Getting subject data...")

try:
    export = project.get_export('subjects')

    with open('jvh_subjects.csv', 'w') as out_file:
        out_file.write(export.content.decode('utf-8'))

    ascii.read('jvh_subjects.csv', format='csv')
except InconsistentTableError:
    print("Existing table failed! Re-generating!", flush=True)
    export = project.get_export('subjects', generate=True)

    with open('jvh_subjects.csv', 'w') as out_file:
        out_file.write(export.content.decode('utf-8'))
