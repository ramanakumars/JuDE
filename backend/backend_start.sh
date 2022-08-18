#!/bin/bash

# set the right permissions
chmod +x refresh_subject_data.sh

# start the cron service
cron;

# start the server
gunicorn -c config.py -b :5000 app:app;
