const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
const { auth, db } = require('./firebase');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } = require('firebase/auth');
const { collection, doc, setDoc, getDoc, getDocs } = require('firebase/firestore');

const app = express();

app.use(bodyParser.json()); // Use body-parser middleware

//CURRENT USER
app.get('/isUser', async (req, res) => {
    onAuthStateChanged(auth, user => {
        if (!user) {
            res.status(200).json({ message: "User not found!" });
        } else {
            const uid = user.uid;
            res.status(200).json({ message: "User found!", uid });
        }
    })
});

//GET CURRENT USER DETAILS
app.get('/getUser', async (req, res) => {
    try {
        const user = auth.currentUser.uid;
        const docRef = doc(db, "users", user);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            res.status(200).json({ message: "User Details", docData: docSnap.data() });
        } else {
            res.status(500).json({ message: "No such data!" });
        }
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).json({ message: errorMessage, errorCode });
    }
});

//GET ALL USERS DETAILS
app.get('/getUsers', async (req, res) => {
    try {
        let documents = [];
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((doc) => {
            documents.push({
                "DocID": doc.id,
                "Data": doc.data()
            });     
        });
        res.status(200).json(documents);
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).json({ message: errorMessage, errorCode });
    }
});

//SIGNUP
app.post('/signup', async (req, res) => {
    const { email, password } = req.body; // Extract data from the request body
    console.log(email, password);

    await createUserWithEmailAndPassword(auth, email, password)
        .then(async userCredential => {
            // User signed up successfully
            const user = userCredential.user;
            const uID = auth.currentUser.uid;
            try {
                const docRef = await setDoc(doc(db, "users", uID), {
                    email: email,
                    password: password,
                    userID: uID
                });
                res.status(200).json({ message: "User signed up successfully", user });
            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                res.status(500).json({ message: errorMessage, errorCode });
            }
        })
        .catch(error => {
            // Error occurred while signing up user
            const errorCode = error.code;
            const errorMessage = error.message;
            res.status(500).json({ message: errorMessage, errorCode });
        });
});

//LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body; // Extract data from the request body
    console.log(email, password);

    await signInWithEmailAndPassword(auth, email, password)
        .then(async userCredential => {
            // User signed up successfully
            const user = userCredential.user;
            res.status(200).json({ message: "User logged in successfully", user });
        })
        .catch(error => {
            // Error occurred while signing up user
            const errorCode = error.code;
            const errorMessage = error.message;
            res.status(500).json({ message: errorMessage, errorCode });
        });
});

//LOGOUT
app.post('/signout', async (req, res) => {
    signOut(auth).then(() => {
        res.status(200).json({ message: "Signout successfully" });
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).json({ message: errorMessage, errorCode });
    });
});

app.get('/', (req, res) => {
    res.send('This is AfterLook');
});

exports.app = functions.https.onRequest(app);
