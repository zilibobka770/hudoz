const express = require('express');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const sequelize = require('./config/connect');
const Blog = require('./models/blogModel');
const User = require('./models/userModel')
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');


const app = express();

app.use(express.json());
app.use(bodyParser.json());

app.use(session({
    secret: 'zxcvzxcv',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !true }
}));

app.engine('.handlebars', engine({
    defaultLayout: 'main',
    extname: '.handlebars',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    cache: process.env.NODE_ENV === 'production' ? true : false,
}));

app.set('view engine', '.handlebars');


Blog.sync().then(() => console.log('Success'))
User.sync().then(() => console.log('Success user'))


app.post('/addComment', (req, res) => {
    const { blogId, comment } = req.body;

    if (!req.session.comments) {
        req.session.comments = {};
    }

    if (!req.session.comments[blogId]) {
        req.session.comments[blogId] = [];
    }

    req.session.comments[blogId].push(comment);

    res.send('Комментарий добавлен');
});

app.get('/getComments/:blogId', (req, res) => {
    const { blogId } = req.params;

    const comments = req.session.comments && req.session.comments[blogId] ? req.session.comments[blogId] : [];

    res.json(comments);
});


//user reg and login
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send('Необходимо указать имя пользователя и пароль.');
        }
        const hashedPassword = await bcrypt.hash(password, 12); // Хеширование пароля

        const newUser = await User.create({
            username,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({message: "Пользователь успешно зарегистрирован", user: newUser});
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).send('Ошибка при регистрации.');
    }
});

app.get('/register', (req, res) => {
    res.render('register', { loggedIn: false });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).send('Пользователь не найден.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Неверный пароль.');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            'qazwsxedcrfvtgb',
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).send('Ошибка при входе в систему.');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { loggedIn: false });
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, 'qazwsxedcrfvtgb', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};



app.post('/createBlog', authenticateJWT, async (req, res) => {
    if (req.user.role === 'admin') {
        const { title, desc, image } = req.body;
        const newBlog = await Blog.create({ title, desc, image });
        res.json(newBlog);
    } else {
        res.status(403).send('Только администратор может создавать блоги.');
    }
});



app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            order: [['createdAt', 'DESC']]
        });
        const plainBlogs = blogs.map(blog => blog.get({ plain: true })); // Преобразование каждого экземпляра
        res.render('blogs', { blogs: plainBlogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/createBlog', (req, res) => {
    console.log("Received GET request for /createBlog");
    const templatePath = path.join(__dirname, 'views', 'createBlog');
    res.render(templatePath, { layout: 'main' });
});


//удаление блога
app.delete('/deleteBlog/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const blogToDelete = await Blog.findByPk(blogId);

        if (!blogToDelete) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        await blogToDelete.destroy();

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting Blog:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//редактирование блога
app.get('/blog/edit/:id', async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) {
            res.status(404).send('Blog post not found');
        } else {
            res.render('editBlog', { blog: blog.toJSON() });
        }
    } catch (error) {
        // Обработка ошибок запроса к БД
        res.status(500).send('Error retrieving blog post');
    }
});

app.put('/blog/update/:id', async (req, res) => {
    try {
        const { title, desc, image } = req.body;
        const updated = await Blog.update({ title, desc, image }, {
            where: { id: req.params.id }
        });

        if (updated) {
            res.json({ success: true, message: 'Blog post updated', redirectUrl: '/blogs' });
        } else {
            res.status(404).send('Blog post not found');
        }
    } catch (error) {
        res.status(500).send('Error updating blog post');
    }
});

app.listen(3000, ()=>{
    console.log('Server started at 3000')
})