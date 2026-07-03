/* ============================================================
   firebase-config.js — Firebase Configuration (Single Point of Setup)
   
   INSTRUKSI: 
   1. Buka Firebase Console (https://console.firebase.google.com/)
   2. Buat project baru atau gunakan yang sudah ada
   3. Copy config dari Firebase Console > Project Settings
   4. Paste value di bawah ini (jangan ubah variable name)
   5. Pastikan Firestore, Authentication, dan Storage sudah enabled
   
   Contoh nilai yang akan Anda copy:
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "project.firebaseapp.com",
     projectId: "project-id",
     ...
   };
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyC2ctvg2Oe5EKOvhkAgxitJZbSbz6DjOP4",
  authDomain: "onlinestoreindahsbeauteatalier.firebaseapp.com",
  projectId: "onlinestoreindahsbeauteatalier",
  storageBucket: "onlinestoreindahsbeauteatalier.firebasestorage.app",
  messagingSenderId: "46260871626",
  appId: "1:46260871626:web:6666dc366a08b86751ef33",
  measurementId: "G-SDQYTXTEHD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references (global)
window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

// Enable offline persistence (untuk cache data lokal saat offline)
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("❌ Multiple tabs open - persistence disabled");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ Browser tidak support offline persistence");
    }
  });

console.log("✅ Firebase initialized successfully");
