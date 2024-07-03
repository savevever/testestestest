require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
// const bcrypt = require('bcrypt');
const initializePassport = require('./src/components/passportConfig');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.set('view engine', 'ejs');
// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Database connection and models
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/dev');
let User;

async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        User = sequelize.define('User', {
            day: { type: DataTypes.STRING, allowNull: true },
            month: { type: DataTypes.STRING, allowNull: true },
            name: { type: DataTypes.STRING },
            dailyProfit: { type: DataTypes.INTEGER, allowNull: true },
            product: { type: DataTypes.INTEGER, allowNull: true },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: { type: DataTypes.STRING, allowNull: false },
            ConfirmPassword: { type: DataTypes.STRING, allowNull: false }
        });

        await sequelize.sync({ alter: true });
        console.log('Models have been synchronized successfully.');
        initializePassport(passport, User);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// WebSocket Server
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });
    ws.send('Hello! Message From Server!!');
});

// Routes
app.get('/', (req, res) => res.send('Welcome to the API'));
// app.get('/users/register', (req, res) => res.render('register'));
app.get('/users/login', (req, res) => res.render('login'));
app.get('/users/home-login', (req, res) => res.render('home-login', { user: req.user.name }));

// CRUD routes for users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

app.post('/users/register', async (req, res) => {
    const { name, email, password, ConfirmPassword } = req.body;
    // let errors = [];

    // if (!name || !email || !password) {
    //     errors.push({ message: 'Please enter all fields' });
    // }
    // if (password.length < 6) {
    //     errors.push({ message: 'Password must be at least 6 characters' });
    // }

    // if (errors.length > 0) {
    //     return res.status(400).json({ errors });
    // }

    try {
        // const hashedPassword = await bcrypt.hash(password, 10);
        // const user = await User.findOne({ where: { email } });
        // if (user) {
        //     errors.push({ message: 'Email already exists' });
        //     return res.status(400).json({ errors });
        // }
        const newUser = await User.create({
            name,
            email,
            password,
            ConfirmPassword,
        });
        localStorage.setItem('user', JSON.stringify(newUser));
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error during registration');
    }
});

// app.post('/users/login', passport.authenticate('local', {
//     successRedirect: '/users/home-login',
//     failureRedirect: '/users/login',
//     failureFlash: true
// }));

app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Error logging in user');
    }
});

app.post('/createUsers', async (req, res) => {
    const { firstName, lastName, dailyProfit, product, day, month } = req.body;
    try {
        const newUser = await User.create({
            firstName,
            lastName,
            dailyProfit,
            product,
            day,
            month
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
});

app.get('/users/:firstName', async (req, res) => {
    try {
        const user = await User.findOne({ where: { firstName: req.params.firstName } });
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Error fetching user');
    }
});

server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initializeDatabase();
});

module.exports = { app, sequelize, User };
server.js
