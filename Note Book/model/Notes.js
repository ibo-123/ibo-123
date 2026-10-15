const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = new  Schema({
        title : {
                type : String ,
                required : true 
        },
        description : {
                type : String , 
                rquired : true
        },
        createdDate : {
                type : String ,
                required : true
        },
        UpdateDate : {
                type : String ,
                default : null
        }
});

module.exports = mongoose.model('Notes' , noteSchema);