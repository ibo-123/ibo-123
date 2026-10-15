const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
        firstname :{
                type : String,
                require : true
        },
        lastname : {
                type : String , 
                require : true
        },
        department :{
                type : String,
                require : true
        }
})

module.exports = mongoose.model('Students' , studentSchema);

