// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHPNYlfZM1iXUcgpAiDs460zjBhOBGwwM",
  authDomain: "yourtube-54535.firebaseapp.com",
  projectId: "yourtube-54535",
  storageBucket: "yourtube-54535.firebasestorage.app",
  messagingSenderId: "415834291765",
  appId: "1:415834291765:web:63392c52542f2e41f4fb7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const provider=new GoogleAuthProvider();
export {auth,provider};