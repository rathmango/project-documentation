import React from 'react';
import './Message.css';

function Message({ text, isUser }) {
  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">{text}</div>
    </div>
  );
}

export default Message;