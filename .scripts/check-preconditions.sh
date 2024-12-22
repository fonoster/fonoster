#!/bin/bash

# pretest script: Need .env file
if [ ! -f .env ]; then
  echo "Error: .env file is missing. Run 'cp .env.example.dev .env' at the root of the project and try again."
  exit 1
fi
