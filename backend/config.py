import os
import yaml
from app import generate_new_vortex_export

worker_class = 'sync'
worker_connections = 100
timeout = 30
keepalive = 2

def on_starting(worker):
    if not os.path.exists('/root/.panoptes'):
        os.mkdir('/root/.panoptes')

    with open('/root/.panoptes/config.yml','w') as f:
        with open('/run/secrets/panoptes_username') as ufile:
            username = ufile.read().strip()
        with open('/run/secrets/panoptes_password') as pfile:
            password = pfile.read().strip()
        config = {'endpoint': 'https://www.zooniverse.org', 'username': username, 'password': password}

        yaml.dump(config, f, default_flow_style=False)

