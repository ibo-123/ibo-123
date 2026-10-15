const express = require('express');
const findStudent = require('../controllers/authcontroller');
const routers = express.Router();


routers.post('/', findStudent);
module.exports = routers;