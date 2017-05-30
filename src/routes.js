/* eslint-disable no-param-reassign*/
import express from 'express';
import passport from 'passport';

import Poll from './models/poll';
import passportConfig from './config/passport';

passportConfig(passport);

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.send('You are not authorized to do this :) ');
};

// set router param
router.param('pID', (req, res, next, id) => {
  Poll.findById(id, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Document cannot be found in DB');
      err.status = 404;
      return next(err);
    }
    req.poll = doc;
    return next();
  });
	// next(),
});

router.param('aID', (req, res, next, id) => {
  req.answer = req.poll.answers.id(id);
  if (!req.answer) {
    const err = new Error('Document cannot be found in DB');
    err.status = 404;
    return next(err);
  }
  next();
});

// GET,POST, DELETE Routes
router.get('/', (req, res) => {
  res.render('index.ejs');
});

router.get('/polls', (req, res) => {
  Poll.find({}, (err, polls, next) => {
    if (err) return next(err);
    return res.status(200).json(polls);
  });
});

router.get('/poll/:pID', isLoggedIn, (req, res) => {
  res.json(req.poll);
});

router.post('/poll/new', isLoggedIn, (req, res, next) => {
  const poll = new Poll(req.body);
  poll.save((err, doc) => {
    if (err) return next(err);
    return res.status(201).json(doc);
  });
});

router.post('/poll/:pID/new', isLoggedIn, (req, res, next) => {
  req.poll.answers.push(req.body);
  req.poll.save((err, doc) => {
    if (err) return next(err);
    return res.status(201).json(doc);
  });
});

router.post('/poll/:pID/:aID/vote', (req, res, next) => {
  req.answer.vote(req.vote, (err, doc) => {
    if (err) return next(err);
    return res.json(doc);
  });
});

router.delete('/poll/:pID', isLoggedIn, (req, res, next) => {
  req.poll.remove(() => {
    req.poll.save((err, doc) => {
      if (err) return next(err);
      return res.json(doc);
    });
  });
});

// twitter authentication routes

router.get('/auth/twitter', passport.authenticate('twitter'));

router.get(
	'/auth/twitter/callback',
	passport.authenticate('twitter', {
  successRedirect: '/polls',
  failureRedirect: '/',
}),
);

// local sign up
router.get('/signup', (req, res) => {
  res.json({ message: 'Signup GET' });
});

router.post(
	'/signup',
	passport.authenticate('local-signup', {
  successRedirect: '/polls',
  failureRedirect: '/signup',
}),
);

// local sign in
router.get('/login', (req, res) => {
  res.json({ message: 'Login GET' });
});

router.post(
	'/login',
	passport.authenticate('local-login', {
  successRedirect: '/polls',
  failureRedirect: '/signup',
}),
);

router.get('*', (req, res, next) => {
  const err = new Error('The page cannot be found!!!!');
  err.status = 404;
  next(err);
});

export default router;
