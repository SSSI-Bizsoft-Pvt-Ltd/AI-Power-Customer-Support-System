# Phase 4 Configuration: Orchestration & AI

This document contains the configurations needed to finalize the AI-powered support system during Phase 4.

## 1. AI Prompt Engineering (FR-4, FR-5)

Use these prompts in your `classifyAndExtractTask` and `filterMessageNoise` logic for the best results:

### Ingestion Filter Prompt
```text
You are a high-speed noise filtering engine for a WhatsApp customer support system. 
Input: A raw WhatsApp message.
Task: Determine if the user is asking for assistance, reporting an issue, or making a request.
Output: JSON object {"isActionable": boolean}.
Rules:
- Greetings and general banter -> false.
- Bug reports, help requests, feature requests -> true.
```

### Classification Prompt
```text
You are an expert customer support agent. 
Analyze the customer's message and extract a structured task.
Output: JSON object:
{
  "category": "Critical Bug" | "Feature Request" | "Support Request" | "General Inquiry",
  "confidenceScore": number (0-100),
  "title": "One sentence summary mapping the core problem",
  "summary": "Concise technical description",
  "priority": "High" | "Medium" | "Low"
}
```

## 2. n8n Orchestration (Recommended Workflow)

To scale, consider using n8n to link your WhatsApp Business API with this backend:

1. **Webhook Node**: Receives data from Meta.
2. **AI Node (OpenRouter)**: Filters and Classifies using the prompts above.
3. **HTTP Request Node**: Calls `POST /api/whatsapp/webhook` on this backend with the processed data.
4. **Wait Node**: Introduces the 2-5s professional delay.
5. **HTTP Request Node**: Sends the confirmation message back to the group.

## 3. Google Cloud Console Setup

- Go to [Google Cloud Console](https://console.cloud.google.com/).
- Create a project and set up **OAuth 2.0 Client ID**.
- Add your domain (`onrender.com`) to permitted JavaScript origins.
- Copy your Client ID and add it to `.env` as `VITE_GOOGLE_CLIENT_ID`.
