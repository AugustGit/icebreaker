const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const webpack = require('webpack');
const graph = require('fbgraph');
const app = express();
const morgan = require('morgan')
const databaseRoutes  = express.Router();
const webpackMiddleware = require("webpack-dev-middleware");
const webpackConfig = require('./webpack.config.js');
const passport = require('passport');
const pg = require('pg');
const FacebookStrategy = require('passport-facebook').Strategy;
const bodyParser = require("body-parser");
const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection: {
    //port: 5432,
    host : 'localhost',
    user : 'final',
    password : 'final',
    database : 'icebreaker'
  }
});

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let fbid = "";
let fb_pic = "";
let acc_token = "";
let cookie_id = 0;

///////////FACEBOOK AUTHENTICATION//////////////////////////////

passport.use(new FacebookStrategy({
    clientID: "575115656176298",
    clientSecret: "4d3a4ba21f529ae6b035cc38f95fbeb6",
    callbackURL: "http://localhost:8080/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    graph.setAccessToken(accessToken);
    acc_token = accessToken;
    fbid = profile.id;
    graph.get("me/?fields=picture.width(480).height(480)", function(err, res) {
      fb_pic = (res.picture.data.url);
    });
    knex.select().table('users').where({facebook_id: fbid})
    .then(function(user) {
      if(user.length < 1){
        done(null, console.log("need to register"));
      } else {
        cookie_id = user[0].id;
        done(null, user = user);
      }
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(webpackMiddleware(
  webpack(webpackConfig),
  { publicPath: '/' }
));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile']}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/matches',
                                      failureRedirect: '/signup' }));

///////////ROUTES//////////////////////////////
app.get('/api/potentials', (req, res) => {
  const cookieid = 14
  console.log("potentials get for id ", cookieid)
   knex('users')
   .whereNotExists(knex.select('*').from('userlikes').where('userid1',  Number(cookie_id)))
   .whereNotExists(knex.select('*').from('userlikes').whereRaw('users.id = userlikes.userid2'))
   .whereExists(knex.select('*').from('filters').whereRaw('users.gender = filters.male'))
   .orWhereExists(knex.select('*').from('filters').whereRaw('users.gender = filters.female'))
   .orWhereExists(knex.select('*').from('filters').whereRaw('users.gender = filters.other'))
   .whereExists(knex.select('*').from('filters').whereRaw('users.age >= filters.min_age'))
   .whereExists(knex.select('*').from('filters').whereRaw('users.age <= filters.max_age'))
  .then((result) => {
      console.log("knex result", result)
      res.send(result)
        })
  .catch((err) => {
          console.log("error", err)
        })
      })


app.get('/api/matches', (req, res) => {
  const cookieid = cookie_id
  console.log("potentials get for id ", cookieid)
  knex('users').whereExists(knex.select('*').from('userlikes').where('userid1', 1))
  // .whereExists(knex.select('*').from('userlikes').whereRaw('users.id = userlikes.userid2'))
  // .whereExists(knex.select('*').from('userlikes').where('liked', true))
  .then((result) => {
      console.log("knex result", result)
      res.send(result)
        })
  .catch((err) => {
          console.log("error", err)

        })
      })


app.get('/api/profile', (req, res) => {
  knex.select("*")
        .from("users")
        .where("id", Number(req.session.id))
        .then((result) => {
          console.log(result);
          res.send(result);
        });
});

app.get('/api/filters', (req, res) => {
  res.send(fb_pic);
});


app.get('/api/loggedIn', (req, res) => {
  if(req.session.id)
    res.send("true");
});

app.get('/api/logout', (req, res) => {
  cookie_id = 0;
  req.session = null;
  res.redirect('/logout');
});

app.get('/api/profile', (req, res) => {
  knex.select("*")
        .from("users")
        .where("id", Number(req.session.id))
        .then((result) => {
          res.send(result);
        });
});

app.get('/api/edit_filters', (req, res) => {
  knex.select("*")
        .from("filters")
        .where("userid", Number(req.session.id))
        .then((result) => {
          console.log(result);
          res.send(result);
        });


app.post('/api/edit_filters', (req, res) => {
  console.log(req.body);
    let min_age = Number(req.body.min_age);
    let max_age = Number(req.body.max_age);
    let radius = Number(req.body.distance);
    let female = (req.body.female) ? true : false;
    let male = (req.body.male) ? true : false;
    let other = (req.body.other) ? true : false;
    knex('filters')
      .where("userid", Number(req.session.id))
      .update({min_age: min_age, max_age: max_age, female: female, male: male, other: other, radius: radius})
      .then(function (woo) { 
          console.log("Woo!");
         });
    res.redirect('/profile');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
  if(cookie_id > 0)
    req.session = {"id": cookie_id};
  console.log(req.session.id);
});

app.post('/signup', (req, res) => {
  if(req.session.id){
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let age = Number(req.body.age);
    let gender = req.body.gender;
    let description = req.body.description;
    knex('users').where("id", Number(req.session.id)).update({first_name: first_name, last_name: last_name, age: age, gender: gender, description: description})
      .then(function (woo) { 
          console.log("Woo!");
         });
    res.redirect('/profile');
  } else {
    let facebook_id = fbid;
    let facebook_picture_url = fb_pic;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let age = Number(req.body.age);
    let gender = req.body.gender;
    let description = req.body.description;
    let location = "45.490998036, -73.56833106";
    console.log(req.body);
    knex('users').insert({facebook_id: facebook_id, first_name: first_name, last_name: last_name, age: age, gender: gender, description: description, facebook_picture_url: facebook_picture_url, location: location})
      .returning('id')
      .then(function (id) { 
          cookie_id = id;
         });
    res.redirect('/filters');
  }
});

app.post('/filters', (req, res) => {
  let userid = Number(cookie_id);
  let min_age = Number(req.body.min_age);
  let max_age = Number(req.body.max_age);
  let radius = Number(req.body.distance);
  let female = (req.body.female) ? "female" : null;
  let male = (req.body.male) ? "male" : null;
  let other = (req.body.other) ? "other" : null;

  knex('filters').insert({userid: userid, min_age: min_age, max_age: max_age, radius: radius, female: female, male: male, other: other})
    .then(function (woo) { 
        console.log("WOO!");
       });
  
  req.session = {"id": cookie_id};
  res.redirect('/potentials');
});

app.listen(8080, () => console.log('Server listening on 8080'));