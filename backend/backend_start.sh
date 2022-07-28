#!/bin/bash

# set the right permissions
chmod +x refresh_subject_data.sh

# start the cron service
cron;

# download the subject data
python3 download_subject_data.py

# start the server
gunicorn -c config.py -b :5000 app:app --timeout 120;
