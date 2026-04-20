# Tutorial: Pull Request Analyse Workflow in n8n erstellen

Dieses Tutorial zeigt dir Schritt für Schritt, wie du einen AI-gestützten Pull Request Analyse-Workflow in n8n erstellst.

---

## Voraussetzungen

- Zugriff auf eine n8n Instanz
- Folgende Credentials müssen eingerichtet sein:
  - GitHub Enterprise API Token (HTTP Header Auth)
  - Nexus Chat Model Credentials
  - PostgreSQL Datenbank Credentials

---

## Schritt 1: Neuen Workflow erstellen

1. Öffne n8n in deinem Browser
2. Klicke auf **"+ Create new workflow"**
3. Gib dem Workflow einen Namen: **"Name - PR Analyse"**
4. Der Workflow wird automatisch gespeichert

---

## Schritt 2: Chat Trigger hinzufügen

### Node hinzufügen:
1. Klicke auf das **"+"** Symbol im Canvas
2. Suche nach **"When chat message received"**
3. Wähle den Node aus

### Konfiguration:
1. Öffne die Node-Einstellungen
2. Unter **"Options"** kannst du die Standardeinstellungen belassen
3. Die Node erstellt automatisch eine Webhook-ID für den Chat

> **Hinweis:** Dieser Trigger ermöglicht es, den Workflow über ein Chat-Interface zu steuern. Änderungen werden automatisch gespeichert.

---

## Schritt 3: Config Node (Code) hinzufügen

### Node hinzufügen:
1. Klicke auf das **"+"** Symbol rechts vom Chat Trigger
2. Suche nach **"Code"**
3. Wähle den **Code Node** aus
4. Benenne ihn um in **"Config"**

### Konfiguration:
1. Öffne die Node-Einstellungen
2. Stelle sicher, dass **"Run Once for All Items"** ausgewählt ist
3. Füge folgenden JavaScript-Code ein:

#### 📋 Code zum Kopieren:

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

**Was macht dieser Code?**
- Definiert das GitHub Repository (`mb-home/n8n-tutorial-pr-agent`)
- Erstellt eine GraphQL-Query für die GitHub API
- Holt die letzten 50 Pull Requests (offen, geschlossen, gemergt)
- Gibt die Query als JSON zurück

> **💡 Tipp:** Du kannst `repoOwner` und `repoName` anpassen, um PRs aus einem anderen Repository abzurufen.

> **ℹ️ Hinweis:** Diese Node können wir erst testen, wenn der Chat Trigger Daten liefert. Das machen wir später im Workflow-Test. Änderungen werden automatisch gespeichert.

---

## Schritt 4: HTTP Request Node hinzufügen

### Node hinzufügen:
1. Klicke auf das **"+"** Symbol rechts von der Config Node
2. Suche nach **"HTTP Request"**
3. Wähle den **HTTP Request Node** aus

### Konfiguration:

#### Grundeinstellungen:
- **Method:** `POST`
- **URL:** 
  ```
  https://mercedes-benz.ghe.com/api/graphql
  ```

#### Authentication:
1. Wähle **"Generic Credential Type"**
2. Wähle **"Header Auth"**
3. Wähle **"PUBLIC Github Credential"** aus der Dropdown-Liste
   - Falls "PUBLIC Github Credential" nicht verfügbar ist:
     - Klicke auf **"Create New Credential"**
     - **Name:** `PUBLIC Github Credential`
     - **Header Name:** `Authorization`
     - **Header Value:** `Bearer DEIN_GITHUB_TOKEN`
       
       > Ersetze `DEIN_GITHUB_TOKEN` mit deinem tatsächlichen GitHub Personal Access Token

#### Body:
1. Aktiviere **"Send Body"**
2. Wähle **"Body Content Type"**: `JSON`
3. Unter **"JSON"** gib ein:

#### 📋 Expression zum Kopieren:

```
={{ $json.requestBody }}
```

**Was macht diese Expression?**
- Nimmt den `requestBody` aus der vorherigen Config Node
- Übergibt ihn als JSON an die GitHub API

> **ℹ️ Hinweis zum Testen:** Du kannst die HTTP Request Node jetzt noch nicht einzeln testen, da sie Daten von der Config Node benötigt. Wir testen den gesamten Workflow später, wenn alle Nodes verbunden sind. Änderungen werden automatisch gespeichert.

---

## Schritt 5: AI Agent hinzufügen

### Node hinzufügen:
1. Klicke auf das **"+"** Symbol rechts vom HTTP Request
2. Suche nach **"AI Agent"**
3. Wähle **"AI Agent"** aus

### Konfiguration:

#### Prompt Settings:
1. **Source for Prompt (User Message):** Wähle **"Define below"**
2. **Text:** Füge folgende Expression ein:

#### 📋 Prompt Expression zum Kopieren:

```
={{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($json.data.repository.pullRequests.nodes, null, 2) }}
```

**Was macht diese Expression?**
- Holt die Chat-Nachricht vom Benutzer
- Fügt die PR-Daten als formatiertes JSON hinzu
- Beide werden an den AI Agent übergeben

#### System Message:
Klicke auf **"Options"** → **"System Message"** und füge ein:

#### 📋 System Message zum Kopieren:

```
You are a helpful assistant who answers questions about pull requests in the GitHub repository mb-home/n8n-tutorial-pr-agent. The user asks you a question along with the current pull request data in JSON format. Analyze the data and answer the question.

Rules:
- Refer to specific PR numbers, authors, and dates.
- If the question cannot be answered based on the PR data, state this clearly.
- Summarize information in a structured manner (using lists and tables where appropriate).
```

**Was macht diese System Message?**
- Definiert die Rolle des AI Agents
- Gibt klare Anweisungen für die Antwortformatierung
- Stellt sicher, dass der Agent konkrete PR-Details nennt

> **Wichtig:** Diese Node verbinden wir später mit dem Chat Model und Memory!

---

## Schritt 6: Nexus Chat Model hinzufügen

### Node hinzufügen:
1. Klicke unterhalb des AI Agent (auf freie Fläche)
2. Suche nach **"Nexus Chat Model"** (Custom Node)
3. Wähle **"Nexus Chat Model"** aus
4. Benenne ihn um in **"Nexus Chat Model"**

### Konfiguration:
1. Öffne die Node-Einstellungen
2. Wähle deine **Nexus Credential** aus
   - Falls nicht vorhanden, erstelle neue Credentials gemäß deiner Nexus-Konfiguration

### Verbindung erstellen:
1. Falls noch nicht vorhanden: Ziehe die **AI Language Model** Verbindung (graues Kabel) vom Nexus Chat Model zum AI Agent
2. Die Verbindung sollte als gestrichelte graue Linie erscheinen

> **Hinweis:** Änderungen werden automatisch gespeichert. Manchmal erstellt n8n diese Verbindung automatisch - überprüfe, ob sie bereits existiert.

---

## Schritt 7: Postgres Chat Memory hinzufügen

### Node hinzufügen:
1. Klicke neben den Nexus Chat Model
2. Suche nach **"Postgres Chat Memory"**
3. Wähle **"Postgres Chat Memory"** aus

### Konfiguration:
1. Öffne die Node-Einstellungen
2. Wähle deine **PostgreSQL Credential** aus
   - Falls nicht vorhanden:
     - Klicke auf **"Create New Credential"**
     - Gib Host, Port, Database, User und Password ein
3. Der Node erstellt automatisch eine Tabelle für Chat-History

### Verbindung erstellen:
1. Falls noch nicht vorhanden: Ziehe die **AI Memory** Verbindung (graues Kabel) vom Postgres Chat Memory zum AI Agent
2. Die Verbindung sollte als gestrichelte graue Linie erscheinen

> **Hinweis:** Änderungen werden automatisch gespeichert. Manchmal erstellt n8n diese Verbindung automatisch - überprüfe, ob sie bereits existiert.

---

## Schritt 8: Workflow-Verbindungen vervollständigen

Stelle sicher, dass alle Verbindungen korrekt sind:

```
When chat message received → Config
                              ↓
                          HTTP Request
                              ↓
                          AI Agent
                            ↗   ↖
              Nexus Chat Model   Postgres Chat Memory
```

### Verbindungstypen:
- **Schwarze Linien** (Main): Datenfluss zwischen Nodes
- **Graue gestrichelte Linien** (AI): AI-Komponenten (Model, Memory)

---

## Schritt 9: Workflow testen

### Wichtig vor dem Test:
Stelle sicher, dass alle 6 Nodes korrekt verbunden sind (siehe Schritt 8).

### Workflow aktivieren:
1. Suche oben rechts nach dem **"Publish"** Button
2. Klicke auf **"Publish"**, um den Workflow zu aktivieren
3. Der Workflow ist jetzt aktiv und bereit, Chat-Nachrichten zu empfangen
4. Warte kurz, bis der Workflow vollständig aktiviert ist

### Chat öffnen:
1. Klicke oben rechts auf das **Chat-Symbol** (💬)
2. Ein Chat-Fenster öffnet sich rechts im Bildschirm

### Testfragen stellen:

Probiere folgende Fragen aus:

#### 📋 Beispielfragen zum Kopieren:

**Frage 1: Offene PRs**
```
Welche Pull Requests sind aktuell offen?
```

**Frage 2: Kürzlich aktualisiert**
```
Zeige mir alle PRs, die in den letzten 7 Tagen aktualisiert wurden
```

**Frage 3: Top Contributor**
```
Wer hat die meisten PRs erstellt?
```

**Frage 4: Nach Label filtern**
```
Gibt es PRs mit dem Label "bug"?
```

**Frage 5: Gemergte PRs**
```
Welche PRs wurden diese Woche gemergt?
```

**Frage 6: Nach Autor filtern**
```
Zeige mir alle PRs von Benutzer XYZ
```

**Frage 7: Code-Änderungen**
```
Welcher PR hat die meisten Code-Änderungen?
```

### Erwartetes Verhalten:
- Der Workflow sollte automatisch starten
- In der n8n UI siehst du, wie die Nodes nacheinander ausgeführt werden (grüne Häkchen)
- Der AI Agent analysiert die PR-Daten
- Du erhältst eine strukturierte Antwort im Chat mit konkreten PR-Nummern und Details

### Falls nichts passiert:
1. **Überprüfe die Workflow-Execution:**
   - Klicke auf **"Executions"** in der linken Sidebar
   - Schau, ob eine Ausführung gestartet wurde
   - Bei Fehlern siehst du rote Markierungen - klicke darauf für Details

2. **Überprüfe die Verbindungen:**
   - Alle schwarzen Linien (Main) müssen verbunden sein
   - AI Agent muss graue Verbindungen zu Nexus Chat Model und Postgres Memory haben

3. **Reaktiviere den Workflow:**
   - Klicke auf die drei Punkte **⋮** oben rechts
   - Wähle **"Deactivate"** (falls verfügbar)
   - Warte 2 Sekunden
   - Klicke erneut auf **"Publish"**, um den Workflow wieder zu aktivieren

---

## Schritt 10: Workflow exportieren (Optional)

### Exportieren:
1. Klicke auf die drei Punkte **⋮** oben rechts
2. Wähle **"Download"**
3. Der Workflow wird als JSON-Datei heruntergeladen

> **Hinweis:** Der Workflow wird kontinuierlich automatisch gespeichert. Ein manuelles Speichern ist nicht notwendig.

---

## Troubleshooting

### Problem: "Execute Step" macht nichts
**Warum:** 
- Einzelne Nodes können nur ausgeführt werden, wenn sie Eingabedaten haben
- Die Config Node braucht Daten vom Chat Trigger
- Die HTTP Request Node braucht Daten von der Config Node

**Lösung:** 
- Teste nicht einzelne Nodes, sondern den gesamten Workflow über das Chat-Interface
- Aktiviere den Workflow und stelle eine Frage im Chat

### Problem: HTTP Request schlägt fehl
**Lösung:** 
- Überprüfe dein GitHub Token
- Stelle sicher, dass du Zugriff auf das Repository hast
- Prüfe die GitHub Enterprise URL
- Schaue in die Execution Details (Executions → auf fehlgeschlagene Execution klicken)

### Problem: AI Agent antwortet nicht
**Lösung:**
- Stelle sicher, dass Nexus Chat Model und Postgres Memory korrekt verbunden sind
- Überprüfe die Nexus Credentials
- Schaue in die Execution-Logs für Fehlermeldungen
- Klicke auf die fehlgeschlagene Node um Details zu sehen

### Problem: Keine PR-Daten werden angezeigt
**Lösung:**
- Überprüfe die GitHub Credentials
- Stelle sicher, dass PRs im Repository existieren
- Teste die GraphQL Query direkt in GitHub (Settings → Developer → GraphQL Explorer)
- Schaue in die HTTP Request Node Details in der Execution

### Problem: Chat-Fenster öffnet sich nicht
**Lösung:**
- Stelle sicher, dass der Workflow aktiviert ist
- Aktualisiere die Seite (F5)
- Überprüfe, ob der Chat Trigger Node korrekt konfiguriert ist

---

## Weiterführende Ideen

### Workflow erweitern:
- **Filter hinzufügen:** Nur bestimmte Labels oder Autoren abfragen
- **Notifications:** Slack-Benachrichtigung bei neuen PRs
- **Automatische Reviews:** AI-gestützte Code-Review-Kommentare
- **Statistiken:** Dashboard mit PR-Metriken erstellen

### Andere Repositories:

Ändere in der Config Node die Variablen:

#### 📋 Beispiele für andere Repositories:

**Für ein anderes Repository:**
```javascript
const repoOwner = 'dein-org';
const repoName  = 'dein-repo';
```

**Beispiel - n8n Repository:**
```javascript
const repoOwner = 'n8n-io';
const repoName  = 'n8n';
```

**Beispiel - Internes MB Projekt:**
```javascript
const repoOwner = 'mb-internal';
const repoName  = 'my-project';
```

---

## Anhang: Vollständige Konfigurationsdaten

### 1. Config Node - Vollständiger Code

#### 📋 Kompletter Code:

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

### 2. HTTP Request - Vollständige Konfiguration

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

### 3. AI Agent - Vollständige Konfiguration

**Source for Prompt (User Message):** `Define below`

**Text (Prompt):**
```
={{ $('When chat message received').first().json.chatInput + '\n\n--- Pull Request Data ---\n' + JSON.stringify($json.data.repository.pullRequests.nodes, null, 2) }}
```

**System Message (unter Options):**
```
You are a helpful assistant who answers questions about pull requests in the GitHub repository mb-home/n8n-tutorial-pr-agent. The user asks you a question along with the current pull request data in JSON format. Analyze the data and answer the question.

Rules:
- Refer to specific PR numbers, authors, and dates.
- If the question cannot be answered based on the PR data, state this clearly.
- Summarize information in a structured manner (using lists and tables where appropriate).
```

---

### 4. Workflow Credentials - Übersicht

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
- Konfiguriere entsprechend deiner Nexus-Installation
- API Endpoint
- API Key oder Auth Token

**PostgreSQL Credential:**
```
Credential Name: PUBLIC Postgres Credential
Host: your-postgres-host
Port: 5432
Database: n8n
User: n8n_user
Password: your_password
SSL: Nach Bedarf
```

---

## Zusammenfassung

Du hast erfolgreich einen AI-gestützten Pull Request Analyse-Workflow erstellt! 🎉

Der Workflow:
- ✅ Empfängt Chat-Nachrichten
- ✅ Holt automatisch PR-Daten von GitHub Enterprise
- ✅ Nutzt AI, um Fragen zu beantworten
- ✅ Speichert Chat-Verlauf für Kontext

**Viel Spaß beim Experimentieren!**
