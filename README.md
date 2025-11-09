# Lexsy Legal Document Assistant

A minimal Next.js web app that turns SAFE agreements into an interactive, AI-assisted filling experience. Upload a `.docx` template, let Gemini highlight placeholders, chat with the assistant to capture answers, and download a completed document in minutes.

## Features
- **Placeholder detection** – Automatically surfaces bracketed fields in the uploaded SAFE doc.
- **Conversational filling** – Gemini-driven chat guides users through each required value, with confirmation and edit controls.
- **Progress overview** – Sidebar shows each placeholder’s status (pending, needs confirmation, confirmed).
- **One-click export** – Generate and download a final `.docx` populated with all confirmed answers.

## Tech Stack
- **Frontend**: Next.js (App Router), React 19, TypeScript
- **AI**: Gemini via `@ai-sdk/google`
- **Document handling**: `mammoth` for text extraction, `docxtemplater` + `pizzip` + `file-saver` for templating and download
- **Styling**: Tailwind CSS utility classes (minimal color palette)

## Environment Setup
Create a `.env.local` file with your Gemini API key:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

Install dependencies and run the development server:

```bash
pnpm install
pnpm run dev
# visit http://localhost:3000
```

Upload a SAFE `.docx`, follow the conversational prompts, confirm each placeholder, and download the finished agreement once all fields are complete.
