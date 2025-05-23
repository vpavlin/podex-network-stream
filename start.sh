#!/bin/sh

docker compose up -d

echo -n "Waiting for Podex to start..."
while ! curl localhost:8082 2> /dev/null > /dev/null ; do
    echo -n "."
    sleep 1
done

echo

xdg-open http://localhost:8082