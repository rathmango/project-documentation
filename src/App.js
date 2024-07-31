import React from 'react';
import ChatContainer from './ChatContainer';
import ChatComponent from './ChatComponent';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>프로젝트 문서 작성 AI</h1>
      <ChatComponent />
    </div>
  );
}

export default App;