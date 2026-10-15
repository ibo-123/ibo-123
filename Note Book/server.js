require('dotenv').config();
const express = require("express")
const app = express();
const PORT = process.env.PORT || 3000 ;
const router = require('./router/NotesRouters')
const mongoose = require('mongoose');
const connect = require('./config/configDB');
const errorHandler = require("./middleware/errorHandler");
const { logger } = require('./middleware/logEvent');

app.use(logger);




connect();


app.use(express.json());
app.use(express.static('public'));
app.use('/notes' , router);


// 404 handler at the end, using Express style
app.use((req, res, next) => {
    res.status(404);
    if (req.accepts('json')) {
        res.json({ error: "404 Not Found" });
        
    } else {
        res.type('txt').send("404 Not Found");
    }
});
app.use(errorHandler);
mongoose.connection.once('open' , ()=>{
        console.log("Connected to mongoDB")
        app.listen(PORT , ()=>{
        console.log(`The Server Is Running At ${PORT}`)
})
});



//bkZ2XFmO2eAZGwd