const { options } = require("../routes/api/studentRouter");

const whiteList = [
       'https://127.0.0.1:5500'
]

const corsOption = {
        origin : (origin , callback) =>{
                if (whiteList.indexOf(origin) !== -1 || !origin){
                        callback(null , true)
                } else{
                        callback(new Error('Not allowed By CORS'))
                }
        },
        optionsSuccessStatus : 200
}


module.exports = corsOption ;