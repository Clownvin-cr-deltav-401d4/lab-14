'use-strict';

const express = require('express');
const router = express.Router();

const User = require('../auth/users-model');
const auth = require('../auth/middleware');

router.get('/public-stuff', (req, res, next) => {
  res.status(200).send('This is some public stuff');
});

router.get('/hidden-stuff', auth(), (req, res, next) => {
  res.status(200).send('Yes');
});

router.get('/something-to-read', auth('read'), (req, res, next) => {
  res.status(200).send('Heres some text to read...');
});

router.post('/create-a-thing', auth('create'), (req, res, next) => {
  res.status(201).send('It has been done');
});

router.put('/update', auth('update'), (req, res, next) => {
  res.status(201).send('It has been done');
});

router.delete('/bye-bye', auth('delete'), (req, res, next) => {
  res.status(200).send('It has been done');
});

module.exports = exports = router;