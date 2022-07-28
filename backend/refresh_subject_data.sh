#!/bin/bash

currtime=$(date);
echo "Getting new data at ${currtime}";

python3 download_subject_data.py;

curl http://localhost:5000/backend/refresh-vortex-list/;
