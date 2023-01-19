import React, { useContext, useCallback, useState, useEffect} from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';

//import default message and set value in a constant
import BOT_MESSAGE from '../../../common/constants/initialBottyMessage';
const defaultBotMessage = {
  message: BOT_MESSAGE,
  id: Date.now(),
  user: "bot"
}

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);

function Messages() {

  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);

  //used to render the TypingMessage component
  const [ typing, setTyping ] = useState(false);
  //message either sent by the bot or the user
  const [ message, setMessage ] = useState();
  //list of messages sent by both parties
  const [ list, setList ] = useState([defaultBotMessage]);

  //scroll to bottom when a message is sent/received
  const handleScroll = () => {
    const scroll = document.getElementById('message-list');
    scroll.scrollTop = scroll.scrollHeight;

  }

  //handle sending a message
  const sendMessage = () => {
    socket.emit('user-message', message);
    setList([...list, message]);
    setMessage({
      message:"",
      id: null,
      user: ""
    });
    setLatestMessage(message);
    playSend();
    handleScroll();
  }

  //handle bot typing
  const handleBotTyping = useCallback( () => {
    setTyping(true);
    handleScroll();
  }, []);


  //handle receiving a message
  const handleBotMessage = useCallback((message) => {
    console.log(message);
    setTyping(false);
    setList([...list, message]);
    setLatestMessage(message);
    playReceive();
    handleScroll();
  }, [list, playReceive, setLatestMessage]);


  //each time a key is pressed, this function is called
  const onChangeMessage = useCallback((e) => {
    setMessage({
      ...message,
      message: e.target.value,
      id: Date.now(),
      user: "me"
    });
  }, [message]);


  //socket listeners
  useEffect(() => {
    socket.on('bot-typing',handleBotTyping);
    socket.on('bot-message',handleBotMessage);

    //disconnect socket on unmount
    return () => {
      socket.off('bot-typing',handleBotTyping);
      socket.off('bot-message',handleBotMessage);
    }
  }, [handleBotTyping, handleBotMessage]);

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {/*render the list of messages*/}
        {list.map((message) => (
          <Message
            message={message}
          />
        ))}
        {/*render the typing message*/}
        { typing && <TypingMessage />}
      </div>
      <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}



export default Messages;
