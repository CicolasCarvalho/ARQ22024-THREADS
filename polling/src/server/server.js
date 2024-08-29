const express = require('express');

const app = express();
const post = require("./handlers/post");

const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    
    next();
})

app.get('/message', (req, res) => {
    const filters = {
        after: !isNaN(req.query.after) ? new Date(+req.query.after) : null,
        before: !isNaN(req.query.before) ? new Date(+req.query.before) : null,
    };

    const response = post.getPosts(filters);

    res.json(response);
});

app.post('/message', (req, res) => {
    const { user, message } = req.body;

    const response = post.createPost(user, message);
    
    res.json(response);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
