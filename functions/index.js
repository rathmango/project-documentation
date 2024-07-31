const functions = require("firebase-functions");
const {OpenAI} = require("openai");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

exports.chatGPT = functions.https.onCall(async (data, context) => {
  const {message, conversationId} = data;

  try {
    console.log(`Received message: ${message}`);
    console.log(`Conversation ID: ${conversationId}`);

    // 대화 기록 가져오기
    const messagesRef = db.collection("conversations")
        .doc(conversationId)
        .collection("messages");
    const snapshot = await messagesRef.orderBy("timestamp", "asc").get();
    const messages = snapshot.docs.map((doc) => doc.data());

    console.log(`Retrieved ${messages.length} messages from Firestore`);

    // GPT API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages.map((msg) => ({role: msg.role, content: msg.content})),
    });

    const assistantReply = response.choices[0].message.content;

    console.log(`Received reply from OpenAI: ${assistantReply}`);

    // 어시스턴트의 응답 추가
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
