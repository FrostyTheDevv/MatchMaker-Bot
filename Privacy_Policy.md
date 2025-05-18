# Matchmaker Bot Privacy Policy

_Last updated: 2025-05-17

Matchmaker (“the Bot”) respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights.

---

## 1. Information We Collect

### 1.1 Profile Data
When you run `/profile`, we collect:
- **Name** (display name you choose)
- **Age**
- **Gender**
- **Bio** (text, up to 200 characters)

### 1.2 Discord Identifiers
- **User ID** (Discord snowflake)
- **Username & Avatar URL** (for embeds/thumbnails)

### 1.3 Matchmaking Records
- **Queue enrollment** (timestamp when you join/leave)
- **Thread IDs** of private match threads
- **Button interactions** (`Skip`, `Report`, `End` events)

---

## 2. How We Use Your Information

- **Profile Storage & Moderation**  
  We store your profile data in a private SQLite database for moderator review and matching.  
- **Matchmaking**  
  We use your User ID to enqueue you, pair you with another user, and create a private thread.  
- **Reporting & Logging**  
  When “Report” is clicked, we notify the Moderator role (no extra data is sent). We log closed sessions (thread name, timestamps, closed-by) for staff review.

---

## 3. Data Retention

- **Profiles** remain until you overwrite them with `/profile` again or until a moderator removes them.  
- **Queue entries** are deleted immediately after matching or when you leave the queue.  
- **Threads & Logs** are retained indefinitely for moderation purposes (unless a moderator manually purges them).

---

## 4. Data Sharing & Disclosure

- We do **not** sell or share your data with third parties.  
- Only users with the Moderator role can view raw profile data and session logs.  
- In the event of a legal request (subpoena, court order), we’ll disclose data as required by applicable law.

---

## 5. Security

- Data is stored in a local SQLite database (`matchmaker.db`) on the host machine.  
- Only the bot process and server administrators have access to the database file.  
- No unencrypted backups are transmitted over public networks.

---

## 6. Your Rights

- **Access & Correction**  
  You can overwrite your profile at any time with `/profile`.  
- **Deletion**  
  Contact a moderator to request complete removal of your profile and logs.  
- **Questions & Complaints**  
  Contact the server’s moderation team or bot developer in DM for data inquiries.

---

## 7. Changes to This Policy

We may update this policy for new features or legal requirements. We’ll post the date of last revision here. Continued use of the Bot after changes constitutes acceptance.

---

## 8. Contact

If you have questions about this policy, please reach out to the server administrators or open an issue in the bot’s GitHub repository.
