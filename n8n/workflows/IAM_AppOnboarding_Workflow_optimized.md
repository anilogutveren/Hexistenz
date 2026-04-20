# IAM Support Optimized Workflow

This workflow routes chat requests through an AI agent and conditionally escalates long/complex outputs to Devin for asynchronous execution, then posts the final result to Microsoft Teams.

## File

- Workflow JSON: `workflows/IAM_AppOnboarding_Workflow_optimized.json`
- Documentation: `workflows/IAM_AppOnboarding_Workflow_optimized.md`

## High-Level Flow

1. **Chat Trigger** receives a user message.
2. **AI Agent** generates an initial response (`$json.output`).
3. **Should Use Devin?** checks if output length is greater than `300`.
   - **True** -> create Devin session and poll until complete.
   - **False** -> use AI output directly.
4. **Format Message** normalizes final output to `text`.
5. **Send to Teams** posts the response to a Teams webhook.

## Node-by-Node Behavior

### 1) Chat Trigger (`trigger`)
- Type: `@n8n/n8n-nodes-langchain.chatTrigger`
- Public chat endpoint is enabled (`public: true`).

### 2) AI Agent (`ai-agent`)
- Type: `@n8n/n8n-nodes-langchain.agent`
- Input text: `={{ $json.chatInput }}`
- Produces response in `{{$json.output}}`.

### 3) Should Use Devin? (`decide-devin`)
- Type: `n8n-nodes-base.if`
- Condition: `{{$json.output.length}} > 300`
- Branches:
  - **True** -> `Devin Create Session`
  - **False** -> `Fallback to AI`

### 4) Devin Create Session (`devin-create`)
- Type: `n8n-nodes-base.httpRequest`
- Method: `POST`
- URL: `https://api.devinenterprise.com/v1/sessions`
- Body: `{ "prompt": {{$json.output}} }`

### 5) Poll Devin (`poll-loop`)
- Type: `n8n-nodes-base.httpRequest`
- URL: `={{ 'https://api.devinenterprise.com/v1/sessions/' + $json.session_id }}`

### 6) Check Status (`check-status`)
- Type: `n8n-nodes-base.if`
- Condition: `{{$json.status}} == "completed"`
- Branches:
  - **True** -> `Format Message`
  - **False** -> `Wait 5s` then repoll

### 7) Wait 5s (`wait-retry`)
- Type: `n8n-nodes-base.wait`
- Wait amount: `5` seconds
- Loops back to `Poll Devin`

### 8) Fallback to AI (`fallback`)
- Type: `n8n-nodes-base.set`
- Sets `finalText = {{$json.output}}`

### 9) Format Message (`format`)
- Type: `n8n-nodes-base.set`
- Sets `text = {{$json.finalText || $json.output}}`

### 10) Send to Teams (`teams`)
- Type: `n8n-nodes-base.httpRequest`
- Method: `POST`
- URL: `YOUR_TEAMS_WEBHOOK`
- Body: `{ "text": {{$json.text}} }`

## Connection Map

```text
trigger -> ai-agent -> decide-devin

decide-devin (true)  -> devin-create -> poll-loop -> check-status
check-status (false) -> wait-retry -> poll-loop
check-status (true)  -> format -> teams

decide-devin (false) -> fallback -> format -> teams
```

## Required Configuration

Before activating the workflow:

- Replace `YOUR_TEAMS_WEBHOOK` with your actual Microsoft Teams incoming webhook URL.
- Add authentication for Devin API requests (for example, `Authorization: Bearer <DEVIN_API_KEY>`), if required by your environment.
- Ensure the AI Agent node is connected to the intended model/credentials in n8n.

## Notes

- The routing logic optimizes cost/time by only using Devin for longer outputs.
- The polling loop continues until Devin returns `status = completed`.
- Final message formatting ensures a single `text` field is always sent to Teams.
