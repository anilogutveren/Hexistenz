# Tutorial: Creating a Pull Request Analysis Workflow in n8n

This tutorial shows you step-by-step how to create an AI-powered Pull Request analysis workflow in n8n.

---

## Prerequisites

- Access to an n8n instance
- The following credentials must be set up:
  - GitHub API Token
  - Nexus Chat Model Credentials
  - PostgreSQL Database Credentials

---

## Step 1: Create a New Workflow

1. Open n8n in your browser
2. Click on **"+ Create new workflow"**
3. Give the workflow a name: **"Name - PR Analysis"**
4. The workflow will be saved automatically

---

## Step 2: Add Chat Trigger

### Add Node:
1. Click on the **"+"** symbol in the canvas
2. Search for **"When chat message received"**
3. Select the node

### Configuration:
1. Open the node settings
2. Under **"Options"** you can leave the default settings
3. The node automatically creates a webhook ID for the chat

> **Note:** This trigger allows you to control the workflow via a chat interface. Changes are saved automatically.

---

## Step 3: Add AI Agent

### Add Node:
1. Click on the **"+"** symbol to the right of the GitHub Node
2. Search for **"AI Agent"**
3. Select **"AI Agent"**

### Configuration:

#### Prompt Settings:
1. **Source for Prompt (User Message):** Select **"Define below"**
2. **Text:** Add the following expression:

## Step 4: Add Tools and Chat Memory
Add following nodes:

1. Chat Memory
2. GitHub Tool for Pull Request 

#### 📋 Prompt Expression to Copy:

```
{{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($('Get pull requests of a repository').all().map(item => ({ number: item.json.number, title: item.json.title, state: item.json.state, draft: item.json.draft, author: item.json.user?.login, body: item.json.body, created_at: item.json.created_at, updated_at: item.json.updated_at, closed_at: item.json.closed_at, merged_at: item.json.merged_at, labels: item.json.labels?.map(l => l.name), assignees: item.json.assignees?.map(a => a.login), requested_reviewers: item.json.requested_reviewers?.map(r => r.login), milestone: item.json.milestone?.title || null, head_branch: item.json.head?.ref, base_branch: item.json.base?.ref, url: item.json.html_url })), null, 2) }}
```

**What does this expression do?**
- Fetches the chat message from the user
- Reads all PR items directly from the GitHub node by name
- Maps each PR to a clean, structured object with only the relevant fields: number, title, state, draft status, author, body, timestamps, labels, assignees, reviewers, milestone, branches, and URL
- Passes the result as formatted JSON to the AI Agent, keeping the context lean and well-structured

#### System Message:
Click on **"Options"** → **"System Message"** and add:

#### 📋 System Message to Copy:

```
You are a helpful assistant who answers questions about pull requests in the GitHub repository mb-home/n8n-tutorial-pr-agent. The user asks you a question along with the current pull request data in JSON format. Analyze the data and answer the question.

Rules:
- Refer to specific PR numbers, authors, and dates.
- If the question cannot be answered based on the PR data, state this clearly.
- Summarize information in a structured manner (using lists and tables where appropriate).
```

**What does this System Message do?**
- Defines the role of the AI Agent
- Provides clear instructions for response formatting
- Ensures the agent mentions specific PR details

> **Important:** We'll connect this node to the Chat Model and Memory in the next steps!

---

## Step 6: Add Nexus Chat Model

### Add Node:
1. Click below the AI Agent (on a free area)
2. Search for **"Nexus Chat Model"** (Custom Node)
3. Select **"Nexus Chat Model"**
4. Rename it to **"Nexus Chat Model"**

### Configuration:
1. Open the node settings
2. Select your **Nexus Credential**
   - If not available, create new credentials according to your Nexus configuration

### Create Connection:
1. If not already present: Drag the **AI Language Model** connection (gray cable) from Nexus Chat Model to AI Agent
2. The connection should appear as a dashed gray line

> **Note:** Changes are saved automatically. Sometimes n8n creates this connection automatically – check if it already exists.

---

## Step 7: Add Postgres Chat Memory

### Add Node:
1. Click next to the Nexus Chat Model
2. Search for **"Postgres Chat Memory"**
3. Select **"Postgres Chat Memory"**

### Configuration:
1. Open the node settings
2. Select your **PostgreSQL Credential**
   - If not available:
     - Click on **"Create New Credential"**
     - Enter Host, Port, Database, User and Password
3. Set **"Context Window Length"** to `10`
   - This keeps the last 10 messages as conversation history for the AI Agent
4. The node automatically creates a table for chat history

### Create Connection:
1. If not already present: Drag the **AI Memory** connection (gray cable) from Postgres Chat Memory to AI Agent
2. The connection should appear as a dashed gray line

> **Note:** Changes are saved automatically. Sometimes n8n creates this connection automatically – check if it already exists.

---

## Step 8: Complete Workflow Connections

Make sure all connections are correct:

```
When chat message received → Get pull requests of a repository
                                          ↓
                                      Aggregate
                                          ↓
                                      AI Agent
                                       ↗    ↖
                       Nexus Chat Model     Postgres Chat Memory
```

### Connection Types:
- **Black Lines** (Main): Data flow between nodes
- **Gray Dashed Lines** (AI): AI components (Model, Memory)

---

## Step 9: Test Workflow

### Important Before Testing:
Make sure all 6 nodes are correctly connected (see Step 8).

### Activate Workflow:
1. Look for the **"Publish"** button in the top right
2. Click **"Publish"** to activate the workflow
3. The workflow is now active and ready to receive chat messages
4. Wait briefly until the workflow is fully activated

### Open Chat:
1. Click on the **Chat icon** (💬) in the top right
2. A chat window opens on the right side of the screen

### Ask Test Questions:

Try the following questions:

#### 📋 Sample Questions to Copy:

**Question 1: Open PRs**
```
Which Pull Requests are currently open?
```

**Question 2: Recently Updated**
```
Show me all PRs that were updated in the last 7 days
```

**Question 3: Top Contributor**
```
Who created the most PRs?
```

**Question 4: Filter by Label**
```
Are there any PRs with the label "bug"?
```

**Question 5: Merged PRs**
```
Which PRs were merged this week?
```

**Question 6: Filter by Author**
```
Show me all PRs from user XYZ
```

**Question 7: Code Changes**
```
Which PR has the most code changes?
```

### Expected Behavior:
- The workflow should start automatically
- In the n8n UI you'll see the nodes executing one after another (green checkmarks)
- The AI Agent analyzes the PR data
- You receive a structured response in the chat with specific PR numbers and details

### If Nothing Happens:
1. **Check the Workflow Execution:**
   - Click on **"Executions"** in the left sidebar
   - Check if an execution was started
   - For errors you'll see red marks – click on them for details

2. **Check the Connections:**
   - All black lines (Main) must be connected: Chat Trigger → GitHub → Aggregate → AI Agent
   - AI Agent must have gray connections to Nexus Chat Model and Postgres Memory

3. **Reactivate the Workflow:**
   - Click on the three dots **⋮** in the top right
   - Select **"Deactivate"** (if available)
   - Wait 2 seconds
   - Click **"Publish"** again to reactivate the workflow

---

## Step 10: Export Workflow (Optional)

### Export:
1. Click on the three dots **⋮** in the top right
2. Select **"Download"**
3. The workflow will be downloaded as a JSON file

> **Note:** The workflow is continuously saved automatically. Manual saving is not necessary.

--- Nodemation 


## Troubleshooting

### Problem: "Execute Step" Does Nothing
**Why:**
- Individual nodes can only be executed if they have input data
- The GitHub Node needs data from the Chat Trigger

**Solution:**
- Don't test individual nodes, test the entire workflow via the chat interface
- Activate the workflow and ask a question in the chat

### Problem: GitHub Node Fails
**Solution:**
- Check your GitHub API token
- Make sure you have access to the repository `mb-home/n8n-tutorial-pr-agent`
- Look at the Execution Details (Executions → click on failed execution)

### Problem: AI Agent Does Not Respond
**Solution:**
- Make sure Nexus Chat Model and Postgres Memory are correctly connected
- Check the Nexus Credentials
- Look at the Execution logs for error messages
- Click on the failed node to see details

### Problem: No PR Data is Displayed
**Solution:**
- Check the GitHub Credentials
- Make sure PRs exist in the repository
- Verify the Owner and Repository name in the GitHub Node settings
- Look at the GitHub Node details in the execution

### Problem: Chat Window Does Not Open
**Solution:**
- Make sure the workflow is activated
- Refresh the page (F5)
- Check if the Chat Trigger Node is correctly configured

---

## Advanced Ideas

### Extend Workflow:
- **Return All:** The GitHub node already fetches all PRs. For very large repositories you may want to disable this and set a `Limit` instead to control performance
- **Add Filters:** Use the GitHub node's filter options to query only open or merged PRs
- **Notifications:** Slack notification for new PRs
- **Automatic Reviews:** AI-powered code review comments
- **Statistics:** Create dashboard with PR metrics

### Other Repositories:

Change the **Owner** and **Repository** fields in the GitHub Node:

#### 📋 Examples for Other Repositories:

**For a different repository:**
- Owner: `your-org`
- Repository: `your-repo`

**Example – n8n Repository:**
- Owner: `n8n-io`
- Repository: `n8n`

---

## Appendix: Complete Configuration Data

### 1. GitHub Node – Complete Configuration

| Field | Value |
|---|---|
| Resource | `Repository` |
| Operation | `Get Pull Requests` |
| Owner | `mb-home` |
| Repository | `n8n-tutorial-pr-agent` |
| Return All | `✅ Enabled` |
| Credential | `PUBLIC Github API Credential` |

---

### 2. Aggregate Node – Complete Configuration

| Field | Value |
|---|---|
| Aggregate | `Aggregate All Item Data` |
| Options | *(default)* |

---

### 3. AI Agent – Complete Configuration

**Source for Prompt (User Message):** `Define below`

**Text (Prompt):**
```
{{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($('Get pull requests of a repository').all().map(item => ({ number: item.json.number, title: item.json.title, state: item.json.state, draft: item.json.draft, author: item.json.user?.login, body: item.json.body, created_at: item.json.created_at, updated_at: item.json.updated_at, closed_at: item.json.closed_at, merged_at: item.json.merged_at, labels: item.json.labels?.map(l => l.name), assignees: item.json.assignees?.map(a => a.login), requested_reviewers: item.json.requested_reviewers?.map(r => r.login), milestone: item.json.milestone?.title || null, head_branch: item.json.head?.ref, base_branch: item.json.base?.ref, url: item.json.html_url })), null, 2) }}
```

**System Message (under Options):**
```
You are a helpful assistant who answers questions about pull requests in the GitHub repository mb-home/n8n-tutorial-pr-agent. The user asks you a question along with the current pull request data in JSON format. Analyze the data and answer the question.

Rules:
- Refer to specific PR numbers, authors, and dates.
- If the question cannot be answered based on the PR data, state this clearly.
- Summarize information in a structured manner (using lists and tables where appropriate).
```

---

### 4. Workflow Credentials – Overview

**GitHub API Credential:**
```
Credential Name: PUBLIC Github API Credential
API Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Nexus Credential:**
```
Credential Name: PUBLIC Nexus Credential
```
- Configure according to your Nexus installation
- API Endpoint
- API Key or Auth Token

**PostgreSQL Credential:**
```
Credential Name: PUBLIC Postgres Credential
Host: your-postgres-host
Port: 5432
Database: n8n
User: n8n_user
Password: your_password
SSL: As needed
Context Window Length: 10
```

---

## Summary

You have successfully created an AI-powered Pull Request analysis workflow! 🎉

The workflow:
- ✅ Receives chat messages
- ✅ Automatically fetches **all** PR data from GitHub using the built-in GitHub node
- ✅ Uses AI to answer questions
- ✅ Stores chat history for context

**Have fun experimenting!**
