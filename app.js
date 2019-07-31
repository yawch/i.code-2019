'use strict';

const firebase = require('firebase-admin'),
      express = require('express'),
      bcrypt = require('bcrypt');  // used for password hashing
      //{ CanvasRenderService } = require('chartjs-node-canvas');

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
    const { desc } = req.query,
          username = req.query.username.slice(1, -1),
          tags = req.query.tags.split(',').map((el) => el.trim()),
          cash = parseInt(req.query.cash);
    if (tags.length === 0) tags = undefined;
    // checking for valid data
    if (!username || !cash) {
        res.status(400).json({ success: false, reason: 'bad request' });
        return;
    }
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
            date_added: new Date(),
            tags
        })
    });
    res.json({ success: true });
});

// app.get('/getGraphs', async (req, res) => {
//     const { username, password } = req.query;
//     if (!username || !password) {
//         res.status(400).json({ success: false, reason: 'missing' });
//         return;
//     }
//     const doc = await db.collection('users').doc(username).get();
//     if (!doc.exists || !(await bcrypt.compare(password, doc.data().password))) {
//         res.status(403).json({ success: false, reason: 'invalid' });
//         return;
//     }
//     const canvasRenderService = new CanvasRenderService(500, 500, (ChartJS) => {
//         ChartJS.defaults.global.defaultFontColor = "#fff";
//         ChartJS.defaults.global.legend.display = false;
//     });
//     const dataUrl = await canvasRenderService.renderToDataURL({
//         type: 'line',
//         data: {
//             labels: ['01/19', '02/19', '03/19', '04/19', '05/19', '06/19', '07/19'],
//             datasets: [{ 
//                 data: [86, 114, 106, 106, 107, 111, 133, 221],
//                 borderColor: "#3e95cd",
//                 fill: false
//             }]
//         },
// });
//     console.log(dataUrl);
//     res.send(dataUrl);
// });

app.listen(3000, () => console.log('app listening on port 3000'));