const express = require('express');
const newStudentregisteration = require('../controllers/studentsRegisterController').registerNewUser;
const deleteStudent = require("../controllers/studentsRegisterController").deleteStudent;
const routers = express.Router();


routers.post('/', newStudentregisteration);
routers.get('/delete',deleteStudent);
module.exports = routers;