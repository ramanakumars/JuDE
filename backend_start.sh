#!/bin/bash

gunicorn -b :5000 app:app
