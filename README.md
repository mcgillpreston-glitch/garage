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
- **Photos for every item**: tap the Photo button on any row. With online photo storage connected, each photo gets a web link and opens on any device.
- **Garage map**: each wall drawn with its pegboards, shelves, bins, cabinets and workbench, showing item photos where they live.
- **Backup**: export and import the item list as JSON.

## Online photo storage (Cloudflare)

`cloudflare/worker.js` is a small Worker that stores photos in Workers KV (namespace `garage-stock-photos`).

1. Cloudflare dashboard → Workers & Pages → Create → Worker → name it `garage-photos` → Deploy.
2. Edit code → paste `cloudflare/worker.js` → Deploy.
3. Worker → Settings → Bindings → Add → KV namespace → variable name `PHOTOS`, namespace `garage-stock-photos`.
4. Worker → Settings → Variables and Secrets → Add → type Secret, name `UPLOAD_KEY`, value: any long random string.
5. In the app: Settings → Online photo storage → paste the Worker link and the same key → Test connection.

Photo links are public to anyone who has the exact link; uploading and deleting need the key.

The item list is stored on each device (localStorage). Photos are stored online once storage is connected, otherwise on the device. Use Export/Import to move it between phones.

`HANDOVER.md` is the original build brief.

