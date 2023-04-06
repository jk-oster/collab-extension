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
    return {data: setData(session, `sessions`, session.id), id: session.id};
}

// Update user position in session in firebase
export async function updatePosition(position = {mouseX: 0, mouseY: 0}, sessionId, userId) {
    return setData(position, `sessions`, sessionId, "users", userId);
}

// Add user to session in firebase
export async function addUserToSession(position = {mouseX: 0, mouseY: 0}, sessionId, userId) {
    console.log("trying to addUserToSession", position, userId, sessionId);
    return setData(position, `sessions`, sessionId, "users", userId);
}

// Add shape to session in firebase
export async function addShapeToSession(shape = {top: 0, left: 0, width: 10, height: 10, user: '', date: 0, id: '', url: ''}, shapeId, sessionId) {
    return setData(shape, `sessions`, sessionId, "shapes", shapeId);
}

// Add message to session in firebase
export async function addMessageToSession(message = {user: "", message: "", id: "", date: 0}, messageId, sessionId) {
    console.log("trying to addMessageToSession", message, messageId, sessionId);
    return setData(message, `sessions`, sessionId, "messages", messageId);
}

// Delete session from firebase
export async function deleteSession(sessionId) {
    return setData({}, `sessions`, sessionId);
}

// Delete user from session in firebase
export async function deleteSessionUser(sessionId, userId) {
    return setData({}, `sessions`, sessionId, "users", userId);
}

export async function getSession(sessionId) {
    store.session = getDataFromDocRef(`sessions/${sessionId}`);
}

// export async function initSession(id) {
//     const userChatsQuery = createQuery(
//         `sessions`,
//         where("id", "==", id)
//     );
//     onSnapshot(userChatsQuery, async (querySnapshot) => {
//         console.log("session updated");
//         let session = {};
//         querySnapshot.forEach((snapShotDoc) => {
//             session = snapShotDoc.data();
//         });
//         store.users = session.users;
//         store.chats = session.id;
//     });
// }

export async function initUsers(sessionId) {
    const usersQuery = createQuery(`sessions/${sessionId}/users`);
    onSnapshot(usersQuery, async (querySnapshot) => {
        console.log("Users positions updated");

        // dispatch update event to listen to
        const event = new CustomEvent('positions-updated');
        window.dispatchEvent(event);

        let users = [];
        querySnapshot.forEach((snapShotDoc) => {
            users = [...users, snapShotDoc.data()];
        });
        store.users = users;
    });
}

export async function initMessages(sessionId) {
    const messagesQuery = createQuery(`sessions/${sessionId}/messages`);
    onSnapshot(messagesQuery, async (querySnapshot) => {
        console.log("Messages positions updated");

        // dispatch update event to listen to
        const event = new CustomEvent('messages-updated');
        window.dispatchEvent(event);

        let messages = [];
        querySnapshot.forEach((snapShotDoc) => {
            messages = [...messages, snapShotDoc.data()];
        });
        store.messages = messages;
    });
}

export async function initShapes(sessionId) {
    const shapesQuery = createQuery(`sessions/${sessionId}/shapes`);
    onSnapshot(shapesQuery, async (querySnapshot) => {
        console.log("Shapes positions updated");

        // dispatch update event to listen to
        const event = new CustomEvent('shapes-updated');
        window.dispatchEvent(event);

        let shapes = [];
        querySnapshot.forEach((snapShotDoc) => {
            shapes = [...shapes, snapShotDoc.data()];
        });
        store.shapes = shapes;
    });
}


