# JuDE (JunoCam Data Explorer)
JuDE is a React/Flask-based web app to explore the [Jovian Vortex Hunter](https://www.zooniverse.org/projects/ramanakumars/jovian-vortex-hunter) data

## Building and running the docker container

First, build both containers:
```bash
docker build -f Dockerfile.frontend .
docker build -f Dockerfile.backend .
```

Before running the app, you will need to download the subject data using the Panoptes client. You can install
it using:
```
python3 -m pip install panoptescli
```

Configure your Zooniverse account:
```
panoptes configure
```

And then download the subject data:
```
cd backend/
panoptes project download --generate --data-type subjects 17032 jvh_subjects.csv
```

Finally, start the docker using the `compose` command (from the main repo folder):
```bash
docker-compose up
```

This will start both the frontend and backend on `localhost:30000`.
