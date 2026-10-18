# Garage Stock

A phone-friendly garage and tool inventory that runs entirely in the browser. Sister app to [Home Stock](https://github.com/mcgillpreston-glitch/shopping).

Live: https://mcgillpreston-glitch.github.io/garage/

- **Departments and categories** modeled on home-improvement store aisles (Power Tools, Hand Tools, Measuring & Layout, Hardware & Fasteners…).
- **Tools** have a status: available, loaned out, away, needs repair, or missing. **Supplies** have an amount and a low-stock level.
- **Live barcode scanning** with the phone camera. Unknown barcodes are looked up on UPCitemdb and Open Products Facts.
- **Places + QR labels**: print labels for bins and shelves (Avery 5160, 5163 or plain paper). Scan a label to see what's inside, or check a place to find missing tools.
- **Loans**: who has what, since when, with overdue loans highlighted.
- **Shopping list**: low supplies and missing tools, grouped by store.
- **Optional Claude API key** (Settings) to identify tools from a photo of the tool, box or model plate.
- **Backup**: export and import everything, photos included, as JSON.

Data is stored on each device (localStorage + IndexedDB for photos). Use Export/Import to move it between phones.

`HANDOVER.md` is the original build brief.

