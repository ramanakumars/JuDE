# JuDE (JunoCam Data Explorer)
JuDE is a React/Flask-based web app to explore the [Jovian Vortex Hunter](https://www.zooniverse.org/projects/ramanakumars/jovian-vortex-hunter) data

## Building and running the docker container

Before starting the docker container, you will need to provide your Zooniverse username and password to the container, so that the updated subject data can be downloaded. This will be provided via two files (`panoptes_username` and `panoptes_password`):
```bash
echo [your zooniverse username] >> panoptes_username
echo [your zooniverse password] >> panoptes_password
```

Next, copy the SSL certificates (for the production version) to the repo main folder. This includes the certificate (`fullchain.pem`) and the private key (`privkey.pem`)

Finally, start the docker using the `compose` command (from the main repo folder):
```bash
docker-compose build
docker-compose up
```

This will start both the frontend and backend on `localhost` (port 443). The backend will download the subject data from Panoptes, which will take time, so wait until you see the backend `gunicorn` server spin up.
