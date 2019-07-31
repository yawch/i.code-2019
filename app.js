'use strict';

const firebase = require('firebase-admin');
const express = require('express');
const bcrypt = require('bcrypt');

const generateGraph = require('./generateGraph');

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
    // get info from GET params
    const { username, password } = req.query;

    // check for valid data
    if (!username || !password) {
        res.status(400).json({ success: false, reason: 'bad request' });
        return;
    }
    const doc = await db.collection('users').doc(username).get();
    if (doc.exists) {
        if (await bcrypt.compare(password, doc.data().password)) {
            res.send(username);
        } else {
            res.json({ success: false, reason: 'credentials' });
        }
    } else {
        res.json({ success: false, reason: 'credentials' });
    }
});

// create new user route
app.get('/newUser', async (req, res) => {
    // get info from GET params
    const { username, password, goal } = req.query;
    if (!username || !password || !goal) {
        res.status(400).json({ success: false, reason: 'bad request' });
        return;
    }
    const doc = db.collection('users').doc(username);
    if ((await doc.get()).exists) {
        res.json({ success: false, reason: 'taken' });
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
    res.json(username);
});

// add new entry route
app.get('/newEntry', async (req, res) => {
    // get info from GET params
    let { desc = '', password, username, tags = [], cash } = req.query;
    if (!password || !username || !cash) {
        res.status(400).json({ success: false, reason: 'bad request' });
        return;
    }
    username = username.slice(1, -1);
    if (tags.length > 0) tags = tags.split(',').map((el) => el.trim());
    cash = parseInt(cash);
    const doc = db.collection('users').doc(username);
    const getDoc = await doc.get();
    if (!getDoc.exists) {
        res.status(400).json({ success: false, reason: 'invalid username' });
        return;
    }
    doc.update({
        // push on to entries array
        entries: firebase.firestore.FieldValue.arrayUnion({
            desc,
            cash,
            date_added: firebase.firestore.FieldValue.serverTimestamp(),
            tags
        })
    });
    res.json({ success: true });
});

app.get('/getGraphs', async (req, res) => {
    const { username, password } = req.query;
    if (!username || !password) {
        res.status(400).json({ success: false, reason: 'missing' });
        return;
    }
    const doc = await db.collection('users').doc(username).get();
    if (!doc.exists || !(await bcrypt.compare(password, doc.data().password))) {
        res.status(403).json({ success: false, reason: 'invalid' });
        return;
    }
    let c = 0;
    const labels = [];
    const data = [];
    for (const entry of doc.data().entries) {
        labels.push(`${entry.date_added.toDate().getMonth() + 1}/${entry.date_added.toDate().getFullYear() % 100}`);
        c += entry.cash;
        data.push(c);
    }
    res.send(await generateGraph(labels, data));
});

app.listen(3000, () => console.log('app listening on port 3000'));