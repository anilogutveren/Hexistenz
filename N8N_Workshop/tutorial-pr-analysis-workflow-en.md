# Tutorial: Creating a Pull Request Analysis Workflow in n8n

This tutorial shows you step-by-step how to create an AI-powered Pull Request analysis workflow in n8n.

---

## Prerequisites

- Access to an n8n instance
- The following credentials must be set up:
  - GitHub Enterprise API Token (HTTP Header Auth)
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

## Step 3: Add Config Node (Code)

### Add Node:
1. Click on the **"+"** symbol to the right of the Chat Trigger
2. Search for **"Code"**
3. Select the **Code Node**
4. Rename it to **"Config"**

### Configuration:
1. Open the node settings
2. Make sure **"Run Once for All Items"** is selected
3. Add the following JavaScript code:

#### 📋 Code to Copy:

```javascript
const repoOwner = 'mb-home';
const repoName  = 'n8n-tutorial-pr-agent';
const maxPRs    = 50;

const query = `{
  repository(owner: "${repoOwner}", name: "${repoName}") {
    pullRequests(
      first: ${maxPRs},
      states: [OPEN, CLOSED, MERGED],
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        number
        title
        state
        body
        createdAt
        updatedAt
        mergedAt
        author { login }
        labels(first: 10) { nodes { name } }
        changedFiles
        additions
        deletions
      }
    }
  }
}`;

return [{
  json: {
    requestBody: JSON.stringify({ query })
  }
}];
```

**What does this code do?**
- Defines the GitHub repository (`mb-home/n8n-tutorial-pr-agent`)
- Creates a GraphQL query for the GitHub API
- Fetches the last 50 Pull Requests (open, closed, merged)
- Returns the query as JSON

> **💡 Tip:** You can adjust `repoOwner` and `repoName` to fetch PRs from a different repository.

> **ℹ️ Note:** We can only test this node once the Chat Trigger provides data. We'll do this later in the workflow test. Changes are saved automatically.

---

## Step 4: Add HTTP Request Node

### Add Node:
1. Click on the **"+"** symbol to the right of the Config Node
2. Search for **"HTTP Request"**
3. Select the **HTTP Request Node**

### Configuration:

#### Basic Settings:
- **Method:** `POST`
- **URL:** 
  ```
  https://mercedes-benz.ghe.com/api/graphql
  ```

#### Authentication:
1. Select **"Generic Credential Type"**
2. Select **"Header Auth"**
3. Select **"PUBLIC Github Credential"** from the dropdown list
   - If "PUBLIC Github Credential" is not available:
     - Click on **"Create New Credential"**
     - **Name:** `PUBLIC Github Credential`
     - **Header Name:** `Authorization`
     - **Header Value:** `Bearer YOUR_GITHUB_TOKEN`
       
       > Replace `YOUR_GITHUB_TOKEN` with your actual GitHub Personal Access Token

#### Body:
1. Enable **"Send Body"**
2. Select **"Body Content Type"**: `JSON`
3. Under **"JSON"** enter:

#### 📋 Expression to Copy:

```
={{ $json.requestBody }}
```

**What does this expression do?**
- Takes the `requestBody` from the previous Config Node
- Passes it as JSON to the GitHub API

> **ℹ️ Testing Note:** You cannot test the HTTP Request Node individually yet, as it needs data from the Config Node. We'll test the entire workflow later when all nodes are connected. Changes are saved automatically.

---

## Step 5: Add AI Agent

### Add Node:
1. Click on the **"+"** symbol to the right of the HTTP Request
2. Search for **"AI Agent"**
3. Select **"AI Agent"**

### Configuration:

#### Prompt Settings:
1. **Source for Prompt (User Message):** Select **"Define below"**
2. **Text:** Add the following expression:

#### 📋 Prompt Expression to Copy:

```
={{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($json.data.repository.pullRequests.nodes, null, 2) }}
```

**What does this expression do?**
- Fetches the chat message from the user
- Adds the PR data as formatted JSON
- Both are passed to the AI Agent

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

> **Important:** We'll connect this node to the Chat Model and Memory later!

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

> **Note:** Changes are saved automatically. Sometimes n8n creates this connection automatically - check if it already exists.

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
3. The node automatically creates a table for chat history

### Create Connection:
1. If not already present: Drag the **AI Memory** connection (gray cable) from Postgres Chat Memory to AI Agent
2. The connection should appear as a dashed gray line

> **Note:** Changes are saved automatically. Sometimes n8n creates this connection automatically - check if it already exists.

---

## Step 8: Complete Workflow Connections

Make sure all connections are correct:

```
When chat message received → Config
                              ↓
                          HTTP Request
                              ↓
                          AI Agent
                            ↗   ↖
              Nexus Chat Model   Postgres Chat Memory
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
   - For errors you'll see red marks - click on them for details

2. **Check the Connections:**
   - All black lines (Main) must be connected
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

---

## Troubleshooting

### Problem: "Execute Step" Does Nothing
**Why:** 
- Individual nodes can only be executed if they have input data
- The Config Node needs data from the Chat Trigger
- The HTTP Request Node needs data from the Config Node

**Solution:** 
- Don't test individual nodes, test the entire workflow via the chat interface
- Activate the workflow and ask a question in the chat

### Problem: HTTP Request Fails
**Solution:** 
- Check your GitHub token
- Make sure you have access to the repository
- Check the GitHub Enterprise URL
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
- Test the GraphQL query directly in GitHub (Settings → Developer → GraphQL Explorer)
- Look at the HTTP Request Node details in the execution

### Problem: Chat Window Does Not Open
**Solution:**
- Make sure the workflow is activated
- Refresh the page (F5)
- Check if the Chat Trigger Node is correctly configured

---

## Advanced Ideas

### Extend Workflow:
- **Add Filters:** Query only specific labels or authors
- **Notifications:** Slack notification for new PRs
- **Automatic Reviews:** AI-powered code review comments
- **Statistics:** Create dashboard with PR metrics

### Other Repositories:

Change the variables in the Config Node:

#### 📋 Examples for Other Repositories:

**For a different repository:**
```javascript
const repoOwner = 'your-org';
const repoName  = 'your-repo';
```

**Example - n8n Repository:**
```javascript
const repoOwner = 'n8n-io';
const repoName  = 'n8n';
```

**Example - Internal MB Project:**
```javascript
const repoOwner = 'mb-internal';
const repoName  = 'my-project';
```

---

## Appendix: Complete Configuration Data

### 1. Config Node - Complete Code

#### 📋 Complete Code:

```javascript
const repoOwner = 'mb-home';
const repoName  = 'n8n-tutorial-pr-agent';
const maxPRs    = 50;

const query = `{
  repository(owner: "${repoOwner}", name: "${repoName}") {
    pullRequests(
      first: ${maxPRs},
      states: [OPEN, CLOSED, MERGED],
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        number
        title
        state
        body
        createdAt
        updatedAt
        mergedAt
        author { login }
        labels(first: 10) { nodes { name } }
        changedFiles
        additions
        deletions
      }
    }
  }
}`;

return [{
  json: {
    requestBody: JSON.stringify({ query })
  }
}];
```

---

### 2. HTTP Request - Complete Configuration

**Method:** `POST`

**URL:**
```
https://mercedes-benz.ghe.com/api/graphql
```

**Authentication:**
- Type: `Generic Credential Type`
- Auth Type: `Header Auth`
- Credential: `PUBLIC Github Credential`
  - Header Name: `Authorization`
  - Header Value: `Bearer YOUR_GITHUB_TOKEN`

**Body:**
- Send Body: `✅ Enabled`
- Body Content Type: `JSON`
- JSON:
```
={{ $json.requestBody }}
```

---

### 3. AI Agent - Complete Configuration

**Source for Prompt (User Message):** `Define below`

**Text (Prompt):**
```
={{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($json.data.repository.pullRequests.nodes, null, 2) }}
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

### 4. Workflow Credentials - Overview

**GitHub Enterprise Credential (HTTP Header Auth):**
```
Credential Name: PUBLIC Github Credential
Header Name: Authorization
Header Value: Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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
```

---

## Summary

You have successfully created an AI-powered Pull Request analysis workflow! 🎉

The workflow:
- ✅ Receives chat messages
- ✅ Automatically fetches PR data from GitHub Enterprise
- ✅ Uses AI to answer questions
- ✅ Stores chat history for context

**Have fun experimenting!**
