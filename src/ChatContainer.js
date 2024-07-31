import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import './ChatContainer.css';

function ChatContainer() {
  const [messages, setMessages] = useState([]);

  const addMessage = (text, isUser) => {
    setMessages([...messages, { text, isUser }]);
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <InputArea onSendMessage={(text) => addMessage(text, true)} />
    </div>
  );
}

export default ChatContainer;