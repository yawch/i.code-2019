'use strict';

const firebase = require('firebase-admin');
const express = require('express');
const bcrypt = require('bcrypt');

// init firebase
firebase.initializeApp({
    credential: firebase.credential.cert(require('./serviceAccountKey.json')),
    databaseURL: 'https://budget-tracker-d6797.firebaseio.com'
});

const db = firebase.firestore();

// init express app
const app = express();

// user authentication route
app.get('/auth', async (req, res) => {
    const { username, password } = req.query;
    if (!username || !password) {
        res.status(400).json({ success: 'false', reason: 'bad request' });
        return;
    }
    const doc = await db.collection('users').doc(username).get();
    if (doc.exists) {
        if (await bcrypt.compare(password, doc.data().password)) {
            res.json({ success: 'true' });
        } else {
            res.json({ success: 'false', reason: 'credentials' });
        }
    } else {
        res.json({ success: 'false', reason: 'credentials' });
    }
});

// create new user route
app.get('/newUser', async (req, res) => {
    const { username, password, goal } = req.query;
    if (!username || !password || !goal) {
        res.status(400).json({ success: 'false', reason: 'bad request' });
        return;
    }
    const doc = db.collection('users').doc(username);
    if ((await doc.get()).exists) {
        res.json({ success: 'false', reason: 'taken' });
        return;
    }
    const hashpw = await bcrypt.hash(password, 13);
    doc.set({
        auto_deductions: [],
        current_cash: 0,
        entries: [],
        goal: parseInt(goal),
        password: hashpw
    });
    res.json({ success: 'true' });
});

app.listen(3000, () => console.log('app listening on port 3000'));