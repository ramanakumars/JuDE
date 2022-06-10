from panoptes_client import Panoptes, Project
import os

username = os.environ['PANOPTES_USERNAME']
password = os.environ['PANOPTES_PASSWORD']

Panoptes.connect(username=username, password=password)

project = Project(17032)

print("Getting subject data...")
export = project.get_export('subjects', generate=True)

with open('jvh_subjects.csv', 'w') as out_file:
    out_file.write(export.content.decode('utf-8'))
