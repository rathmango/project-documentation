import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDk7R_vZ2EuGUt8U52MOB_C5LWxDo0BXhI",
    authDomain: "proejct-documentation.firebaseapp.com",
    databaseURL: "https://proejct-documentation-default-rtdb.firebaseio.com",
    projectId: "proejct-documentation",
    storageBucket: "proejct-documentation.appspot.com",
    messagingSenderId: "569523579409",
    appId: "1:569523579409:web:4b449accb2591af2f4dfb0",
    measurementId: "G-0BY9JDK9LK"
  };


  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const functions = getFunctions(app);
  
  function ChatComponent() {
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
  
    useEffect(() => {
      if (!conversationId) {
        setConversationId(uuidv4());
      } else {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
          setMessages(newMessages);
        });
        return () => unsubscribe();
      }
    }, [conversationId]);
  
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
  
    const sendMessage = async (e) => {
      e.preventDefault();
      if (input.trim() === '') return;
  
      const chatGPT = httpsCallable(functions, 'chatGPT');
      try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, { 
          role: 'user', 
          content: input,
          timestamp: new Date()
        });
        await chatGPT({ message: input, conversationId });
        setInput('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };
  
    return (
      <div className="chat-container">
        <div className="message-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="message-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="message-input"
          />
          <button type="submit" className="send-button">전송</button>
        </form>
      </div>
    );
  }
  
  export default ChatComponent;