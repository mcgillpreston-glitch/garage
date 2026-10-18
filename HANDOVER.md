# Handover: Garage & Tool Inventory ("Garage Stock")

A sibling app to **Home Stock** (`mcgillpreston-glitch/shopping`, live at https://mcgillpreston-glitch.github.io/shopping/). Same build approach and the same scanner, re-aimed at a garage: knowing **what's in the garage, where it is, and whether it's available right now**.

Owner: Preston McGill (mcgillpreston-glitch on GitHub)
Status: not started. This file is the brief.

---

## 1. What the app must answer

1. **"Do I have one?"** Search "10mm socket", "oscillating tool", "jigsaw blades" and get a yes/no, how many, and where.
2. **"Where is it?"** Every item lives in a location (wall, shelf, bin, drawer, truck). Scan a bin's label to see what's in it.
3. **"Is it available?"** Tools can be *in the garage*, *loaned out*, *in the truck*, *needs repair*, or *missing*.
4. **"What do I need to buy?"** Consumables (screws, blades, sandpaper, 2-stroke oil, propane) use Home Stock's low-stock → shopping list logic. Broken or missing tools can also be added to the list.
5. **"What's it worth?"** Purchase price, date, store, serial number and warranty, for insurance and returns.

---

## 2. Reuse from Home Stock (copy, don't rewrite)

Source: `index.html` in the `shopping` repo. It's a single file with no build step.

| Reuse as-is | Functions / pieces |
|---|---|
| Live barcode scanner | `getDetector`, `getZX`, `zxDecode`, `readCanvas`, `cropAim`, `scanLoop`, `startCam`, `stopCam`, `found`, `grabFrame`, the torch/zoom buttons, and the `.viewer` / `.aim` / `.camtools` CSS |
| Photo fallback | `decodeImage`, the `#scanFile` input |
| Claude API (optional key) | `askClaude`, `toJpegB64`, `parseJSON`, the Settings sheet (key, model picker) |
| On-device receipt OCR | `loadScript`, `TESS`, `parseReceiptText`, `bestMatch`, `renderReceipt` and the apply handler |
| Storage & backup | `loadLocal`, `saveLocal`, `putItem`, `dropItem`, export/import in Settings |
| UI shell | header, bottom tab bar, sheet/modal (`openSheet`/`closeSheet`), `toast`, token-based light/dark CSS |
| PWA bits | `manifest.webmanifest`, icons, `apple-mobile-web-app-*` metas |

**Lessons already learned. Don't repeat them:**
- Claude artifacts can't open the camera or take uploads reliably. Host on **GitHub Pages**.
- On a free GitHub plan, **the repo must be public** or Pages shows a 404.
- Pages has to be switched on by hand (Settings → Pages → `main` / root). Claude's GitHub access can't enable it.
- The camera needs **https** (Pages provides it).
- Small or dim barcodes failed with ZXing on the full frame. The fix in place: native `BarcodeDetector` first, crop and enlarge the aim box, 1920×1080 with continuous focus, torch + zoom buttons, and the ZXing fallback must read the same code twice.
- Tell the user to hard-refresh after a deploy. Pages caches for a few minutes.

---

## 3. What's different for tools

| Home Stock | Garage Stock |
|---|---|
| Everything is consumed | Two kinds: **Tools** (durable, tracked one by one) and **Supplies** (consumable, tracked by quantity) |
| Amount + low level | Tools: **status + location**. Supplies: amount + low level (same as now) |
| Open Food Facts lookup | Food databases rarely know tools. Use **Claude reading the box or model plate**, with optional UPCitemdb (see §6) |
| Store grouping on list | Same, plus "replace" entries for broken or missing tools |
| No locations | **Locations are first-class**, with printable QR labels |
| — | **Loans** (who has it, since when) |
| — | **Battery platforms** (Milwaukee M18, DeWalt 20V MAX, Ryobi ONE+, etc.) so "what runs on my batteries" is answerable |
| — | **Kits/sets** (a socket set holds pieces; a drill kit holds drill + 2 batteries + charger) |

---

## 4. Categories (modeled on Lowe's / Home Depot aisles)

Two levels: **Department → Category**. Put this in one JS constant (`TAXONOMY`) so it can be edited in one place. Each category has a default **kind** (`tool` or `supply`) that pre-fills new items.

**Power Tools** *(tool)*
- Drills & Drivers · Impact Drivers · Impact Wrenches · Hammer Drills & Rotary Hammers
- Circular Saws · Miter Saws · Table Saws · Jigsaws · Reciprocating Saws · Band Saws · Chainsaws (also under Outdoor)
- Oscillating Multi-Tools · Rotary Tools · Angle Grinders · Sanders · Routers · Planers
- Nailers & Staplers · Heat Guns · Glue Guns · Power Tool Combo Kits
- **Batteries & Chargers** (record platform + voltage + Ah)

**Hand Tools** *(tool)*
- Wrenches · Sockets & Socket Sets · Ratchets · Screwdrivers & Nut Drivers · Hex Keys & Torx
- Pliers & Wire Cutters · Hammers & Mallets · Pry Bars · Clamps · Vises
- Utility Knives & Blades · Chisels · Files & Rasps · Hand Saws · Hand Tool Sets

**Measuring & Layout Tools** *(tool)*
- Tape Measures · Levels · Laser Levels & Measures · Squares · Stud Finders · Chalk Lines · Calipers

**Tool Storage** *(tool)*
- Tool Chests & Cabinets · Tool Boxes & Bags · Workbenches · Sawhorses · Pegboard & Wall Storage

**Air Compressors & Air Tools** *(tool)*
- Air Compressors · Air Tools · Air Hoses & Fittings · Tire Inflators

**Welding & Soldering** *(tool)*
- Welders · Torches · Soldering Irons · Welding Supplies *(supply)*

**Outdoor Power Equipment** *(tool)*
- Lawn Mowers · String Trimmers · Leaf Blowers · Hedge Trimmers · Chainsaws · Pressure Washers · Snow Blowers · Generators

**Lawn & Garden** *(mixed)*
- Shovels & Spades · Rakes · Hoes & Cultivators · Pruners & Loppers · Wheelbarrows · Hoses & Nozzles · Sprayers
- Fertilizer, Seed, Mulch, Weed Control *(supply)*

**Automotive** *(mixed)*
- Jacks & Stands · Creepers · Battery Chargers & Jump Starters · OBD Scanners · Torque Wrenches
- Motor Oil · Fluids · Filters · Wiper Blades · Car Care *(supply)*

**Ladders** *(tool)*
- Step Ladders · Extension Ladders · Multi-Position Ladders · Step Stools

**Shop Vacuums & Cleaning** *(mixed)*
- Wet/Dry Vacs · Shop Vac Filters & Bags *(supply)* · Brooms & Brushes · Cleaners & Degreasers *(supply)*

**Electrical** *(mixed)*
- Extension Cords & Power Strips · Work Lights & Flashlights · Multimeters & Testers · Wire Strippers & Crimpers
- Wire, Connectors, Electrical Tape *(supply)*

**Plumbing** *(mixed)*
- Pipe Wrenches · Plungers & Augers · Tubing Cutters
- Fittings, PTFE Tape, Sealants *(supply)*

**Paint** *(mixed)*
- Brushes · Rollers & Frames · Paint Sprayers · Drop Cloths · Tape
- Paint & Primer · Stain · Caulk · Spackle *(supply)*

**Hardware & Fasteners** *(supply)*
- Screws · Nails · Bolts, Nuts & Washers · Anchors · Hooks & Hangers · Hinges & Brackets · Zip Ties · Rope & Chain

**Tool Accessories** *(supply)*
- Drill Bits · Driver Bits · Saw Blades · Sanding Discs & Sandpaper · Grinding & Cutoff Wheels · Router Bits · Oscillating Blades

**Adhesives & Sealants** *(supply)*
- Wood Glue · Construction Adhesive · Epoxy · Super Glue · Silicone · Tape (duct, painter's, electrical)

**Lubricants & Chemicals** *(supply)*
- WD-40 & Penetrants · Grease · 2-Stroke & Bar Oil · Fuel Stabilizer · Propane

**Safety & Workwear** *(mixed)*
- Safety Glasses · Hearing Protection · Respirators & Masks *(supply: filters)* · Work Gloves · Knee Pads · First Aid *(supply)* · Fire Extinguishers (track inspection date)

**Sports, Bikes & Recreation** *(tool)*
- Bikes · Camping · Coolers · Sports Equipment

**Holiday & Seasonal** *(tool)*
- Holiday Decor · Lights · Seasonal Storage Bins

**Other** *(mixed)*

Filters on the Garage screen: Department chips → Category chips → Status chips (Available / Out / Repair / Missing) → Location.

---

## 5. Data model

Single `items` map in localStorage (`garagestock.v1`), plus `locations`, `extras` (manual list items) and `settings`.

```js
// Tool (durable, one record per physical item)
{
  id: "it_…", kind: "tool",
  name: "Milwaukee M18 FUEL 1/2\" Hammer Drill",
  department: "Power Tools", category: "Hammer Drills & Rotary Hammers",
  brand: "Milwaukee", model: "2904-20", serial: "J41A…",
  barcode: "045242539163",           // UPC on box, or our own QR id
  platform: "Milwaukee M18",          // battery family; null for corded/manual
  power: "cordless" | "corded" | "gas" | "pneumatic" | "manual",
  qty: 1,                             // >1 only for identical interchangeable tools (e.g. 4 clamps)
  status: "available" | "loaned" | "away" | "repair" | "missing",
  locationId: "loc_wall_a",
  loan: { to: "Mike (neighbor)", since: "2026-10-12", due: "2026-10-26" } | null,
  parentId: "it_kit…" | null,         // belongs to a kit/set
  purchase: { price: 199.00, date: "2025-06-01", store: "Home Depot" },
  warrantyUntil: "2030-06-01",
  manualUrl: "https://…",
  photo: "data:image/jpeg;base64,…",  // small thumbnail, max ~400px, to keep storage small
  notes: "", updated: 1760000000000
}

// Supply (consumable, same as Home Stock)
{
  id, kind: "supply", name: "#8 x 1-1/4\" wood screws", department: "Hardware & Fasteners", category: "Screws",
  unit: "count" | "box" | "lb" | "oz" | "ft" | "gal" | "can",
  amount: 140, threshold: 50, restock: 500, full: 500,
  locationId, barcode, price, store, priceHistory: [...]
}

// Location
{ id: "loc_…", name: "Bin 4 – Plumbing", area: "Shelf B", code: "GS-LOC-0004", order: 4 }
```

Storage note: photos make localStorage fill up fast (≈5 MB limit). Use **IndexedDB** for photos keyed by item id, and keep only the id in the item. Export/import must include the photos.

---

## 6. Barcode & identification flow

1. **Scan** (same live scanner).
2. Our own label? (`GS-LOC-…` → open that location; `GS-IT-…` → open that tool.)
3. Known barcode in inventory → open the item with quick actions: **Check out / Return / Move / Needs repair / Used some** (supplies).
4. Unknown UPC:
   - Try **UPCitemdb** trial: `GET https://api.upcitemdb.com/prod/trial/lookup?upc=CODE` (free, about 100/day, no key). Check that CORS works from Pages. If it doesn't, skip it.
   - Then Open Products Facts (`world.openproductsfacts.org`, already in Home Stock).
   - If a Claude key is set, send the frame to Claude and ask for: brand, model, name, department + category **chosen from `TAXONOMY`**, kind, platform, power.
   - Otherwise open the blank form with the barcode filled in.
5. **No barcode?** (Most loose tools have none.) Offer **"Identify from photo"**: snap the tool or its model plate and Claude fills the form. Then offer **"Print a label"** for it.

Claude prompt rule: always pass the full `TAXONOMY` list and require the answer to pick from it, so categories stay consistent.

---

## 7. QR labels (new)

- Every location and (optionally) every tool gets a short code: `GS-LOC-0004`, `GS-IT-0123`.
- **Labels screen**: choose locations/tools → a printable sheet of QR codes with names (use `qrcode-generator` from cdnjs or jsDelivr, pinned version). Size it for common Avery label sheets (e.g. 1" × 2-5/8", 30 per sheet) and plain paper.
- Scanning a location label shows everything in that bin, with "Move item here" and "Audit this bin" actions.
- **Audit mode**: scan a bin, tick off what's actually there, and the rest gets flagged `missing`.

---

## 8. Screens (bottom tabs)

1. **Garage**: search + department/category/status chips. Summary row: *tools · out on loan · needs repair · supplies low*. Rows show name, location, and a status pill.
2. **Scan**: live camera (reused), manual number, photo fallback, "Identify from photo".
3. **Locations**: list of bins/shelves with item counts. Add, rename, reorder, print labels, audit.
4. **Out**: everything loaned, away or in repair, oldest first. Overdue loans highlighted. One-tap **Returned**.
5. **List**: shopping list. Low supplies (same logic as Home Stock) + tools marked missing/broken to replace + manual extras, grouped by store. Ticking a supply restocks it.

Settings (gear): Claude key + model, my battery platforms, default store list, export/import, label size.

---

## 9. Nice-to-haves (after v1)

- "What can I run?": filter tools by the battery platform(s) you own.
- Warranty and fire-extinguisher reminders (a banner in the app when something is within 30 days).
- Value report: total by department, for an insurance list (export as CSV).
- Receipt flow (reused), with tools added as `kind: tool` and purchase info filled in.
- Share sheet ("Mike borrowed my tile saw"), copied to the clipboard.

---

## 10. Build & deploy steps

1. Create a **public** repo, e.g. `mcgillpreston-glitch/garage`.
2. Copy `index.html`, `manifest.webmanifest` and the icons from `shopping`. Rename them to Garage Stock and give it a new accent color so the two apps are easy to tell apart on the home screen.
3. Replace the data model, the Stock screen and the List logic as described above. Add Locations, Out and Labels.
4. Seed 5–6 clearly marked example items across 3 departments plus 2 locations, with a "Remove examples" button (same pattern as Home Stock).
5. Test at 390px wide, in light and dark mode, and with no Claude key (everything except photo ID must still work).
6. Push to `main`, then Settings → Pages → `main` / root → Save. URL: `https://mcgillpreston-glitch.github.io/garage/`
7. On the phone: open the URL, allow the camera, Add to Home Screen.

**Acceptance check:** scan a bin label → see its contents. Scan a drill's box → it's identified and filed under Power Tools → Drills & Drivers. Loan it → it shows on Out. Return it → it's available again. Drop screws below their low level → they appear on the List.
