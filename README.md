# precognitiveemail

This is a code challenge test to create a tracking pixel API using nodejs.

TODO
- flesh out readme
- revise architexture diagram
- include more tests so to include the middleware path

Instructions

After install dependencies:

If you desire, you can change the default environmental config files(default.json) that set mongdob
url, ports, express server address, etc.

Right now it assumes you have a local mongodb and the express server api address is mine. Should change if running locally(locahost is fine)

npm run start: starts app server

npm run test: runs mocha tests for api with stub data for requests/responses

API Paths:

/gettracker/:email - returns tracking pixel in html string format for provided email address that user wants to track; include in future emails
but it's easier to just load the the image source via browser if you want to see it work. Will send response with requested data per doc specs

Note: the console.log on the server will show the current state of the email being tracked as well. 

