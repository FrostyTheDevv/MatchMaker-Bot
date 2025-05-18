# Matchmaker Bot

A Discord bot for random 1-on-1 matchmaking with moderated profiles and ticket-based private chat threads. Users create profiles, join the matchmaking queue, and are paired into private threads with Skip, Report, and End controls. Profiles are stored in SQLite and must be approved by moderators before use.

---

## 📄 Table of Contents

- [Features](#-features)  
- [Demo](#-demo)  
- [Prerequisites](#-prerequisites)  
- [Installation](#-installation)  
- [Configuration](#-configuration)  
- [Usage](#-usage)  
  - [Slash Commands](#slash-commands)  
  - [Button Controls](#button-controls)  
- [File Structure](#file-structure)  
- [Development](#development)  
- [Contributing](#contributing)  
- [License](#license)  

---

## 🔥 Features

- **Profile System**: Multi-step slash command (`/profile`) to create name, age, gender, and bio. Pending moderator approval.  
- **Matchmaking Queue**: `/match` enqueues approved users and automatically pairs two into a private thread.  
- **Ticket Threads**: Private threads for each match, with Skip, Report, and End buttons.  
- **Report & Moderation**: Report pings a moderator role; sessions remain logged until reviewed.  
- **Skip & Re-queue**: Skip closes the thread and re-queues both users for a new match.  
- **End Sessions**: End closes the thread and logs the session for moderation review.  
- **View Profiles**: `/viewprofile @User` DMs you an approved user’s profile.  
- **Lightweight Persistence**: Uses SQLite (`better-sqlite3`) with indexed tables for fast lookups.  
- **Dynamic Loading**: Auto-discovers commands and events from `commands/` and `events/` folders.  

---

## 🎬 Demo

![Matchmaker Demo Screenshot](https://i.imgur.com/YourDemoImage.png)  
*Example of a matching session with controls.*

---

## ⚙️ Prerequisites

- **Node.js** v16.9.0 or higher  
- **npm** (bundled with Node.js)  
- A **Discord bot token**, **Client ID**, and **Guild ID**  
- Permissions to create threads and manage channels in your server  

---

## 💾 Installation

1. **Clone** this repository (or upload files manually):  
   ```bash
   git clone  https://github.com/FrostyTheDevv/MatchMaker-Bot.git
   cd matchmaker-bot