const express = require('express');
const nocache = require('nocache');
const device = require('express-device');
const mongo = require('mongodb').MongoClient;
const randomstring = require("randomstring");

const app = express();
// normally would do environmental variables but was in a hurry and this is a code challenge. 
const url = '207.181.200.197';
const localPort = '5100';
const dbUrl = 'localhost';
const dbPort = '27017';
const dbName = 'precog';
 
// we should be not be caching our image since we want tracking everytime email is opened
app.use(nocache());
// capture user device
app.use(device.capture());
app.listen(5100);

app.use((req, res, next) => {
    console.log('request coming through');
    if (req.query.pxl) {
        console.log(req.query.pxl);
       let setDetails =  {
            'ip': req.ip,
            'device': req.device.type,
            'timeStamp': new Date()
        };
        mongo.connect(`mongodb://${dbUrl}:${dbPort}/${dbName}`, (err, db) => {
            if (err) {
                console.log(err);
            } else {
                db.collection('precogdocs').findOneAndUpdate({
                    "trackingPixel": req.query.pxl
                }, {
                    $set: setDetails,
                    $setOnInsert: {
                        'originalDevice': req.device.type,
                        'trackingPixel': req.query.pxl,
                    },
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
                    if (doc.device !== doc.originalDevice) {
                        doc.value.deviceChangedOnReOpen = true;
                    } else {
                        doc.value.deviceChangedOnReOpen = false;
                    }                    
                    // This is the part where we would send email but instead log out data
                    console.log(Object.assign(doc.value, setDetails));
                    db.close()
                                        
                }))
                next();
            }
        });

    } else {
        next();
    }
});

app.use(express.static('./'));

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
