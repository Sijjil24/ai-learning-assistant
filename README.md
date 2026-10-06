# InternLearn AI

A Next.js learning assistant with Firebase Authentication, per-user Firestore learning paths and progress, AI-generated lessons, and an AI tutor with saved chat history.

## Local Setup

1. Copy `.env.example` to `.env.local` and fill in the Firebase web-app settings.
2. Enable Email/Password in Firebase Authentication and create a Firestore database.
3. Set `OPENAI_API_KEY` to use OpenAI, or `GROQ_API_KEY` to use the existing Groq-compatible provider. OpenAI takes precedence if both are configured.
4. Install dependencies and start the app:

```
- `learningProgress/{topicId}` stores lesson ratings, completion, progress percentage, strong areas, and weak areas.
- `chatHistory/{conversationId}/messages/{messageId}` stores Tutor conversations.
- `progress/{moduleId}` retains quiz results from the existing course-module flow.

The root user document also keeps profile-level `strongAreas` and `weakAreas`. `firestore.rules` restricts user documents and all nested learning data to the signed-in owner; course modules and quizzes are readable to signed-in users and client writes are disabled. Deploy these rules to the Firebase project before using the app:

```bash
firebase deploy --only firestore:rules
```

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
