# TTS + STT Test Page MVP Requirements (Pure HTML + JS Version)

## 1. Project Goal
- Build a **TTS + STT test page**, deployed on GitHub Pages.
- Use **pure HTML + vanilla JavaScript + IndexedDB/localStorage + hash routing** to keep things simple (no build step).
- The site has two views:
  - **Admin backend**: for team testing, with simple password protection.
  - **Result public page**: displays results only, read-only.
- A top switch toggles **TTS** or **STT** mode.
- Core function: load the Taiwanese phonetic table (v5), test each cell for TTS/STT, and record O/X judgments.

---

## 2. Data Source (v5)
- Files: `/data/syllable_tone_grid_v5.json` (primary) and `/data/syllable_tone_grid_v5.csv` (backup).
- Data structure:
  ```json
  {
    "rime_group": "a",
    "initial": "k",
    "base": "ka",
    "tone1": "ka",
    "tone1_num": "ka1",
    "tone2": "ká",
    ...
    "tone9": "ka̋",
    "tone9_num": "ka9"
  }
  ```
- **Tone 6 does not exist.**
- **Tone 4 & Tone 8**: only valid for rimes ending with -t/-p/-k/-h, otherwise empty.
- Each rime group starts with a standalone rime row (`initial=""`).

---

## 3. API Specs

### 3.1 TTS
- **URL**: `https://dev.taigiedu.com/backend/synthesize_speech`
- **Method**: `POST`
- **Payload**:
  ```json
  { "tts_lang": "tb", "tts_data": "siūnn" }
  ```
- **Response**: base64 audio.

### 3.2 STT
- **URL**: `https://dev.taigiedu.com/backend/transcribe_speech`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "stt_data": "<base64 audio>",
    "stt_lang": "tw",
    "stt_type": "base64"
  }
  ```
- **Response**:
  ```json
  { "message": { "tw": "Hanzi", "tl": "TL romanization", "poj": "POJ" } }
  ```
- **Special**: if no voice, returns `"<{silent}>"`.

---

## 4. Frontend Features

### 4.1 Common
- **Grid**:
  - Rows = rime groups × initials (including standalone rimes).
  - Columns = tone1,2,3,4,5,7,8,9.
  - Empty cell → show “—” and disable button.
- **O/X Marking**: three states (O=green, X=red, Untested=gray).
- **Immediate Save**: O/X state saved to IndexedDB or localStorage.
- **Hash Routing**: `/#/tts/admin`, `/#/tts/results`, `/#/stt/admin`, `/#/stt/results`.

### 4.2 TTS Mode
- Each cell has a “Play” button → call TTS API → play audio.

### 4.3 STT Mode
- Each cell has a “Record” button → record audio → call STT API → display result.

---

## 5. Admin Backend
- Simple password protection (hash check).
- Functions: grid operation, O/X marking, export JSON/CSV.

---

## 6. Result Public Page
- Displays: grid + play/record buttons + test result.
- **Read-only.**
- Provide a “Download Test Results” button.

---

## 7. Data Storage
- IndexedDB (preferred) or localStorage (fallback).
- Export filenames: `tts_stt_eval_{YYYYMMDD_HHMMSS}.json` / `.csv`.

---

## 8. Display Rules
- O=green, X=red, Untested=gray.
- Tone4/8 only for entering tones (-t/-p/-k/-h).
- Recording shows red dot + timer.

---

## 9. Style Guide
- **Primary colors**: White background (#FFFFFF) with green accent (#22C55E).
- **Buttons**: green for main, red for error, gray for disabled.
- **Font**: system default (Noto Sans TC / Microsoft JhengHei / system-ui).
- **Design principle**: simple and clear, minimal decoration.

---

## 10. Deployment
- Host on GitHub Pages.
- Use hash routing to avoid 404.
- No Node build step, just plain HTML/JS/CSS.

---

## 11. Definition of Done (DoD)
- Grid successfully loads v5.
- TTS playback works.
- STT recording returns and displays transcription.
- O/X marking saves and persists.
- Export JSON/CSV works.
- Admin & Result pages are navigable; Result is read-only.
