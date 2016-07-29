var express = require('express');
var bodyParser = require('body-parser');
var hellobot = require('./hellobot');
var dicebot = require('./dicebot');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');
var gcal     = require('google-calendar');

passport.use(new GoogleStrategy({
    clientID: "1041396637244-a74ctp1cr105pi3lpq8bmse7lniudpe0.apps.googleusercontent.com",
    clientSecret: "ovNBildsFu9a_isEFc1DWAhK",
    callbackURL: "https://lithios-slackbot.herokuapp.com/",
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {

    //google_calendar = new gcal.GoogleCalendar(accessToken);

    return done(null, profile);
  }
));



var app = express();
var port = process.env.PORT || 3000;

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

app.post('/hello', hellobot);
app.post('/roll', dicebot);

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });

app.all('/', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  //Create an instance from accessToken
  var accessToken = req.session.access_token;

  gcal(accessToken).calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    console.log(data);
    return res.send(data);
  });
});


// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

app.listen(port, function () {
  console.log('Slack bot listening on port ' + port);
});