const functions = require("firebase-functions");
const {OpenAI} = require("openai");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

exports.chatGPT = functions.https.onCall(async (data, context) => {
  const {message, conversationId, systemPrompt, temperature} = data;

  try {
    console.log(`Received message: ${message}`);
    console.log(`Conversation ID: ${conversationId}`);

    const messagesRef = db.collection("conversations")
        .doc(conversationId)
        .collection("messages");
    const snapshot = await messagesRef.orderBy("timestamp", "asc").get();
    const messages = snapshot.docs.map((doc) => doc.data());

    console.log(`Retrieved ${messages.length} messages from Firestore`);

    let fileSystemPrompt = "";
    try {
      const promptPath = path.join(__dirname, "prompt.txt");
      fileSystemPrompt = fs.readFileSync(promptPath, "utf8");
    } catch (error) {
      console.warn("Failed to read prompt.txt file:", error);
      // 파일을 읽지 못해도 계속 진행
    }

    const combinedSystemPrompt = systemPrompt +
      (fileSystemPrompt ? "\n" + fileSystemPrompt : "");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "system", content: combinedSystemPrompt},
        ...messages.map((msg) => ({role: msg.role, content: msg.content})),
        {role: "user", content: message},
      ],
      temperature: temperature || 0.6,
    });

    const assistantReply = response.choices[0].message.content;

    console.log(`Received reply from OpenAI: ${assistantReply}`);

    await messagesRef.add({
      role: "assistant",
      content: assistantReply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {reply: assistantReply};
  } catch (error) {
    console.error("Error in chatGPT function:", error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    }
    throw new functions.https.HttpsError(
        "internal",
        "챗봇 응답 생성 중 오류가 발생했습니다.",
        error.message,
    );
  }
});
