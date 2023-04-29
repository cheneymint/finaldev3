

const express = require('express');
const logger = require('morgan');
const path = require('path');

const basicAuth = require('express-basic-auth')
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const app = express();

/****************************
 * your config will grab your approved USERNAME and PASSWORD from your .env
 ****************************/
const config = require('./config');

/****************************
 * your mongodb
 ****************************/

mongoose.connect(config.MONGODB_URL, {useNewUrlParser: true});

const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  id: String,
  urls: { small: String, regular: String },
  alt_description: String,
});
const ImageModel = mongoose.model('Image', ImageSchema);

/****************************
 * setting up important middleware functionality
 ****************************/
// Handling JSON data 
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// your dev logger
app.use(logger('dev'));

// setting your static items routes to public
app.use(express.static(path.resolve(__dirname, 'public')));






const challengeAuth = basicAuth({
  authorizer: myAuthorizer,
  challenge: true,
  unauthorizedResponse:getUnauthorizedResponse
})
//Custom authorizer checking if the username starts with 'A' and the password with 'secret'
function myAuthorizer(username, password) {
  return username == config.USERNAME && password == config.PASSWORD
}
function getUnauthorizedResponse(req) {
  return 'not authorized'
}

/****************************
 * your view
 ****************************/
app.get("/", challengeAuth, (req, res)=> {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const UNSPLASH_ACCESS_KEY = config.rzfxeaiR7cbvj3rtrmDDI38Vp6c_KFiebl_T0T6PGQo;
/****************************
 * API endpoints
 ****************************/
async function fetchAndSaveDefaultImages() {
  const defaultImageCount = 10;
  const apiUrl = `https://api.unsplash.com/photos/random?client_id=${config.UNSPLASH_ACCESS_KEY}rzfxeaiR7cbvj3rtrmDDI38Vp6c_KFiebl_T0T6PGQo}&count=${defaultImageCount}`;

  const response = await fetch(apiUrl);
  const images = await response.json();

  images.forEach(async (image) => {
    const { id, urls, alt_description } = image;
    const imageData = { id, urls, alt_description };

    // Check if the image already exists in the database
    const imageExists = await ImageModel.exists({ id: imageData.id });

    // If the image doesn't exist, save it to the database
    if (!imageExists) {
      await ImageModel.create(imageData);
    }
  });
}

fetchAndSaveDefaultImages();
app.get("/api/search", challengeAuth, async (req, res) => {
    const { q } = req.query;
  
    if (q) {
      const apiUrl = `https://api.unsplash.com/search/photos?client_id=${config.UNSPLASH_ACCESS_KEY}rzfxeaiR7cbvj3rtrmDDI38Vp6c_KFiebl_T0T6PGQo}&query=${q}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      res.send(data);
    } else {
      const defaultImages = await ImageModel.find({});
      res.send({ results: defaultImages });
    }
  });
  async function fetchImages(query) {
    const response = await fetch(`/api/search${query ? `?q=${query}` : ""}`);
    const data = await response.json();
    displayImages(data.results);
  }
  
  searchButton.addEventListener("click", () => {
    const query = searchInput.value;
    if (!query) {
      alert("Please enter a search query.");
      return;
    }
    fetchImages(query);
  });
  
  window.onload = function () {
    fetchImages();
  };
  