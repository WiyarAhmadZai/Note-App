import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';
import { insertNote, updateNote, deleteNote, fetchNotes } from '../database/database';

const NoteDetailScreen = ({ route, navigation }) => {
  const { noteId } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);

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
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [noteId, navigation, sound]);

  const loadNote = async () => {
    const notes = await fetchNotes();
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setAudioUri(note.audioUri);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
  };

  const playSound = async () => {
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isPlaying) {
        setIsPlaying(false);
      }
    });
  };

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
      console.error(error);
      Alert.alert('Error', 'Could not save the note.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
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
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.titleInput} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.contentInput} placeholder="Start writing your note..." value={content} onChangeText={setContent} multiline />
      {audioUri && (
        <TouchableOpacity style={styles.audioPlayer} onPress={playSound}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
          <Text style={styles.audioText}>Voice Note</Text>
        </TouchableOpacity>
      )}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Note</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.micButton} onPressIn={startRecording} onPressOut={stopRecording}>
          <Icon name="microphone" size={24} color={recording ? 'red' : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  titleInput: { backgroundColor: 'white', fontSize: 22, fontWeight: 'bold', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
  contentInput: { flex: 1, backgroundColor: 'white', fontSize: 16, padding: 15, borderRadius: 10, textAlignVertical: 'top', elevation: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  saveButton: { flex: 1, backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  micButton: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 50, marginLeft: 10 },
  headerButton: { marginRight: 15 },
  headerButtonText: { color: '#fff', fontSize: 16 },
  audioPlayer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, marginTop: 20 },
  audioText: { color: 'white', marginLeft: 10, fontSize: 16 },
});

export default NoteDetailScreen;
