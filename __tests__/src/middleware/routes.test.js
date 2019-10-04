'use strict';

process.env.SECRET='test';

const auth = require('../../../src/auth/middleware.js');
const Users = require('../../../src/auth/users-model.js');
const Roles = require('../../../src/auth/roles-model.js');

const jwt = require('jsonwebtoken');

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose(server);

let users = {
  admin: {username: 'admin', password: 'password', role: 'admin'},
  editor: {username: 'editor', password: 'password', role: 'editor'},
  user: {username: 'user', password: 'password', role: 'user'},
  visitor: {username: 'visitor', password: 'password', role: 'visitor'},
};

const capabilities = {
  admin: ['create','read','update','delete'],
  editor: ['create', 'read', 'update'],
  user: ['read'],
  visitor: [],
};

beforeAll(async () => {
  await Promise.all(Object.entries(capabilities).map(entry => new Roles({role: entry[0], capabilities: entry[1]}).save()));
});

describe('User capabilties with routes', () => {

  it('Anyone can access /public-stuff', () => {
    return mockRequest.get('/public-stuff')
      .expect(200)
      .then(result => {
        expect(result.text).toBe('This is some public stuff');
      });
  });

  it('Only logged in can access /hidden-stuff', () => {
    return mockRequest.get('/hidden-stuff')
      .expect(500);
  });

  Object.keys(users).forEach( userType => {

    describe(`${userType} users`, () => {

      let token;
      beforeAll(async () => {
        token = (await mockRequest.post('/signup').send(users[userType])).text;
        //console.log(jwt.decode(token));
      });

      it('have access to /hidden-stuff', () => {
        return mockRequest.get('/hidden-stuff')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .then(results => {
            expect(results.text).toBe('Yes');
          });
      });

      it('have correct access to /something-to-read', () => {
        switch (userType) {
        case 'visitor':
          return mockRequest.get('/something-to-read')
            .set('Authorization', `Bearer ${token}`)
            .expect(500);
        default:
          return mockRequest.get('/something-to-read')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(results => {
              expect(results.text).toBe('Heres some text to read...');
            });
        }
      });

      it('have correct access to /create-a-thing', () => {
        switch (userType) {
        case 'visitor':
        case 'user':
          return mockRequest.post('/create-a-thing')
            .set('Authorization', `Bearer ${token}`)
            .send('some stuff')
            .expect(500);
        default:
          return mockRequest.post('/create-a-thing')
            .set('Authorization', `Bearer ${token}`)
            .send('some stuff')
            .expect(201)
            .then(results => {
              expect(results.text).toBe('It has been done');
            });
        }
      });

      it('have correct access to /update', () => {
        switch (userType) {
        case 'visitor':
        case 'user':
          return mockRequest.put('/update')
            .set('Authorization', `Bearer ${token}`)
            .send('some stuff')
            .expect(500);
        default:
          return mockRequest.put('/update')
            .set('Authorization', `Bearer ${token}`)
            .send('some stuff')
            .expect(201)
            .then(results => {
              expect(results.text).toBe('It has been done');
            });
        }
      });

      it('have correct access to /bye-bye', () => {
        switch (userType) {
        case 'visitor':
        case 'user':
        case 'editor':
          return mockRequest.delete('/bye-bye')
            .set('Authorization', `Bearer ${token}`)
            .expect(500);
        default:
          return mockRequest.delete('/bye-bye')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(results => {
              expect(results.text).toBe('It has been done');
            });
        }
      });
    });
  });
});
