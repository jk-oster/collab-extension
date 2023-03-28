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

export function getRandId(length = 15) {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join("");
}

export async function addNewSession(session = {id: getRandId()}) {
    // store.currentChat = chat;
    return {data: setData(session, `sessions`, session.id), id: session.id};
}

export async function updatePosition(position = {mouseX: 0, mouseY: 0}, sessionId, userId) {
    return setData(position, `sessions`, sessionId, "users", userId);
}

export async function addUserToSession(position = {mouseX: 0, mouseY: 0}, userId, sessionId) {
    return setData(position, `sessions`, sessionId, "users", userId);
}

export async function deleteSession(sessionId) {
    return setData({}, `sessions`, sessionId);
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
        let users = [];
        querySnapshot.forEach((snapShotDoc) => {
            users = [...users, snapShotDoc.data()];
        });
        store.users = users;
    });
}


