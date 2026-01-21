
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Vehicle, CheckRecord } from "./types";

export const analyzeVehicleCondition = async (photos: string[]): Promise<string> => {
  if (!photos.length) return "Nenhuma foto fornecida para análise.";

  try {
    // Initializing Gemini API inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const photoParts = photos.map(base64 => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64.split(',')[1] || base64
      }
    }));

    // Using systemInstruction for persona and task requirements
    // Fix: Using gemini-3-pro-preview as it is the recommended model for complex reasoning and image tasks
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: photoParts
      },
      config: {
        systemInstruction: "Você é um perito mecânico de frotas policiais. Analise as fotos deste veículo e gere um laudo rigoroso. Foque em: 1. Amassados ou arranhões visíveis. 2. Estado aparente dos pneus. 3. Limpeza. 4. Se o veículo parece operacionalmente pronto. Formato de resposta: [LAUDO TÉCNICO]: (Descreva em 3 linhas), [AVARIAS DETECTADAS]: (Sim/Não - Liste), [STATUS]: (PRONTO/MANUTENÇÃO). Use linguagem militar e direta."
      }
    });

    // Accessing .text property directly as per SDK guidelines
    return response.text || "Não foi possível gerar uma análise estruturada.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erro ao processar análise técnica de IA.";
  }
};

export const getFleetBriefing = async (vehicles: Vehicle[], recentRecords: CheckRecord[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = `
      FROTA ATUAL: ${JSON.stringify(vehicles.map(v => ({p: v.plate, m: v.model, s: v.status})))}
      AVARIAS RECENTES: ${JSON.stringify(recentRecords.filter(r => r.notes).map(r => ({v: r.vehicleId, n: r.notes})))}
    `;

    // Task-specific instructions moved to systemInstruction
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
      config: {
        systemInstruction: "Com base nos dados fornecidos, gere um BRIEFING OPERACIONAL militar de 3 parágrafos. Destaque disponibilidade e pontos críticos de manutenção."
      }
    });

    return response.text || "Briefing indisponível no momento.";
  } catch (error) {
    return "Falha ao processar inteligência da frota.";
  }
};
