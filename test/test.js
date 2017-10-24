
const app = require('../app.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const nock = require('nock');
const request = require('supertest')('http://207.181.200.197:5100');

chai.should();
chai.use(chaiHttp);

  describe('/gettracker/aeoneon@gmail.com', () => {
      it('it should get tracking string html with code', (done) => {

        const response = '<img src="http://207.181.200.197:5100/assets/1x1.png?pxl=yrWwU';
        // stub data returned using nock
          nock('http://207.181.200.197:5100')
          .get('/gettracker/aeoneon@gmail.com')
          .reply(200, response);
       // We use super test for making the request on our mock data
          request
            .get('/gettracker/aeoneon@gmail.com')
            .end((err, res) => {
            res.should.have.status(200);
            console.log(res.text);
            res.text.should.be.a('string');
            res.text.should.include('<img src="http://207.181.200.197:5100/assets/1x1.png?pxl=yrWwU');
              done();
            });
      });
  });

