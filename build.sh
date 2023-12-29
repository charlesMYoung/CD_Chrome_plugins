#!/bin/sh

cd app

npm run build

cd ..

cp Changelog.txt ./extension_chrome/

rm -rf extension_chrome/dist

mv app/dist/ extension_chrome/




