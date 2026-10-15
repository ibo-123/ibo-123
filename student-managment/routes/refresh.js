const express = require('express');
const handlRefersh = require('../controllers/refreshTokenController');
const routers = express.Router();


routers.get('/', handlRefersh.handlRefershToken);
module.exports = routers;