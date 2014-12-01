test:
	node_modules/.bin/mocha --require should --reporter spec ./lib/*/test.js

lint:
	node_modules/.bin/jshint lib examples

.PHONY: all test
