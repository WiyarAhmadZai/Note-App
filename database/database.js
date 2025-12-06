import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
let db;

if (!isWeb) {
  db = SQLite.openDatabase('notes.db');
}

// Web-based storage using localStorage
const getWebNotes = async () => {
  const notesJSON = localStorage.getItem('notes');
  return notesJSON ? JSON.parse(notesJSON) : [];
};

const setWebNotes = async (notes) => {
  localStorage.setItem('notes', JSON.stringify(notes));
};

export const init = () => {
  if (isWeb) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, audioUri TEXT);',
        [],
        resolve,
        (_, err) => reject(err)
      );
    });
  });
};

export const insertNote = async (title, content, audioUri) => {
  if (isWeb) {
    const notes = await getWebNotes();
    const newNote = { id: Date.now(), title, content, audioUri };
    notes.push(newNote);
    await setWebNotes(notes);
    return { insertId: newNote.id };
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO notes (title, content, audioUri) VALUES (?, ?, ?);',
        [title, content, audioUri],
        (_, result) => resolve(result),
        (_, err) => reject(err)
      );
    });
  });
};

export const fetchNotes = async () => {
  if (isWeb) {
    return getWebNotes();
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM notes;',
        [],
        (_, result) => resolve(result.rows._array),
        (_, err) => reject(err)
      );
    });
  });
};

export const updateNote = async (id, title, content, audioUri) => {
  if (isWeb) {
    let notes = await getWebNotes();
    const noteIndex = notes.findIndex((note) => note.id === id);
    if (noteIndex > -1) {
      notes[noteIndex] = { id, title, content, audioUri };
      await setWebNotes(notes);
    }
    return;
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE notes SET title = ?, content = ?, audioUri = ? WHERE id = ?;',
        [title, content, audioUri, id],
        resolve,
        (_, err) => reject(err)
      );
    });
  });
};

export const deleteNote = async (id) => {
  if (isWeb) {
    let notes = await getWebNotes();
    notes = notes.filter((note) => note.id !== id);
    await setWebNotes(notes);
    return;
  }
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM notes WHERE id = ?;',
        [id],
        resolve,
        (_, err) => reject(err)
      );
    });
  });
};
