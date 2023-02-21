import React, { useState, useEffect } from 'react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Text,
  Image,
  TextField,
  View,
  Card,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from './graphql/mutations';
import { BsPinAngleFill } from 'react-icons/bs';

const css = `.custom-card-class {
  background-color: #FFFF99;
  position: relative;
}
.delete-btn {
  color: red;
  border: none;
}

.bg-image {
  background-image: url('https://images.unsplash.com/photo-1558051815-0f18e64e6280?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1738&q=80');
  min-height: 100vh;
  width: 100%;
}

.pin {
  position: absolute;
  top: -12px;
  left: 50%;
}`;

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get('image');
    const data = {
      name: form.get('name'),
      description: form.get('description'),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className='App'>
      <style>{css}</style>
      <Flex direction='row' justifyContent='space-between' margin='2rem'>
        <Heading level={1}>My Notes App</Heading>
        <Button variation='link' onClick={signOut}>
          Sign Out
        </Button>
      </Flex>
      <View as='form' margin='3rem 0' onSubmit={createNote}>
        <Flex direction='row' justifyContent='flex-start' margin='2rem'>
          <TextField
            name='name'
            placeholder='Note Name'
            label='Note Name'
            labelHidden
            required
          />
          <TextField
            name='description'
            placeholder='Note Description'
            label='Note Description'
            labelHidden
            required
          />
          <View
            name='image'
            as='input'
            type='file'
            style={{ alignSelf: 'end' }}
          />
          <Button type='submit' variation='primary'>
            Create Note
          </Button>
        </Flex>
      </View>
      <View as='div' className='bg-image' width='100%' height='100%'>
        <View margin='1rem 0' paddingTop='2rem'>
          <Flex
            direction='row'
            justifyContent='flex-start'
            alignItems='stretch'
            wrap='wrap'
            gap='1rem'
            margin='2rem'
          >
            {notes.map((note) => (
              <Flex key={note.id || note.name}>
                <Card
                  className='custom-card-class'
                  variation='elevated'
                  width={200}
                  height='fit-content'
                >
                  <BsPinAngleFill className='pin' color='red' size={32} />
                  <Flex direction='column' alignItems='flex-start'>
                    <Text as='strong' fontWeight={700}>
                      {note.name}
                    </Text>
                    <Text as='span'>{note.description}</Text>
                    {note.image && (
                      <Image
                        src={note.image}
                        alt={`visual aid for ${notes.name}`}
                        width='50%'
                      />
                    )}
                    <Button
                      className='delete-btn'
                      variation='warning'
                      size='small'
                      onClick={() => deleteNote(note)}
                    >
                      Delete note
                    </Button>
                  </Flex>
                </Card>
              </Flex>
            ))}
          </Flex>
        </View>
      </View>
    </View>
  );
};

export default withAuthenticator(App);
