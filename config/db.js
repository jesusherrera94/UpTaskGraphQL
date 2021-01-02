const mongoose = require('mongoose');
require('dotenv').config({path:'variables.env'});

const conectarDB = async () =>{
    try {
        console.log('conectando a',process.env.DB_MONGO)
        await mongoose.connect(process.env.DB_MONGO,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify:false,
            useCreateIndex:true
        });
        console.log('DB Conectada');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = conectarDB;