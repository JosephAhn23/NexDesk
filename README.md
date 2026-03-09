# NexDesk - IT Helpdesk Portal

NexDesk is a modern, glow-mode **IT helpdesk ticketing system** UI inspired by tools like Zendesk, ServiceNow, and ManageEngine.  
This single-page React app showcases realistic IT workflows: ticket queue, SLA tracking, knowledge base, analytics, and role-based views for IT staff vs employees.

## Screenshots

> Capture your own browser screenshots (in dark mode) and save them into the `screenshots/` folder with the names below.  
> Once added, these images will render automatically on GitHub.

- **Login (IT Staff vs Employee)**

  ![NexDesk Login](./screenshots/nexdesk-login.png)

- **IT Agent Ticket Queue**

  ![NexDesk Agent Queue](./screenshots/nexdesk-agent-queue.png)

- **Ticket Detail & Conversation**

  ![NexDesk Ticket Detail](./screenshots/nexdesk-ticket-detail.png)

- **Analytics Dashboard**

  ![NexDesk Analytics](./screenshots/nexdesk-analytics.png)

## Running Locally (minimal setup)

This repo currently contains a single React component file: `NexDesk_Final.jsx`.  
You can drop it into any React playground (CodeSandbox, StackBlitz, Vite+React app, etc.) and render the default export.

1. Create a new React app (for example with Vite or CRA).
2. Copy `NexDesk_Final.jsx` into your `src/` folder.
3. Import and render the `App` component in your root:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./NexDesk_Final";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

4. Run your dev server and open the app in a browser.
5. Capture glow-mode screenshots (1440×900 or similar) of:
   - Login screen
   - IT Agent ticket queue
   - Ticket detail modal
   - Analytics dashboard
6. Save them into the `screenshots/` folder with the exact filenames:
   - `nexdesk-login.png`
   - `nexdesk-agent-queue.png`
   - `nexdesk-ticket-detail.png`
   - `nexdesk-analytics.png`

Commit and push, and your README gallery will be ready for your portfolio and resume.

