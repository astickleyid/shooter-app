# Void Rift — App Store Screenshots

Exact Apple App Store Connect sizes. PNG, RGB, **no alpha**.

## Required sizes (Apple 2026)

| Slot | Dimensions | Folder |
|------|------------|--------|
| **iPhone 6.9" (primary)** | **1320 × 2868** portrait | `ASC-UPLOAD/iphone-6.9/` |
| iPhone 6.7" | 1290 × 2796 | `ASC-UPLOAD/iphone-6.7/` |
| iPhone 6.5" (fallback) | 1284 × 2778 | `ASC-UPLOAD/iphone-6.5/` |
| iPad 13" | 2048 × 2732 | `ASC-UPLOAD/ipad-13/` |
| iPhone 6.9" landscape | 2868 × 1320 | `ASC-UPLOAD/iphone-6.9-landscape/` |

> **Minimum for submission:** upload the **6.9"** set (or 6.5" if you skip 6.9").  
> Providing **only 6.9"** is enough for iPhone — Apple scales down for smaller devices.  
> Add **iPad 13"** if the binary supports iPad.

## Shots in each set (5)

1. `01-title.png` — Main menu / START GAME  
2. `02-hangar.png` — Hangar permanent upgrades  
3. `03-gameplay.png` — In-run combat HUD  
4. `04-gameplay-late.png` — Combat (later frame)  
5. `05-missions.png` — Missions / meta screen  

## Upload to App Store Connect

1. Open **App Store Connect → VoidRift → iOS App 1.1.0 → App Previews and Screenshots**  
2. Select **iPhone 6.9"** (or “View All Sizes in Media Manager”)  
3. Drag in files from `ASC-UPLOAD/iphone-6.9/` in order 01→05  
4. Optionally add landscape set if you prefer landscape listing  
5. For iPad tab, upload `ASC-UPLOAD/ipad-13/`  

**Do not** resize in Preview/Photoshop with “fit” that changes aspect — every file must match the table exactly or ASC rejects with “wrong dimensions”.

## Spec checklist

- [x] Exact pixel sizes per device class  
- [x] PNG  
- [x] No transparency / alpha channel  
- [x] RGB color  
- [x] 1–10 screenshots per size class  

## Regenerate

From repo root (with Playwright Chromium installed):

```bash
python3 -m http.server 8765 --bind 127.0.0.1 &
# see /tmp/voidrift-shots/capture2.mjs for full capture script
```
