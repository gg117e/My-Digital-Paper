<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JErDMvrNzw_HgyNGcaBcc3RrWWYtDZDK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project Structure / プロジェクト構造

This project is a React-based diary application using Vite and Supabase.
本プロジェクトは、ViteとSupabaseを使用したReactベースの日記アプリケーションです。

### Key Directories & Files / 主要ディレクトリ・ファイル

- **Root**
  - `App.tsx`: Main application router and layout. (アプリケーションのメインルーター)
  - `types.ts`: TypeScript definitions for Supabase tables and application state. (型定義ファイル)
  - `supabase_schema.sql`: SQL definitions for the Supabase database schema. (DBスキーマ定義)
  - `services/storageService.ts`: Abstraction layer for data persistence. (データ保存ロジック)

- **Components** (`/components`)
  - `Editor.tsx`: The core diary editor interface. Handles text, mood, tags, and schedule integration. (日記編集のメイン画面)
  - `DayScheduleView.tsx`: Visual timeline component for the daily schedule. (1日スケジュールのタイムライン表示)
  - `ScheduleEditor.tsx`: Modal for adding/editing schedule items. (スケジュール項目の編集モーダル)
  - `CalendarGrid.tsx`: Monthly calendar view for the home page. (カレンダー表示)
  - `MoodSelector.tsx`: Component for selecting daily mood. (気分選択コンポーネント)

- **Pages** (`/pages`)
  - `HomePage.tsx`: Dashboard showing the calendar and recent entries. (ホーム画面)
  - `EntryPage.tsx`: Route for viewing and editing a specific date's diary entry. (日記詳細・編集ページ)

- **Hooks** (`/hooks`)
  - `useDiary.ts`: Custom hook managing diary state and data fetching logic. (日記データ操作用フック)

### Data Model / データモデル

The application uses a Supabase `entries` table with a JSONB `schedule` column to store daily activities.
データはSupabaseの `entries` テーブルに保存され、スケジュール情報はJSONB型の `schedule` カラムに格納されます。
See `types.ts` for the full type definitions.
詳細な型定義は `types.ts` を参照してください。
