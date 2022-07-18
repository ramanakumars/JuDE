# JuDE (JunoCam Data Explorer)
JuDE is a React/Flask-based web app to explore the [Jovian Vortex Hunter](https://www.zooniverse.org/projects/ramanakumars/jovian-vortex-hunter) data

## Running the production version (via docker)

First, build both containers:
```bash
docker build -f Dockerfile.frontend .
docker build -f Dockerfile.backend .
```

Before running the app, you will need to set up your Zooniverse account 
on the container so that it can download the subject data. The account info 
should be stored in the `PANOPTES_USERNAME` and `PANOPTES_PASSWORD` variables. 

```bash
read -rs PANOPTES_USERNAME
read -rs PANOPTES_PASSWORD

export PANOPTES_USERNAME
export PANOPTES_PASSWORD

```

Finally, start the docker using the `compose` command:
```bash
docker-compose up
```


This will start both the frontend and backend on `localhost:30000`.

## Running the app without docker (for development)

### Installation
This app uses Flask as a backend and React for the frontend. To run the 
app, we need to install the required packages for both. First install node 
(the following instructions are for ubuntu)

```bash
sudo apt update
curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
sudo apt install nodejs npm
```

Then, install the packages for the frontend

```bash
cd frontend/
npm install
```

For the backend:
```bash
sudo apt update
cd ../backend/
pip install -r requirements.txt
```

### Starting the servers

Starting the frontend:
```bash
cd frontend/
npm start
```

Starting the backend:
```bash
cd backend/
./backend_start.sh
```


