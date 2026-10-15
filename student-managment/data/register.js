const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RegisterSchema = new Schema({
        name : {
                type : string,
                require : true
        },
        password :{
                type : string,
                require : true
        }
});


module.exports = RegisterSchema ; 