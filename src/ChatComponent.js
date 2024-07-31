import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';
import './ChatComponent.css';

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
  const [showStartButton, setShowStartButton] = useState(true);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(`
    The Korean marketing team at Speak, an English language learning app service, wants to create specific documentation for each project. Check out the provided 'Format' and 'Guide' to help user's project documentation.

---
#Format

<aside>
✅ **[Reminder] How to plan a good project

1. Every project has one project lead.** Project lead is responsible for success & sharing of the project. 
**2. Every project must have a clear goal.** The goal must contribute to the pod & larger team's goal. The goal must be answered in "achieved - yes/no" format. 
**3. Every project must have a clear start & end date.** 
**4. Every project should have a clear retrospective.**

</aside>

## 🔹 Project One-liner

*Why are we doing this? What is the deliverable / clear outcome of the project? Are there any risks involved in this?* 

---

---

## 🔹 Progress Update

Last updated as of: [   ] 

---

- Past update

---

## 🔹 Why?

- What problem are we solving
    - For Speak
    - For users
        - Who are the targets?

## 🔹 Goal

- Qualitative goal (if any - must be answered in "achieved? Yes/No")
- Quantitative, measurable goal
    - Dashboard / ways to measure it
- **Guide on setting a good goal**
    - If unsure, set "Baseline / Good / Stretch" scenario
        - **Baseline:** if we just proceeded as-is, what is the baseline outcome?
        - **Good:** If you did your absolute best, you're confident we can achieve this goal
        - **Stretch:** If you have done your absolute best, you are 70% certain that we might be able to achieve this goal.

## 🔹 Hypotheses

## 🔹 Plan & Timeline - How do we achieve the goal?

- Resource
    - People
    - Budget
- Risk factors to think about
- Key components

## 🔹 Meeting Notes

## 🔹 Result & Learning

----
# Guide
## Global Guide
- Make sure to speak to 'User' in Korean. Unless when giving final documentation.
- Ask only one detailed question at a time. Each question should be answerable in a sentence. *very important

## Process
1. check ‘#Format' and understand what it is, and what it looks like.
2. Start with questions about the project itself. Only one question at a time.
2-1. Ask what it's for
2-2. Ask what it does
2-3. Name project by user's answer and ask if the name is okay.
2-4. If user says the name is okay proceed to 3.
2-5. If user says the name is not okay, ask user to name the project.

3. check ‘#Format' again and define what information you need to fill project documentation in as much detail as possible.
4. from those questions, seperate questions into as detailed as possible. doesn't mean to write
- Example Original question: Why are we doing this? What is the deliverable / clear outcome of the project? Are there any risks involved in this?)
- Seperated Version: 
    - Why are we doing this?
    - What is the deliverable / clear outcome of the project?
    - Are there any risks involved in this?
5. Ask specific questions to the 'User' to get the information you need for each items you sperated in 4. Only one question at a time.
- Bad example of question: 이 프로젝트를 통해 어떤 문제를 해결하고자 하는지, 그리고 이 프로젝트가 Speak와 사용자에게 어떤 가치를 제공하는지에 대해 설명해 주세요. 또한, 이 프로젝트의 대상 사용자는 누구인가요?
- Good example of question: 이 프로젝트를 통해 어떤 문제를 해결하고자 하나요?
6. After you get an answer from the 'User', evaluate whether you have enough information to add content to the '#Format'.
7. If you don't think you've gotten enough information, identify what more information you need, and ask the 'User' more specific questions to make sure you get all the information you need.
8. If you feel you've gotten enough information, move on to the next question.
9. When you're done with all the questions, check back over the whole thing to summarize and confirm with 'User' that you're happy to proceed with the documentation as is and write in English.
10. If 'User' asks for additional edits, make them and go back to 9.
11. If 'User' says go ahead, fill in the content in English, keeping the 'Format' 100% intact. Final documentation should be in English(100%).

`);
  const [temperature, setTemperature] = useState(0.1);

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
    if (input.trim() === '' && e.target.value === undefined) return;

    const userMessage = input || e.target.value;
    setInput('');
    setIsLoading(true);
    setShowStartButton(false);

    if (!conversationId) {
      setConversationId(uuidv4());
    }

    try {
      const messagesRef = collection(db, 'conversations', conversationId || 'temp', 'messages');
      await addDoc(messagesRef, { 
        role: 'user', 
        content: userMessage,
        timestamp: new Date()
      });
      
      const chatGPT = httpsCallable(functions, 'chatGPT');
      await chatGPT({ 
        message: userMessage,conversationId: conversationId || 'temp',
        systemPrompt: systemPrompt,
        temperature: temperature
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="prompt-and-temperature-container">
        <div className="system-prompt-container">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="system-prompt-input"
          />
        </div>
        <div className="temperature-container">
          <label htmlFor="temperature">Temperature: </label>
          <input
            type="number"
            id="temperature"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            step="0.1"
            min="0"
            max="2"
          />
        </div>
      </div>
      <div className="chat-container">
        {showStartButton && (
          <div className="start-button-container">
            <button onClick={() => sendMessage({ preventDefault: () => {}, target: { value: '프로젝트 문서 작성을 도와주세요' } })} className="start-button">
              프로젝트 문서 작성을 도와주세요
            </button>
          </div>
        )}
        <div className="message-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="loading-animation">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}

export default ChatComponent;