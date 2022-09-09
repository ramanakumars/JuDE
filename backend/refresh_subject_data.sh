#!/bin/bash

currtime=$(date);
echo "Getting new data at ${currtime}";

/usr/local/bin/python3 /app/download_subject_data.py;

curl http://localhost:5000/backend/refresh-vortex-list/;

echo "----------------------------------------------";
