const mongoose = require('mongoose');

const footSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true,
    },
    firstName : {
        type:String,
        required:true,
    },
    lastName : {
        type:String,
        required:true,
    },
    email : {
        type:String,
        required:true,
    },
    phoneNumber : {
        type:String,
        required:true,
    },
    adress:{
        type:String,
        required:true,
    },
    timings:{
        type:[Date],
        required:true,  
    },
    status:{
        type:String,
        default:"pending",
    }
},{
    timestamps:true,
})

const footModel = mongoose.model("Foot",footSchema);
module.exports = footModel