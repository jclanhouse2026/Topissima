
import { GoogleGenAI } from "@google/genai";
import { Service, Appointment, QuickReply } from "../types";

export const getSkinConsultation = async (concerns: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: concerns,
      config: {
        systemInstruction: `Você é uma consultora estética especialista da clínica Topíssima Estética. 
        Responda de forma elegante, acolhedora e profissional. 
        Sugira tratamentos ideais baseados em protocolos de alto padrão.
        Explique brevemente o porquê de cada sugestão e dê dicas gerais de cuidados de beleza e saúde.`,
        temperature: 0.7,
        topP: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching AI consultation:", error);
    return "Desculpe, nossa consultora virtual está em atendimento no momento. Por favor, tente novamente em instantes ou agende uma avaliação presencial.";
  }
};

export const getAiChatResponse = async (
  userMessage: string, 
  history: {role: 'user' | 'model', text: string}[],
  services: Service[],
  appointments: Appointment[],
  businessPhone: string,
  quickReplies: QuickReply[] = []
) => {
  try {
    // 1. Verificação de Gatilhos Manuais (Palavras-chave configuradas pelo ADM)
    const msgLower = userMessage.toLowerCase();
    const triggerMatch = quickReplies.find(qr => 
      msgLower.includes(qr.keyword.toLowerCase())
    );

    if (triggerMatch) {
      return triggerMatch.response;
    }

    // 2. Se não houver gatilho manual, usa a IA Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const servicesContext = services.map(s => `- ${s.name}: ${s.description} (R$ ${s.price})`).join('\n');
    
    const systemInstruction = `Você é o Assistente Virtual da Topíssima Estética.
    Sua missão é ajudar clientes com informações sobre procedimentos, agendamentos e dúvidas gerais da clínica.
    
    REGRAS RÍGIDAS:
    1. Fale apenas sobre os procedimentos da clínica:
    ${servicesContext}
    2. Se o cliente perguntar sobre agendamentos existentes ou quiser verificar informações pessoais, peça o CPF dele de forma educada para que o sistema possa localizar o cadastro.
    3. Se o cliente quiser CANCELAR um agendamento, informe que por políticas da clínica, cancelamentos são feitos exclusivamente via WhatsApp pelo número ${businessPhone}.
    4. Sempre que possível, envie o link do site para novos agendamentos: [Link do Site].
    5. Seja extremamente cordial e profissional.
    6. Se perguntarem algo fora da estética ou da clínica, diga que seu conhecimento é focado em beleza e bem-estar na Topíssima.
    7. Caso o cliente informe o CPF, confirme que os dados foram recebidos e que um atendente humano validará a informação em instantes no painel.`;

    const contents = history.map(h => ({
      parts: [{ text: h.text }],
      role: h.role
    }));

    contents.push({
      parts: [{ text: userMessage }],
      role: 'user'
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Chat AI Error:", error);
    return "Olá! Sou a assistente virtual da Topíssima. No momento estou processando muitas mensagens. Se precisar de algo urgente, por favor chame no nosso WhatsApp!";
  }
};
