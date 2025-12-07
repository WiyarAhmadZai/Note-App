import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import Audio from 'expo-audio';
import Icon from 'react-native-vector-icons/FontAwesome';
import { insertNote, updateNote, deleteNote, fetchNotes } from '../database/database';

const isWeb = Platform.OS === 'web';

const NoteDetailScreen = ({ route, navigation }) => {
  const { noteId: initialNoteId } = route.params || {};
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const sound = useRef(isWeb ? null : new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      if (initialNoteId) {
        const notes = await fetchNotes();
        const foundNote = notes.find((n) => n.id === initialNoteId);
        if (foundNote) {
          setNote(foundNote);
          setTitle(foundNote.title);
          setContent(foundNote.content);
          setAudioUri(foundNote.audioUri);
        }
      }
    };
    loadNote();
  }, [initialNoteId]);

  const handleDelete = useCallback(() => {
    if (!note) return;
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(note.id);
            navigation.goBack();
          } catch (error) {
            console.error('Could not delete note:', error);
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  }, [note, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        note ? (
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null,
    });

    return () => {
      sound.current?.unloadAsync();
    };
  }, [navigation, note, handleDelete]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }
    try {
      if (noteId) {
        await updateNote(noteId, title, content, audioUri);
      } else {
        await insertNote(title, content, audioUri);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Could not save note:', error);
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  const startRecording = async () => {
    if (isWeb) return Alert.alert('Unsupported', 'Voice recording is not available on the web.');
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission required', 'Please grant microphone permissions.');

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const playSound = async () => {
    if (!audioUri) return;
    try {
      const { isLoaded, isPlaying: currentlyPlaying } = await sound.current.getStatusAsync();
      if (currentlyPlaying) {
        await sound.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!isLoaded) {
          await sound.current.loadAsync({ uri: audioUri });
        }
        await sound.current.playAsync();
        setIsPlaying(true);
        sound.current.setOnPlaybackStatusUpdate((status) => {
          if (!status.isPlaying) setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.titleInput} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.contentInput} placeholder="Start writing your note..." value={content} onChangeText={setContent} multiline />
      
      {audioUri && (
        <View style={styles.audioContainer}>
          <TouchableOpacity style={styles.playButton} onPress={playSound}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={20} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.audioText}>Voice Note</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        {!isWeb && (
          <TouchableOpacity style={styles.micButton} onPressIn={startRecording} onPressOut={stopRecording}>
            <Icon name="microphone" size={24} color={recording ? '#e74c3c' : '#fff'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  titleInput: { backgroundColor: 'white', fontSize: 22, fontWeight: 'bold', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
  contentInput: { flex: 1, backgroundColor: 'white', fontSize: 16, padding: 15, borderRadius: 10, textAlignVertical: 'top', elevation: 2, marginBottom: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  saveButton: { flex: 1, backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  micButton: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 50, marginLeft: 10 },
  headerButton: { marginRight: 15 },
  headerButtonText: { color: '#fff', fontSize: 16 },
  audioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 10, elevation: 2, marginBottom: 20 },
  playButton: { backgroundColor: '#f0f4f8', padding: 10, borderRadius: 50 },
  audioText: { marginLeft: 15, fontSize: 16, color: '#333' },
});

export default NoteDetailScreen;
