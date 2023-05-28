const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res)=> {
    res.status(200).send('server initially started');
});

app.listen(port, ()=> {
    console.log('server connected');
})