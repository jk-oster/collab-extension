// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {
    addDoc,
    doc,
    getDoc,
    getFirestore,
    setDoc,
    collection,
    query,
    getDocs,
    onSnapshot,
    deleteDoc,
    setLogLevel,
} from "firebase/firestore";

import {store} from "@/store";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebase = {
    apiKey: "AIzaSyBxorgma0ZR8nQ5VsZVb500T0_ErujuvKY",
    authDomain: "collab-extension.firebaseapp.com",
    projectId: "collab-extension",
    storageBucket: "collab-extension.appspot.com",
    messagingSenderId: "673987011087",
    appId: "1:673987011087:web:1ed01d5729bc5cd4ab397a"
};

// Initialize Firebase
const app = initializeApp(firebase);

export const db = getFirestore(app);


// setLogLevel("debug");


//----------------------------------------------------------------

export function createQuery(path, ...queryConstraints) {
    return query(collection(db, path), ...queryConstraints);
}

export async function setData(data, path, ...pathSegments) {
    const docRef = doc(db, path, ...pathSegments);
    await setDoc(docRef, data);
}

export async function updateData(data, path, ...pathSegments) {
    const docRef = doc(db, path, ...pathSegments);
    await docRef.update(data);
}

export async function addData(path, data) {
    try {
        return await addDoc(collection(db, path), data);
    } catch (error) {
        console.error("Error adding document", error);
        return null;
    }
}

export async function getDocData(path, pathSegments) {
    const docRef = doc(db, path, pathSegments);
    return getDataFromDocRef(docRef);
}

export async function getDataFromDocRef(docRef) {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        console.error("No such document! " + docRef.path);
        console.error(docRef);
        return null;
    }
    return docSnap.data();
}

export async function getDataFromQuery(path, ...queryConstraints) {
    const q = createQuery(path, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    let result = [];
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        data.id = doc.id;
        result.push(data);
    });
    return result;
}

//----------------------------------------------------------------
// Firebase Realtime Database Helpers
//----------------------------------------------------------------

// Get a random id for user or session
export function getRandId(length = 15) {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join("");
}

// Add new session to firebase
export async function addNewSession(session = {id: getRandId()}) {
    // store.currentChat = chat;
    return {
        data: await setData(session, `sessions`, session.id),
        id: session.id
    };
}

// Update user position in session in firebase
export async function updatePosition({position = {mouseX: 0, mouseY: 0}, sessionId, userId}) {
    console.log("trying to updatePosition", position, userId, sessionId);
    return setData(position, `sessions`, sessionId, "users", userId);
}

// Add user to session in firebase
export async function addUserToSession({user = {mouseX: 0, mouseY: 0}, sessionId, userId}) {
    console.log("trying to addUserToSession", user, userId, sessionId);
    return setData(user, `sessions`, sessionId, "users", userId);
}

// Add shape to session in firebase
export async function addShapeToSession({shape = {top: 0, left: 0, width: 10, height: 10, user: '', date: 0, id: '', url: ''}, shapeId, sessionId}) {
    return setData(shape, `sessions`, sessionId, "shapes", shapeId);
}

// Add message to session in firebase
export async function addMessageToSession({ message = {user: "", message: "", id: "", date: 0}, messageId, sessionId}) {
    console.log("trying to addMessageToSession", message, messageId, sessionId);
    return setData(message, `sessions`, sessionId, "messages", messageId);
}

// Delete session from firebase
export async function deleteSession({sessionId}) {
    return deleteDoc(doc(db, "session", sessionId));
}

// Delete user from session in firebase
export async function deleteSessionUser({sessionId, userId}) {
    return deleteDoc(doc(db, `sessions`, sessionId, "users", userId));
}

// Delete shape from session in firebase
export async function deleteSessionShape({sessionId, shapeId}) {
    return deleteDoc(doc(db, `sessions`, sessionId, "shapes", shapeId));
}

// Delete message from session in firebase
export async function deleteSessionMessage({sessionId, messageId}) {
    return deleteDoc(doc(db, `sessions`, sessionId, "messages", messageId));
}

export async function getSession(sessionId) {
    store.session = getDataFromDocRef(`sessions/${sessionId}`);
}

// // dispatch update event to listen to
// const event = new CustomEvent('positions-updated');
// window.dispatchEvent(event);

export function initWatchingUsers(sessionId, callback) {
    const usersQuery = createQuery(`sessions/${sessionId}/users`);
    initWatchingFirebase(usersQuery, callback);
}


// // dispatch update event to listen to
// const event = new CustomEvent('messages-updated');
// window.dispatchEvent(event);
export function initWatchingMessages(sessionId, callback) {
    const messagesQuery = createQuery(`sessions/${sessionId}/messages`);
    initWatchingFirebase(messagesQuery, callback);
}


// // dispatch update event to listen to
// const event = new CustomEvent('shapes-updated');
// window.dispatchEvent(event);
export function initWatchingShapes(sessionId, callback) {
    const shapesQuery = createQuery(`sessions/${sessionId}/shapes`);
    initWatchingFirebase(shapesQuery, callback);
}

export function initWatchingFirebase(query, handler) {
    onSnapshot(query, async (querySnapshot) => {
        let data = [];
        querySnapshot.forEach((snapShotDoc) => {
            data.push(snapShotDoc.data());
        });

        if (handler) {
            handler(data);
        }
    });
}


