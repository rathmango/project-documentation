const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let chatHistory = [];

sendButton.addEventListener('click', async () => {
    const userMessage = userInput.value;
    chatHistory.push({ role: 'user', content: userMessage });
    displayMessage(userMessage, 'user');
    userInput.value = '';

    const botResponse = await getBotResponse(chatHistory);
    chatHistory.push({ role: 'assistant', content: botResponse });
    displayMessage(botResponse, 'assistant');
});

function displayMessage(message, role) {
    const messageElement = document.createElement('div');
    messageElement.className = role;
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
}

async function getBotResponse(history) {
    const apiKey = 'YOUR_OPENAI_API_KEY'; // 여기에 OpenAI API 키를 입력하세요.
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: history.map(msg => ({ role: msg.role, content: msg.content })),
            max_tokens: 150 // 응답의 최대 토큰 수
        })
    });

    if (!response.ok) {
        throw new Error('네트워크 응답이 좋지 않습니다.');
    }

    const data = await response.json();
    return data.choices[0].message.content; // 챗봇의 응답 반환
}