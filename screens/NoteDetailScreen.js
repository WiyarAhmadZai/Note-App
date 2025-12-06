import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { insertNote, updateNote, deleteNote, fetchNotes } from '../database/database';

const NoteDetailScreen = ({ route, navigation }) => {
  const { noteId } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
    navigation.setOptions({
      headerRight: () => (
        noteId ? (
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [noteId, navigation]);

  const loadNote = async () => {
    const notes = await fetchNotes();
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    try {
      if (noteId) {
        await updateNote(noteId, title, content);
      } else {
        await insertNote(title, content);
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save the note.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Could not delete the note.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.titleInput}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.contentInput}
        placeholder="Start writing your note..."
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  titleInput: {
    backgroundColor: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentInput: {
    flex: 1,
    backgroundColor: 'white',
    fontSize: 16,
    padding: 15,
    borderRadius: 10,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButton: {
    marginRight: 15,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default NoteDetailScreen;
