'use strict';

// Require dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const app = express();

app.use(cors());

require('dotenv').config();

const PORT = 3000;

app.get('/location', getLocation);

app.get('/weather', getWeather);

app.get('/yelp', getYelp);

app.get('/movies', getMovies);

function getLocation(request, response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${
    request.query.data}&key=${process.env.GOOGLE_API_KEY}`;
  return superagent.get(url).then(result => {
    const locationResult = new Location(request, result);
    response.send(locationResult);
  });
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${
    process.env.DARK_SKY_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  return superagent
    .get(url)
    .then(result => {
      response.send(
        result.body.daily.data.map(element => new Weather(element))
      );
    })
    .catch(error => handleError(error, response));
}

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?location=${
    request.query.data.search_query}`;
  console.log(request.query.data.search_query);

  superagent
    .get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      response.send(result.body.businesses.map(element => new Yelp(element)));
    })
    .catch(error => handleError(error, response));
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie/?api_key=${
    process.env.MOVIEDB_API_KEY
  }&language=en-US&page=1&query=${request.query.data.search_query}`;
  superagent
    .get(url)
    .then(result => {
      response.send(result.body.results.map(element => new Movies(element)));
    })
    .catch(error => handleError(error, response));
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

function Weather(day) {
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.forecast = day.summary;
}

function Location(req, result) {
  this.search_query = req.query.data;
  this.formatted_query = result.body.results[0].formatted_address;
  this.latitude = result.body.results[0].geometry.location.lat;
  this.longitude = result.body.results[0].geometry.location.lng;
}

function Yelp(food) {
  this.url = food.url;
  this.name = food.name;
  this.rating = food.rating;
  this.price = food.price;
  this.image_url = food.image_url;
}

function Movies(movies) {
  this.title = movies.title;
  this.released_on = movies.release_date;
  this.total_votes = movies.vote_count;
  this.average_votes = movies.vote_average;
  this.popularity = movies.popularity;
  this.image_url = movies.poster_path;
  this.overview = movies.overview;
}

// may need to move
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
