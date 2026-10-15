const express = require('express');
const path = require('path');
const  {
        getAllstudents ,
        getStudentById ,
        creatNewStudent ,
        UpdatStudents
}   =  require('../../controllers/studentController.js');

const routers = express.Router();

routers.route('/')
.get(getAllstudents)
.post(creatNewStudent)
.put(UpdatStudents)

routers.route('/:id')
.get(getStudentById)



module.exports = routers;