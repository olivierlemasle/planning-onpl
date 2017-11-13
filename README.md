# planning-onpl

https://planning-onpl.appspot.com/

## Build and deploy

Add `client_secrets.json` in `src/main/resources/`.

Then:

```
cd src/main/ui
npm install
npm run-script build
cd ../../..
mvn clean appengine:deploy
```
