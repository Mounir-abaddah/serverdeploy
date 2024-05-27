const express = require('express');
const cors = require('cors')
const app = express()

require('dotenv').config()

const dbConfig = require('./config/dbConfig');

app.use(express.json())

const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

app.use('/api/user',userRoute)
app.use('/api/admin',userRoute)



const port = process.env.PORT || 5000




app.listen(port,()=>{
    console.log(`Server is listen to ${port}`);
})
