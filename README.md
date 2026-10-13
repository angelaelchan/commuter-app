# Commuter Community — Stage 1 prototype

A clickable, mobile-first prototype of a community app for UC San Diego commuter students, built from the 13 mid-fidelity wireframes in the Figma file *LavaLab HW2 Design*. It runs on mock data. There is no backend and no sign-in.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL. The app is designed at 402 px wide. On a wider window it sits in a centered phone-width column.

`npm run build` type-checks the code and builds a production bundle into `dist/`.

## Stack

- React 19 + TypeScript, built with Vite
- Leaflet / react-leaflet for the map, with OpenStreetMap tiles (no API key)
- Plain CSS. No CSS framework.

## Where things live

| Path | What it is |
| --- | --- |
| `src/styles/tokens.css` | **All** design tokens: the Figma "HW 2" variables (gray 1–12, elevation, accent, button states; light mode only), the semantic roles mapped onto them, the 14 Onest text styles, the 4 px spacing scale, sizes and radii |
| `src/styles/app.css` | Component and screen styles. Uses tokens only. |
| `src/data/mock.ts` | Seed data: Audrey's classes, friends' weekly schedules, events, places (real coordinates), forum posts and chats |
| `src/data/api.ts` | The single data layer. Screens read and write only through it, so a real backend can replace it later. |
| `src/lib/availability.ts` | Free-time maths: overlap per friend, open slots, best time |
| `src/components/WeekCalendar.tsx` | One calendar component used for Classes, Friends and the hangout Time step |
| `src/components/PlaceMap.tsx` | Interactive map (Place step) and fixed preview (Confirm step) |
| `src/screens/` | Home, Classes, Class page (Forum and Private Chat), Friends, Hangout flow (5 steps) |
| `src/assets/icons/` | Icons exported from Figma, recolored to `currentColor` |

## Scenario

"Today" is fixed to **Tuesday, October 6, 2026, 11:15 AM**. Walkthrough: Friends → Create event → name it "📚 Study Session", choose 1 hr → add Peter, Maya and Lily → Select time (Wed 12–1 PM) → tap Price Center → Confirm. Undo on the toast removes the event again.

Availability is computed from the schedules in `mock.ts`. Change a class time or a friend's busy blocks and the calendars, overlap ranking and best time all update.
