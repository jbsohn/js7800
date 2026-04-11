// ----------------------------------------------------------------------------
// YM2149 (AY-3-8910) Emulation wrapper for js7800
// Loads aym-emulator.js "as-is" without modifications.
// ----------------------------------------------------------------------------

var YM_BUFFER_SIZE = 2048;

var ym_buffer = new Uint8Array(YM_BUFFER_SIZE);
var ym_soundCntr = 0;

var emulator = null;
var emulatorClass = null;
var ready = false;
var writeQueue = [];

// Default cycles per sample for NTSC
var cycles_per_sample = 56.71;
var fractional_cycles = 0;

/**
 * Initialize the emulator by loading the non-module script.
 */
async function initEmulator() {
  if (ready) return;

  try {
    const response = await fetch('js/aym-emulator.js');
    if (!response.ok) throw new Error("Fetch failed: " + response.status);
    const script = await response.text();

    // Wrap in a function that returns the class
    const wrapper = new Function('', script + '\nreturn AYM_Emulator;');
    emulatorClass = wrapper();
    emulator = new emulatorClass({ type: 'YM' });

    // Play back queued writes
    for (let i = 0; i < writeQueue.length; i++) {
      const w = writeQueue[i];
      if (w.type === 'addr') emulator.set_register_index(w.data);
      else emulator.set_register_value(w.data);
    }
    writeQueue = [];
    ready = true;
    console.log("YM2149 Emulator ready.");
  } catch (e) {
    console.error("Failed to load aym-emulator.js", e);
  }
}

function ym_Reset() {
  if (emulator) emulator.reset();
  else writeQueue = [];
  ym_Clear(true);
  fractional_cycles = 0;
}

function ym_SetSampleRate(freq, scanlines) {
  if (arguments.length < 2) return;
  if (freq <= 0 || scanlines <= 0) return;
  var internalSampleRate = freq * scanlines * 2;
  cycles_per_sample = 1789772.5 / internalSampleRate;
}

function ym_WriteAddress(data) {
  if (ready) emulator.set_register_index(data);
  else writeQueue.push({ type: 'addr', data: data });
}

function ym_WriteData(data) {
  if (ready) emulator.set_register_value(data);
  else writeQueue.push({ type: 'data', data: data });
}

function ym_Process(length) {
  if (!ready || isNaN(cycles_per_sample)) {
    // If not ready, we just produce silence
    for (var s = 0; s < length; s++) {
      ym_buffer[ym_soundCntr++] = 0;
      if (ym_soundCntr >= YM_BUFFER_SIZE) ym_soundCntr = 0;
    }
    return;
  }

  for (var s = 0; s < length; s++) {
    fractional_cycles += cycles_per_sample;
    var integral_cycles = Math.floor(fractional_cycles);
    fractional_cycles -= integral_cycles;

    for (var c = 0; c < integral_cycles; c++) {
      emulator.clock();
    }

    // Mixing logic
    var v0 = emulator.get_channel0();
    var v1 = emulator.get_channel1();
    var v2 = emulator.get_channel2();

    var u0 = (v0 > 0 ? v0 : 0);
    var u1 = (v1 > 0 ? v1 : 0);
    var u2 = (v2 > 0 ? v2 : 0);

    var total = (u0 + u1 + u2) * 60.0;

    ym_buffer[ym_soundCntr++] = Math.min(255, total) | 0;
    if (ym_soundCntr >= YM_BUFFER_SIZE) ym_soundCntr = 0;
  }
}

function ym_Clear(flush) {
  ym_soundCntr = 0;
  if (flush) {
    for (var i = 0; i < YM_BUFFER_SIZE; i++) ym_buffer[i] = 0;
  }
}

// Trigger initialization
initEmulator();

export {
  ym_Reset as Reset,
  ym_WriteAddress as WriteAddress,
  ym_WriteData as WriteData,
  ym_Process as Process,
  ym_Clear as Clear,
  ym_SetSampleRate as SetSampleRate,
  ym_buffer as buffer
}
