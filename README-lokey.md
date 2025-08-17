# lokey-pokey-7800 / Pokey Debug Trace

This project has a lightweight debug hook added to **js7800** for capturing  
**Pokey register writes** during emulation.

---

## Usage (Developer Console)

1. **Open the browser dev tools console** (usually `F12` → *Console*).
2. Enable tracing with:

   ```js
   POKEY_DBG.on()
   ```

   - From this point forward, **all writes to POKEY registers** are logged
     into an internal buffer (CSV format).

3. Run your game / demo in js7800 for a few seconds.

4. Dump the trace buffer to a file:

   ```js
   POKEY_DBG.dump("trace.csv")
   ```

   - Creates a CSV string and triggers a browser download called `trace.csv`.
   - Format:  
     ```
     ts,address,reg,val
     12345,0x4000,0,0xFF
     12360,0x4001,1,0xAA
     ...
     ```

   Where:
   - `ts` = emulator cycle timestamp (monotonic)
   - `address` = full mapped POKEY address
   - `reg` = low-nibble register index (0–15)
   - `val` = written value

---

## Notes
- Use short runs (a few seconds) to avoid huge CSVs.
- The timestamp (`ts`) is deterministic and aligns with js7800’s internal cycle counter.
- This is for **debug only**; tracing may affect performance if left on for long periods.

---

## Example Session
```js
// in dev tools
POKEY_DBG.on()
```

Play a few seconds of *Ballblazer*.

```js
POKEY_DBG.dump("ballblazer-trace.csv")
```

Now you’ve got a CSV you can analyze or feed into libLOKEY for testing.
