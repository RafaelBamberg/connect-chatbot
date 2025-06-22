const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");
const { getAuth } = require("firebase/auth");

// Firebase configuration - load from .env file for security
const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID,
  appId: process.env.FIREBASE_APPID,
  measurementId: process.env.FIREBASE_MEASUREMENTID,
  databaseURL: `https://${process.env.FIREBASE_PROJECTID}.firebaseio.com`,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

module.exports = { db, auth };
