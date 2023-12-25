#!/bin/sh

cd app

npm run build

rm -rf ../extension_chrome/dist

mv dist/ ../extension_chrome/

