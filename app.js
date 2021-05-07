const express =require("express"),
    appsetUp = require("./app_setUp"),
    path = require("path"),
    router = require("./routes/routes"),
    mongoose = require("mongoose");

require("dotenv").config({
    path: path.join(__dirname, "config.env")
});

let PORT = process.env.PORT||5000;

let HOST = process.env.PROD_HOST;
if (process.env.NODE_ENV === "development"){
    HOST = process.env.TEST_HOST;
}


mongoose.connect("mongodb://localhost/in_web", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).then(() => {
    console.log("MongoDB connected")
    const  app = express();
    appsetUp(app);

    app.use(router);

/*    app.listen(PORT,() =>{
        console.log(`Server running in ${process.env.NODE_ENV} on url : http://${HOST}:${PORT}`)
    } )*/

    app.listen(PORT,() =>{
        console.log(`Server running in ${process.env.NODE_ENV} on url : http://localhost:${PORT}`)
    } )



}).catch(err => {
    console.log("Cannot connect to MongoDB");
    throw err;
});






