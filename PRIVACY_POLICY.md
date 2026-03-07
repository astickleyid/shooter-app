# Privacy Policy — VOID RIFT

**Last updated: February 28, 2026**

This Privacy Policy describes how VOID RIFT ("we", "our", or "the app") collects, uses, and protects your information when you use our iOS application and web-based game.

---

## 1. Information We Collect

### 1.1 Account Information (Optional)
Creating an account is optional. If you choose to register, we collect:

| Data | Purpose |
|------|---------|
| **Username** | Uniquely identifies your profile and displays on leaderboards |
| **Email address** | Account recovery (optional; may be omitted at registration) |
| **Password** | Stored as a SHA-256 hash — we never store plaintext passwords |
| **Avatar URL** | Auto-generated placeholder image (via [DiceBear Bottts](https://dicebear.com)) seeded from your user ID |

### 1.2 Gameplay Statistics
When you play VOID RIFT, the following gameplay data is recorded to your profile (if you have an account) or stored locally:

- High score, current score, total games played
- Waves survived, total kills, total shots fired
- Ship hull and weapon loadout selections
- Credits earned and spent
- Achievement and mission progress

### 1.3 Local Storage
Even without an account, the game stores progress data in your device's **localStorage** under the key `void_rift_v11`. This data never leaves your device unless you create an account.

### 1.4 Session Tokens
When you log in, a temporary session token is generated and stored server-side for up to **24 hours**. The token is used solely to authenticate subsequent requests during your session.

### 1.5 Social Features (Optional)
If you use the optional social/friends system, we additionally store:

- Friend relationships (mutual accept required)
- Activity feed entries (scores, achievements shared by you)
- Any profile customisation you choose to set

### 1.6 iOS Game Center (iOS App Only)
On the iOS app, if you sign in to Apple Game Center, your Game Center Player ID may be used to submit scores to Game Center leaderboards and unlock achievements. This data is governed by Apple's privacy policy.

### 1.7 Information We Do Not Collect
- We do **not** collect your real name, postal address, or payment information.
- We do **not** run advertising networks or sell your data to third parties.
- We do **not** use device-level advertising identifiers (IDFA/GAID).
- We do **not** track your activity across other apps or websites.

---

## 2. How We Use Your Information

We use collected data solely to:

1. Provide and operate the game (authentication, leaderboards, social features).
2. Display your username and score on global leaderboards (if you opt in by submitting a score).
3. Enable the optional friends/activity-feed system.
4. Improve game balance and performance (aggregated, non-identifiable analytics only).

We do **not** use your data for targeted advertising, sell it to data brokers, or share it with third parties except as described in Section 4.

---

## 3. Data Storage and Security

### 3.1 Server-Side Storage
Account data and global leaderboard entries are stored in **Vercel KV** (a managed Redis-compatible key-value store operated by Vercel, Inc., USA). Vercel KV data is encrypted at rest and in transit.

- Vercel's Privacy Policy: [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)

### 3.2 Password Security
All passwords are hashed using **scrypt** (a memory-hard key derivation function) with a unique random salt per user before storage. Plaintext passwords are never stored or logged. Accounts created before this scheme was introduced are automatically migrated to scrypt on next login.

### 3.3 Session Security
Sessions expire after **24 hours** of inactivity and are invalidated on logout. Session tokens are transmitted only over HTTPS.

### 3.4 Retention
- Active accounts and associated data are retained as long as your account exists.
- You may request deletion of your account and data at any time (see Section 5).
- Session tokens expire automatically after 24 hours.

---

## 4. Third-Party Services

| Service | Purpose | Data shared | Their privacy policy |
|---------|---------|-------------|---------------------|
| **Vercel** (hosting & KV) | App hosting, serverless functions, key-value storage | Account records, leaderboard entries | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) |
| **DiceBear** | Auto-generated avatar images | User ID (as image seed, via URL parameter) | [dicebear.com/legal/privacy-policy](https://www.dicebear.com/legal/privacy-policy/) |
| **Apple Game Center** | iOS leaderboards & achievements (iOS only) | Game scores, achievements | [apple.com/legal/privacy](https://www.apple.com/legal/privacy/) |

We do **not** currently use third-party analytics SDKs (such as Firebase Analytics, Mixpanel, or Amplitude) or crash-reporting services (such as Crashlytics or Sentry). If this changes in a future version, this policy will be updated accordingly.

---

## 5. Your Rights and Choices

You have the following rights regarding your personal data:

- **Access**: Request a copy of the data we hold about you.
- **Correction**: Request correction of inaccurate data.
- **Deletion**: Request deletion of your account and all associated data.
- **Data portability**: Request your data in a structured, machine-readable format.
- **Opt-out of leaderboard**: Play without an account; local scores remain local.

To exercise any of these rights, contact us at the address in Section 7. We will respond within 30 days.

### Account Deletion (In-App)
iOS users can delete their account directly within the app. Per Apple App Store guidelines, this removes your account and associated server-side data from Vercel KV.

---

## 6. Children's Privacy

VOID RIFT is rated **4+** (iOS) and is suitable for all ages. We do not knowingly collect personal information from children under 13 without verifiable parental consent. If you believe a child under 13 has provided personal information, please contact us and we will delete it promptly.

---

## 7. Contact

If you have questions or requests regarding this Privacy Policy, contact us at:

**Developer**: A. Stickley  
**App**: VOID RIFT  
**GitHub**: [https://github.com/astickleyid/shooter-app](https://github.com/astickleyid/shooter-app)  
**Issues / Contact**: [https://github.com/astickleyid/shooter-app/issues](https://github.com/astickleyid/shooter-app/issues)

---

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted in the repository and reflected by the "Last updated" date at the top of this document. Continued use of the app after changes constitutes acceptance of the updated policy.

---

*This Privacy Policy is published at:*  
**https://github.com/astickleyid/shooter-app/blob/main/PRIVACY_POLICY.md**
