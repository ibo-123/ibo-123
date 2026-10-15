const express = require('express');
const { handlLogout} = require('../controllers/logoutController');
const routers  = express.Router();

routers.get('/' , handlLogout);

module.exports = routers;