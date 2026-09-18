# Implementation Plan: "Vintage Ballot Box" Tactile Paper UI/UX

Overhaul the React frontend to perfectly mimic a physical, tactile paper ballot system. Strip all modern glassmorphism, blur, rounded corners, and soft drop-shadows in favor of brutalist paper textures, typewriter typography, ballpoint pen selections, and ruled guestbook signatures.

## User Review Required

> [!IMPORTANT]
> - All modern design elements (glassmorphism, gradients, rounded pills, soft ambient shadows) will be replaced with sharp 90-degree corners (`border-radius: 0`), harsh physical paper shadows (`box-shadow: 6px 6px 0px rgba(43, 43, 43, 0.15)`), and 1px/2px solid or dashed borders (`#2B2B2B`).
> - Primary text and questions will use **Special Elite** (typewriter style).
> - Voter names and ballot selection marks will use **Caveat** (handwritten style).

---

## Color Palette & Theme Tokens

| Token | Hex | Role | Applied Elements |
|---|---|---|---|
| **Parchment** | `#F4F1EA` | Global Paper Background | Global `<body>` with SVG `feTurbulence` grain filter |
| **Ballot White** | `#FAFAFA` | Ballot Cards & Sheets | Questions cards, clipboard sheets, unselected buttons, QR box |
| **Ink Black** | `#2B2B2B` | Primary Ink | All primary typewriter text, standard chart bars, sharp borders |
| **Ballpoint Blue** | `#2563EB` | Pen Ink Selection | Mobile button tapped/selected state, handwritten "X" ballot mark |
| **Red Stamp** | `#DC2626` | Official Ink Stamp | Winning chart bar, official stamps, highlight badges |

---

## Proposed Changes

### 1. Typography & Global CSS
#### [MODIFY] [`frontend/index.html`](file:///d:/PulseCast/frontend/index.html)
- Add Google Fonts link for `Special Elite` (weights 400) and `Caveat` (weights 600, 700).

#### [MODIFY] [`frontend/src/index.css`](file:///d:/PulseCast/frontend/src/index.css)
- Replace modern light tokens with Vintage Ballot Box palette (`--bg-parchment: #F4F1EA`, `--bg-ballot: #FAFAFA`, `--ink-black: #2B2B2B`, `--ballpoint-blue: #2563EB`, `--red-stamp: #DC2626`).
- Configure global `body` background: `#F4F1EA` with an inline SVG `feTurbulence` data URI (`fractalNoise, baseFrequency 0.8, opacity 0.06`) for realistic tactile paper grain.
- Define brutalist paper card utility (`.paper-card`, `.glass-panel` override): `background: #FAFAFA`, `border: 1px solid #2B2B2B`, `border-radius: 0px !important`, `box-shadow: 6px 6px 0px rgba(43, 43, 43, 0.15)`.
- Enforce `border-radius: 0 !important` on buttons, inputs, tags, and bars.

---

### 2. Components
#### [NEW] [`frontend/src/components/TypewriterText.jsx`](file:///d:/PulseCast/frontend/src/components/TypewriterText.jsx)
- Typewriter character-by-character reveal using Framer Motion `staggerChildren: 0.05`.
- Instant child strike (`duration: 0`) to simulate a mechanical typewriter key strike.
- Animated blinking rectangular cursor (`▋`).

#### [MODIFY] [`frontend/src/components/AnimatedBar.jsx`](file:///d:/PulseCast/frontend/src/components/AnimatedBar.jsx)
- Enforce sharp rectangular bars (`border-radius: 0`).
- Standard bars: **Ink Black (`#2B2B2B`)**.
- Winning bar: **Red Stamp (`#DC2626`)** with a stamped "TOP BALLOT" indicator.
- Container: Ballot White (`#FAFAFA`) with `border: 1px solid #2B2B2B`, harsh shadow `6px 6px 0px rgba(43, 43, 43, 0.15)`.

#### [MODIFY] [`frontend/src/components/Leaderboard.jsx`](file:///d:/PulseCast/frontend/src/components/Leaderboard.jsx)
- Styled like a physical sign-in guestbook on lined/ruled paper.
- Render `voter_names` in **Caveat** font with alternating slight rotations (`rotate(-2deg)` / `rotate(2deg)`) mimicking authentic handwritten pen signatures.
- Red stamp seal for winners and official verification badges.

#### [MODIFY] [`frontend/src/components/Header.jsx`](file:///d:/PulseCast/frontend/src/components/Header.jsx)
- Physical ballot paper banner with dashed lower border, typewriter brand text, and stark rectangular buttons.

---

### 3. Views
#### [MODIFY] [`frontend/src/pages/MobileVotingScreen.jsx`](file:///d:/PulseCast/frontend/src/pages/MobileVotingScreen.jsx)
- Display poll question using `<TypewriterText>`.
- Voting buttons:
  - Unselected: Ballot White (`#FAFAFA`), Ink Black text, `border: 1px solid #2B2B2B`, `box-shadow: 6px 6px 0px rgba(43, 43, 43, 0.15)`.
  - Tapped / Selected: Background transitions to faint blue (`#DBEAFE`), text changes to Ballpoint Blue (`#2563EB`), and a handwritten "X" in `Caveat` font scales in next to the text.
- Screen lock & Name capture styled as official ballot slips with dashed tear-off lines.

#### [MODIFY] [`frontend/src/pages/PresentationView.jsx`](file:///d:/PulseCast/frontend/src/pages/PresentationView.jsx)
- Question heading rendered with `<TypewriterText>`.
- Stark rectangular bar chart with Ink Black & Red Stamp bars.
- QR code wrapped in a Ballot White box with 1px black border and harsh offset shadow (`box-shadow: 6px 6px 0px rgba(43, 43, 43, 0.15)`).

#### [MODIFY] [`frontend/src/pages/CreatorDashboard.jsx`](file:///d:/PulseCast/frontend/src/pages/CreatorDashboard.jsx)
- Styled like an official clipboard with clip accent.
- Dashed bottom borders (`border-bottom: 2px dashed #2B2B2B`) separating each question in the multi-question builder.
- Sharp rectangular inputs and typewriter typography.

---

## Verification Plan
1. **Visual Styling**: Verify background has paper grain texture and `#F4F1EA` color; confirm zero rounded corners (`border-radius: 0`) across cards, buttons, badges, and chart bars.
2. **Typewriter Animation**: Verify `<TypewriterText>` types out instantly letter-by-letter with blinking cursor block.
3. **Ballot Voting Mark**: Verify tapping mobile voting choices scales in a handwritten "X" in Caveat font with faint blue background and Ballpoint Blue text.
4. **Guestbook Signatures**: Verify Leaderboard renders voter names in Caveat font with alternating hand-signed rotations (`-2deg` and `2deg`).
5. **Chart Contrast**: Verify standard bars are Ink Black (`#2B2B2B`) and the leading bar is Red Stamp (`#DC2626`).
