from panoptes_client import Panoptes, Project

with open('/run/secrets/panoptes_username') as ufile:
    username = ufile.read().strip()
with open('/run/secrets/panoptes_password') as pfile:
    password = pfile.read().strip()

client = Panoptes.connect(username=username, password=password)

project = Project(17032)

with client:
    export = project.get_export('subjects', generate=True)

with open('jvh_subjects.csv', 'w') as out_file:
    out_file.write(export.content.decode('utf-8'))
