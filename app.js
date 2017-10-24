const express = require('express');
const nocache = require('nocache');
const device = require('express-device');
const mongo = require('mongodb').MongoClient;
const randomstring = require("randomstring");
const config = require('config');

const app = express();

// environmental variables loaded via config - set in config/default.json
const url = config.get('url');
const localPort = config.get('localPort');
const dbUrl = config.get('dbUrl');
const dbPort = config.get('dbPort');
const dbName = config.get('dbName');

//original device opened
let originalDevice = '';
// we should be not be caching our image since we want tracking everytime email is opened
app.use(nocache());
// capture user device
app.use(device.capture());
app.listen(5100);

// our middleware intercepts any request to check if it has 
// tracking pxl query params and puts relevant device data into database to relevant tracking pixel doc
app.use((req, res, next) => {
    console.log('request coming through');
    // check for trackking pixel
    if (req.query.pxl) {
        console.log(req.query.pxl);
        let setDetails = {
            'ip': req.ip,
            'device': req.device.type,
            'timeStamp': new Date()
        };
        // connect to mongdb and update data for tracking pixel doc
        mongo.connect(`mongodb://${dbUrl}:${dbPort}/${dbName}`, (err, db) => {
            if (err) {
                console.log(err);
            } else {
                db.collection('precogdocs').findOneAndUpdate({
                    "trackingPixel": req.query.pxl
                }, {
                    $set: setDetails,
                    $inc: {
                        'count': 1
                    }
                }, {
                    'returnNewDocument': true,
                    'upsert': true
                }, ((err, doc) => {
                    if (err) {
                        console.log(err);
                    }
                    // check if original device has been set, originally
                    // did this via mongoDb with $setOnInsert but it did not work
                    // when doc was already inserted during get tracking pixel
                    if (originalDevice === '') {
                        originalDevice = req.device.type;
                        doc.value.originalDevice = req.device.type;
                    }
                    // if device changed, set status which we will return to user and console.log
                    if (originalDevice !== req.device.type ) {
                        doc.value.deviceChangedOnReOpen = true;
                    } else {
                        doc.value.deviceChangedOnReOpen = false;
                    }
                    // This is the part where we would send email but instead log out data
                    let allData = Object.assign(doc.value, setDetails);
                    // log data out to server in lieu of email
                    console.log(allData);
                    // close connection
                    db.close();
                    // send all relevant and requested data back to user about tracking
                    res.send(allData);
                }));
             
            }
        });

    } else {
        // no tracking pxl found in query params so continue. 
        next();
    }
});

// Now host our static directory
app.use(express.static('./'));

// get tracking code via this path; merely visit the image link to trigger the above middleware
app.get('/gettracker/:email', (req, res) => {
    if (req.params.email) {
        console.log(req.params.email);
        // set email recipient and email with trackingPixel to track
        let metaData = {
            emailRecepient: req.params.email,
            userTrackingRequest: 'hello@precognitive.io',
            trackingPixel: randomstring.generate({
                'length': 5
            })
        };
        // conect to db and insert the metaData object then send response string with tracking pixel
        mongo.connect(`mongodb://${dbUrl}:${dbPort}/${dbName}`, (err, db) => {
            db.collection('precogdocs').insert(metaData).then(() => {
                    res.set('Content-Type', 'text/plain');
                    res.status(200).send(`<img src="http://${url}:${localPort}/assets/1x1.png?pxl=${metaData.trackingPixel}" alt="logo">`);
                    db.close();
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send("Error creating tracking code");
                });
        })
    } else {
        res.status(422).send("Error, missing email param");
    }

})

module.exports = app;