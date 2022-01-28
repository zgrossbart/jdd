#!/bin/sh

php-fpm7
sleep 1
nginx -g "daemon off;"
