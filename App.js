import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { init } from './database/database';
import NoteListScreen from './screens/NoteListScreen';
import NoteDetailScreen from './screens/NoteDetailScreen';
import { Text } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setDbInitialized(true);
        console.log('Database initialized');
      })
      .catch((err) => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  if (!dbInitialized) {
    return <Text>Initializing database...</Text>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2c3e50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Notes"
          component={NoteListScreen}
          options={{ title: 'My Notes' }}
        />
        <Stack.Screen
          name="NoteDetail"
          component={NoteDetailScreen}
          options={{ title: 'Edit Note' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
