import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { fetchNotes } from '../database/database';

const NoteListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadNotes = async () => {
        const loadedNotes = await fetchNotes();
        setNotes(loadedNotes.reverse());
      };
      loadNotes();
    }, [])
  );

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        {item.audioUri && <Icon name="microphone" size={16} color="#888" />}
      </View>
      <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notes yet. Tap the + button to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteDetail')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  noteItem: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 3 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  noteContent: { fontSize: 14, color: '#666', marginTop: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888' },
  fab: { position: 'absolute', right: 30, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabIcon: { fontSize: 30, color: 'white' },
});

export default NoteListScreen;
