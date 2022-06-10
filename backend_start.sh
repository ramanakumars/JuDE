#!/bin/bash

python3 download_subject_data.py

gunicorn -b :5000 app:app
