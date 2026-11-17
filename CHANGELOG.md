# v8.6 · Progressive daily stages

- Add a vegetable line in Stage 2, a ranch in Stage 3, cakes and power in Stage 4, and renewable forestry in Stage 5. Required return trips rise from 2 to 8, 19, 33 and 53.
- Show production and delivered quantities side by side by product. Starting checks include each stage's required facilities.
- Ordinary-only, zero-stock simulations complete the five stages in 184, 328, 426, 560 and 758 seconds, within their respective 300, 420, 540, 660 and 900 second windows.
- Retain original plan snapshots for active attempts and retries, and replay historical wallet traces using the rules offered at their recorded start time.

# v8.5 · Facility motion

- Animate production, storage, transport, crops and town buildings using existing game events. Pausing freezes the farm view.
- Preview a working facility by hovering or focusing a shop card or opening an NFT detail view. In Settings, facility animations can be switched off separately from environmental particles.
- Keep model bodies cached, share the rendering loop, and limit the shop to one animated preview.

# v8.4 · Facility artwork

- The map, placement preview, construction shortcuts, farm coin shop and NFT market share facility geometry. Building variants display equipment and materials that match their names.
- Click a visible roof, blade or body to inspect the facility. Zoom up to 450% for a closer look.

# v8.3 · Farm operations and map

- Preview the starter bread line from the build bar. Open an active challenge's live goals directly and confirm a restart separately.
- Read grain and goods capacity side by side. Inspect individual shortages and load a shipment from the inventory desk. The desk previews the space and settlement before loading.
- Choose the automatic truck's product, highest revenue per trip or most space per trip. Challenge priorities and ingredient reserves still apply.
- Frame the farm on entry and camera reset. Placement previews show road access and tool coverage. Meadow and river textures are cached, and improved building details distinguish warehouses, freight stations and bakeries.

# v8.2 · Stage restart fix

- Recover missing, null, zero or invalid construction counters from the actual rebuilt map when a save loads. Legacy and paid-round restrictions remain enforced.
- Use a fresh preparation check for confirmation, and show rejected starts inside the stage dialog.
- Prevent repeated confirmation clicks and prevent account switches from starting another farm's attempt.
- After starting or restarting, open the live Goals panel so the new countdown is visible.
- Preserve buildings, roads, NFTs, coins, stock and paid work. Only the current attempt progress and timer reset.
- 184 tests pass, including restored-save and expired-attempt regressions. No updated website was published.
