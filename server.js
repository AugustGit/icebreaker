const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const webpack = require('webpack');
const graph = require('fbgraph');
const app = express();
const morgan = require('morgan');
const game = require('./random-game.js');
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
  passport.authenticate('facebook', { successRedirect: '/potentials',
                                      failureRedirect: '/signup' }));


///////////ROUTES//////////////////////////////
app.get('/api/potentials', (req, res) => {
  const cookieid = 1//req.session.id

    Promise.all([
    knex('users')
     .select('filters.min_age','filters.max_age', 'filters.female','filters.male','filters.other')
     .innerJoin('filters', 'users.id', 'filters.userid')
     .where('users.id',cookieid ),

    knex('users')
    .whereNot('users.id', cookieid )
    .whereNotExists(knex.select('*').from('userlikes').whereRaw('userlikes.userid1 = ?', [cookieid]).andWhereRaw('users.id = userlikes.userid2').andWhereRaw('liked = ?', true))
    .whereNotExists(knex.select('*').from('userlikes').whereRaw('userlikes.userid2= ?', [cookieid]).andWhereRaw('users.id = userlikes.userid1').andWhereRaw('liked = ?', true))
      ])
     .then((result) => {
        const[filterCriteria, users] = result
        const [min_age, max_age, female, male, other] = Object.values(filterCriteria[0])
          res.send(users.filter(user => {
           if((user.age >= min_age)
            && (user.age <= max_age)
            &&((user.gender == female)
              || (user.gender == male)
              || (user.gender == other)
              || ((user.gender == female) && (user.gender == male))
              || ((user.gender == female) && (user.gender == other))
              || ((user.gender == male) && (user.gender == other))
              || ((user.gender == female) && (user.gender == male) && (user.gender == other))
            )){
            return user
          }
        }))
      })
    .catch((err) => {
            console.log("error", err)
          })
      })

app.post('/api/matchesrejected', (req, res) => {
  let userid1 = 1//Number(cookie_id);
  let userid2 = Number(req.body.user2);

    knex('userlikes')
      .where('userid2', Number(userid1))
      .where('userid1', Number(userid2))
      .update('liked', false)
      .then((result) => {
        console.log(userid1, " has rejected ", userid2, " updating userlikes table ", result)
    })
       .catch((err) => {
          console.log("error", err)

        })

    knex('userlikes').whereNot(function() {
      this.where('userid2', Number(userid1)).where('userid1', Number(userid2))
      }).insert({userid1: Number(userid1), userid2: Number(userid2),liked: false})
      .then(function (woo) {
        console.log(userid1, " has rejected ", userid2, " making userlikes table ", woo);
       })
       .catch((err) => {
          console.log("error", err)
        })
});

app.post('/api/matchesliked', (req, res) => {
  let userid1 = 1//Number(cookie_id);
  let userid2 = Number(req.body.user2);

    knex('userlikes')
      .select('userlikes.id')
      .where('userid2', Number(userid1))
      .where('userid1', Number(userid2))
      .whereNot('liked', null)
      .update('liked', true)
      .then((result) => {
      console.log(userid1, " has liked ", userid2, " updating userlikes table ")
    })

    knex('userlikes').whereNot(function() {
      this.where('userid2', Number(userid1)).andWhereNot('userid1', Number(userid2))
      }).insert({userid1: Number(userid1), userid2: Number(userid2),liked: null})
      .then(function (woo) {
        console.log(userid1, " has liked ", userid2, " making userlikes table ", woo);
      });
});

app.get('/api/matches', (req, res) => {
  const cookieid = 1 //req.session.id

  Promise.all([
    knex.from('userlikes')
      .select('userid1')
      .where('userlikes.liked', true)
      .where('userid2', cookieid),
    knex.from('userlikes')
      .select('userid2')
      .where('userlikes.liked', true)
      .where('userid1', cookieid),
  ])
  .then((result) => {
    const [users1, users2] = result
    const users = users1.concat(users2)
    var user_ids = []
    for(let user of users){
      user_ids.push(Object.values(user)[0])
      console.log("user_ids",user_ids )
    }
    knex.from('users').select('*').whereIn('users.id', user_ids )
    .then((result) => {
      res.send(
        result
      )
      .catch((err) => {
        console.log("error", err)
      })
    })
  })
})

app.get('/api/potentials/:id', (req, res) => {
  const cookieid = 1
  const searchid = req.params.id
  const searchWord = '%' + searchid + '%'
  console.log("searchWord", searchid)
    Promise.all([
    knex('users')
    .where('users.description', 'ilike', searchWord)
    .whereNotExists(knex.select('*').from('userlikes').whereRaw('userlikes.userid1 = ?', [cookieid]).andWhereRaw('users.id = userlikes.userid2').andWhereRaw('userlikes.liked = ?', true))
    .whereNotExists(knex.select('*').from('userlikes').whereRaw('userlikes.userid2 = ?', [cookieid]).andWhereRaw('users.id = userlikes.userid1').andWhereRaw('userlikes.liked = ?', true))
      ])

     .then((result) => {
      console.log("potentials by keyword are ",result);
      res.send(result);
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
          res.send(result);
        });
});

app.get('/api/alreadyLiked', (req, res) => {
  knex.select("*")
        .from("userlikes")
        .where({
          userid2: 1,
          liked:  null
        })
        .then((result) => {
          let just_ids = [];
          for(let i = 0; i < result.length; i++){
            just_ids.push(result[i].userid1);
          }
          res.send(just_ids);
        });
});

app.get('/api/new_game', (req, res) => {
  res.send(game());
});

app.get('/api/filters', (req, res) => {
  res.send(fb_pic);
});

app.get('/api/loggedIn', (req, res) => {
  if(req.session.id)
    res.send("true");
});

app.get('/api/userID', (req, res) => {
  let currentUserID = "1"
  res.send(currentUserID)
})

app.get('/api/logout', (req, res) => {
  cookie_id = 0;
  req.session = null;
  res.redirect('/logout');
});

app.get('/api/edit_filters', (req, res) => {
  knex.select("*")
        .from("filters")
        .where("userid", Number(req.session.id))
        // use for demo when testing facebook authentication
        .then((result) => {
          res.send(result);
        });
});

app.post('/api/edit_filters', (req, res) => {

    let min_age = Number(req.body.min_age);
    let max_age = Number(req.body.max_age);
    let radius = Number(req.body.distance);
    let female = (req.body.female === 'on') ? 'female' : null;
    let male = (req.body.male === 'on') ? 'male' : null;
    let other = (req.body.other === 'on') ? 'other' : null;

    knex('filters')
      .where("userid", Number(req.session.id))
      .update({min_age: min_age, max_age: max_age, female: female, male: male, other: other, radius: radius})
      .then(function (woo) {
         });
    res.redirect('/profile');
});

app.get('/api/messages_db', (req, res) => {
  const userlikesid = Number(req.query.userlikesid)
  knex.select("*")
        .from("messages")
        .where("userlikesid", userlikesid )
        .then((result) => {
          res.send(result);
        });
});

app.post('/api/message_db', (req, res) => {
  let content = req.body.input
  let userid = req.body.currentUser
  let userlikesid = req.body.userlikesid

  knex('messages')
    .insert({
      userid: userid,
      userlikesid: userlikesid,
      content: content
    })
    .then(function (woo) {
    });
});

app.get('/api/message_list', (req, res) => {
  const cookieid = 1 //req.session.id
  let userlikesQuery =
    knex
    .from('userlikes')
    .select('id as userlikesid', 'userid2 as userid')
    .where('userid1', cookieid)
    .where('liked', true)
    .union(function() {
      this.from('userlikes')
      .select('id as userlikesid', 'userid1 as userid')
      .where('userid2', cookieid)
      .where('liked', true)
    })
    knex.select('userlikesid', 'users.*')
    .from(userlikesQuery.clone().as('ul'))
    .leftJoin('users', 'ul.userid', 'users.id')
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log("error", err)
    })

});

app.get('/api/chat_window/:id', (req, res) => {
  console.log("req.params.id",req.params.id)
  const cookieid = 1 //req.session.id
  let userid2 = Number(req.params.id);
  let userlikesQuery =
    knex
        .from('userlikes')
        .select('id as userlikesid', 'userid2 as userid')
        .where('userid1', cookieid)
        .where('userid2', userid2)
        .union(function() {
          this.from('userlikes')
          .select('id as userlikesid', 'userid1 as userid')
          .where('userid2', cookieid)
          .where('userid1',userid2)
        })
    knex.select('userlikesid', 'users.*')
        .from(userlikesQuery.clone().as('ul'))
        .leftJoin('users', 'ul.userid', 'users.id')
        .then((result) => {
          res.send(result)
        })
        .catch((err) => {
          console.log("error", err)
        })
});


app.post('/api/friendremoved/:id', (req, res) => {
  let userid1 = 1//Number(cookie_id);
  let userid2 = Number(req.params.id);
    Promise.all([
      knex('userlikes')
        .select('userlikes.id').where({'userid1': Number(userid1)})
        .where({'userid2': Number(userid2)})
        .update({'liked': false}),
         knex('userlikes')
        .select('userlikes.id').where({'userid2': Number(userid1)})
        .where({'userid1': Number(userid2)})
        .update({'liked': false})
    ])
      .then((result) => {
        console.log(userid1, " has removed from friends", userid2, " updating userlikes table ", result);
      })
      .catch((err) => {
        console.log("error", err);

      });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
  if(cookie_id > 0)
    req.session = {"id": cookie_id};
});

app.post('/signup', (req, res) => {
  if(req.session.id){
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let age = Number(req.body.age);
    let gender = req.body.gender;
    let description = req.body.description;
    let lovefemale = req.body.lovefemale;
    let lovemale = req.body.lovemale;
    let loveother = req.body.loveother;
    knex('users').where("id", Number(req.session.id)).update({first_name: first_name, last_name: last_name, age: age, gender: gender, lovefemale: lovefemale, lovemale: lovemale, loveother: loveother,  description: description})
      .then(function (woo) {
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
    let lovefemale = (req.body.lovefemale) ? "lovefemale" : null;
    let lovemale = (req.body.lovemale) ? "lovemale" : null;
    let loveother = (req.body.loveother) ? "loveother" : null;
    let location = "45.490998036, -73.56833106";

    knex('users').insert({facebook_id: facebook_id, first_name: first_name, last_name: last_name, age: age, gender: gender, lovefemale: lovefemale, lovemale: lovemale, loveother: loveother, description: description, facebook_picture_url: facebook_picture_url, location: location})
      .returning('id')
      .then(function (id) {
          cookie_id = id[0];

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
       });

  req.session = {"id": cookie_id};
  res.redirect('/potentials');
});

app.listen(8080, () => console.log('Server listening on 8080'));