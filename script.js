/* ==========================================================================
   SUAS Portal Client-Side Application Script (script.js)
   Handles tabs, Part 107 compliance calculator, drone assembly guide,
   localStorage data management, and study quiz engine.
   ========================================================================== */

// Tailwind CSS In-Browser Configuration
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        colors: {
          brand: {
            50: '#f0f7ff',
            100: '#e0effe',
            200: '#bae0fd',
            500: '#0284c7',
            600: '#0369a1',
            700: '#075985',
            800: '#0c4a6e',
            900: '#082f49',
          }
        }
      }
    }
  };
}

// State management
    const state = {
      activeTab: 'home',
      unitSystem: 'US', // 'US' or 'Metric'
      customRecords: [],
      activeFilter: 'ALL',
      searchQuery: '',
      quizAnswers: {},
      selectedComponent: 'frame',
      assemblyStepsChecked: {},
      motorSpinMode: 'in' // 'in' or 'out'
    };

    // Component Explorer Data
    const componentData = {
      frame: {
        title: 'Carbon Fiber Quadcopter Frame (e.g. 5" Freestyle or 7" Long-Range)',
        role: 'Mechanical Chassis & Structural Foundation',
        specs: 'High-strength 3K Toray carbon fiber (4-6mm arm thickness), CNC aluminum or titanium standoffs, 20x20mm / 30.5x30.5mm mounting stack holes.',
        wiring: 'No direct electrical connections; however, carbon fiber is highly conductive. Ensure all solder joints and power traces are insulated from carbon plates.',
        caution: 'Always use blue threadlocker (Loctite 242) on all steel screws threading into aluminum standoffs. Never use Loctite on polycarbonate camera mounts.'
      },
      motors: {
        title: 'Brushless DC Outrunner Motors (e.g., 2207 / 2306 KV)',
        role: 'Aerodynamic Propulsion & Thrust Generation',
        specs: 'Permanent magnet rotor, multi-pole stator (e.g. 12N14P), curved N52SH neodymium magnets, hollow titanium shaft, 1750KV (for 6S LiPo) to 2450KV (for 4S LiPo).',
        wiring: '3 silicone-insulated phase wires soldered to the corresponding corner pads of the 4-in-1 ESC. Phase order determines motor rotation direction.',
        caution: 'Verify motor mounting screw length! If a screw is even 0.5mm too long, it will touch and pierce the internal copper stator windings, creating a dead short.'
      },
      esc: {
        title: '4-in-1 Electronic Speed Controller (ESC)',
        role: 'High-Current Motor Switching & Commutation',
        specs: '45A - 60A continuous current per channel, BLHeli_32 or Bluejay firmware, bidirectional DSHOT600 digital protocol, built-in current sensor shunt.',
        wiring: 'Main battery pads wired to XT60 power harness. 4 sets of 3-pad motor outputs on outer perimeter. Multi-pin JST-SH connector to flight controller.',
        caution: 'High-temperature soldering required. Use generous flux and a wide chisel soldering tip at 390°C. Solder bridge shorts between + and - will cause instant fire.'
      },
      fc: {
        title: 'Flight Controller (FC) - STM32 MCU',
        role: 'Central Processing Unit, Sensor Fusion & PID Loop',
        specs: 'STM32 F722 / H743 ARM Cortex microcontroller, 3.2kHz gyro sampling, barometer (altitude hold), OSD (MAX7456 / digital HD), 4-6 hardware UART serial ports.',
        wiring: 'Connected via 8-pin harness to ESC (GND, VBAT, Motors 1-4, Current, Telemetry). UARTs wired to Receiver, VTX, GPS, and telemetry peripherals.',
        caution: 'Always soft-mount on silicone anti-vibration grommets. Do not overtighten M3 stack nuts, or vibrations will overwhelm the MEMS gyroscope.'
      },
      power: {
        title: 'Power System: XT60 Pigtail & Low-ESR Capacitor',
        role: 'Clean Battery Power Delivery & Voltage Spike Suppression',
        specs: '14AWG high-strand flexible silicone wire, genuine Amass XT60H connector, 35V / 50V 1000uF Rubycon ZLH Low-ESR electrolytic capacitor.',
        wiring: 'Capacitor soldered directly across positive and negative battery pads on ESC as close to the board as physically possible.',
        caution: 'Observe electrolytic capacitor polarity! The gray/white stripe on the capacitor indicates negative (-). Connecting backwards will cause the capacitor to explode.'
      },
      receiver: {
        title: 'Radio Control Receiver (e.g., ExpressLRS / Crossfire)',
        role: 'Long-Range Remote Command & Control (C2) Link',
        specs: '2.4GHz / 915MHz LoRa spread spectrum, packet rates up to 500Hz, full telemetry transmission, CRSF digital serial protocol.',
        wiring: '4-wire connection to flight controller: 5V power, GND, Receiver TX to FC RX, and Receiver RX to FC TX (crossed serial UART).',
        caution: 'Keep receiver dipole or T-antenna oriented at 90 degrees away from carbon fiber arms to prevent RF shadowing and signal fail-safes.'
      },
      fpv: {
        title: 'Camera & Video Transmitter (VTX) Payload',
        role: 'Visual Feedback & Real-Time Situational Awareness',
        specs: 'HD Digital (DJI O3 / Walksnail Avatar) or 1200TVL Low-Latency Analog CMOS camera, 25mW to 1000mW selectable RF output on 5.8GHz.',
        wiring: 'Camera connects to FC CAM pad (or digital air unit); VTX connects to FC VTX pad and dedicated 9V / 12V filtered BEC power rail.',
        caution: 'NEVER power on a high-power VTX without an antenna firmly attached. Operating without an RF load will destroy the RF power amplifier in seconds.'
      },
      props: {
        title: 'Propellers (CW and CCW Matched Pairs)',
        role: 'Aerodynamic Lift & Directional Control',
        specs: 'Polycarbonate durable tri-blade propellers (e.g. 5x4.3x3), balanced hub with 5mm M5 shaft hole and nyloc locknut.',
        wiring: 'Mechanical attachment only. Two clockwise (CW) props and two counter-clockwise (CCW) props mounted in opposing diagonal corners.',
        caution: 'Propellers must NEVER be attached to the motors during workbench soldering, firmware flashing, or bench motor testing!'
      }
    };

    // Pre-populated Custom Records
    const defaultRecords = [
      {
        id: 'rec-1',
        title: 'DJI Mavic 3 Pro Cine',
        category: 'Aircraft Fleet',
        tag: 'FA-39148201',
        details: 'Takeoff weight: 958g (2.11 lbs). Max flight time: 43 mins. Triple camera system (Hasselblad 4/3 CMOS). Omnidirectional obstacle sensing enabled.',
        date: '2026-11-09'
      },
      {
        id: 'rec-2',
        title: '5-Inch Carbon Build - Bench Test Complete',
        category: 'Drone Assembly',
        tag: 'BUILD-01',
        details: 'Frame: Apex 5. Motors: T-Motor 2207 1950KV. ESC: Foxy 55A 4-in-1. FC: F722 with Betaflight 4.5. Smoke stopper passed at 45mA idle. ELRS 2.4GHz telemetry verified.',
        date: '2026-11-09'
      },
      {
        id: 'rec-3',
        title: 'Roof Inspection Mission - Site Alpha',
        category: 'Mission Notes',
        tag: 'JOB-2026-104',
        details: 'Class G airspace. Max planned altitude: 180 ft AGL. Wind gust limit: 15 kts. Visual observer assigned. Pre-flight battery health confirmed at 98%.',
        date: '2026-11-08'
      }
    ];

    // Quiz Questions
    const quizQuestions = [
      {
        id: 1,
        question: 'Under 14 CFR Part 107, what is the maximum allowable takeoff weight for a small unmanned aircraft?',
        options: [
          'Less than 50 pounds',
          'Less than 55 pounds (including all attachments & payload)',
          'Exactly 65 pounds',
          'Up to 100 pounds with standard registration'
        ],
        correct: 1,
        explanation: '14 CFR § 107.3 defines a small unmanned aircraft as weighing less than 55 pounds (25 kg) on takeoff.'
      },
      {
        id: 2,
        question: 'What is the standard maximum allowable altitude for sUAS flight under Part 107?',
        options: [
          '500 feet above mean sea level (MSL)',
          '400 feet above ground level (AGL)',
          '1,000 feet within airport boundaries',
          'No limit in Class G airspace'
        ],
        correct: 1,
        explanation: '14 CFR § 107.51 limits maximum altitude to 400 feet AGL unless flown within 400 feet of a structure.'
      },
      {
        id: 3,
        question: 'When assembling a drone on the workbench, why must propellers be removed during configuration?',
        options: [
          'To prevent motor phase wires from overheating',
          'To save battery life during USB connection',
          'Severe safety risk: unexpected motor throttle spikes cause deep cuts and lacerations',
          'Propellers interfere with flight controller accelerometer calibration'
        ],
        correct: 2,
        explanation: 'Spinning brushless drone motors produce immense torque and blade speed. Props must NEVER be installed on the bench.'
      },
      {
        id: 4,
        question: 'What is the purpose of using a "Smoke Stopper" current limiter during initial drone power-on?',
        options: [
          'It charges the LiPo battery to storage voltage',
          'It instantly trips power in milliseconds if a solder short or reverse polarity exists, preventing component burnout',
          'It boosts 5V power to the video transmitter',
          'It sets the flight controller gyro PID loop rate'
        ],
        correct: 1,
        explanation: 'A smoke stopper acts as an ultra-fast electronic fuse, preventing catastrophic component destruction from soldering shorts.'
      },
      {
        id: 5,
        question: 'Which airspace allows sUAS operations up to 400 ft AGL without prior air traffic control authorization?',
        options: [
          'Class B airspace',
          'Class D surface area',
          'Class G uncontrolled airspace',
          'Class C airspace shelf'
        ],
        correct: 2,
        explanation: 'Class G is uncontrolled airspace and does not require prior ATC authorization for sUAS operations up to 400 ft AGL.'
      }
    ];

    // Security: Whitelist allowed categories
    const ALLOWED_CATEGORIES = [
      'Aircraft Fleet',
      'Drone Assembly',
      'Battery Log',
      'Mission Notes',
      'Equipment Spec',
      'Maintenance'
    ];

    // Security: Robust HTML Entity Encoder (prevent XSS in HTML body, attribute, and script contexts)
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    }

    // Security: Sanitize record IDs to prevent DOM attribute injection
    function sanitizeId(id) {
      if (!id) return 'rec-' + Date.now();
      return String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    }

    // Security: Schema validator & sanitizer for deserialized records (anti-prototype pollution & type validation)
    function sanitizeAndValidateRecords(raw) {
      if (!Array.isArray(raw)) return [...defaultRecords];
      const sanitized = [];
      const MAX_RECORDS = 100;

      for (let i = 0; i < Math.min(raw.length, MAX_RECORDS); i++) {
        const item = raw[i];
        if (!item || typeof item !== 'object') continue;
        
        // Block prototype pollution properties
        if (Object.prototype.hasOwnProperty.call(item, '__proto__') ||
            Object.prototype.hasOwnProperty.call(item, 'constructor') ||
            Object.prototype.hasOwnProperty.call(item, 'prototype')) {
          continue;
        }

        const id = sanitizeId(item.id);
        const title = typeof item.title === 'string' ? item.title.trim().substring(0, 100) : 'Untitled';
        const category = ALLOWED_CATEGORIES.includes(item.category) ? item.category : 'Equipment Spec';
        const tag = typeof item.tag === 'string' ? item.tag.trim().substring(0, 50) : 'N/A';
        const details = typeof item.details === 'string' ? item.details.trim().substring(0, 2000) : '';
        const date = typeof item.date === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(item.date) 
          ? item.date 
          : new Date().toISOString().split('T')[0];

        if (title && details) {
          sanitized.push({ id, title, category, tag, details, date });
        }
      }

      return sanitized.length > 0 ? sanitized : [...defaultRecords];
    }

    
    // Feature Enhancement: Save & restore assembly progress in localStorage
    function loadSavedAssemblyProgress() {
      try {
        const saved = localStorage.getItem('suas_assembly_steps');
        if (saved) {
          const checkedSteps = JSON.parse(saved);
          if (Array.isArray(checkedSteps)) {
            checkedSteps.forEach(stepNum => {
              const cb = document.getElementById(`stepCheck${stepNum}`);
              if (cb) cb.checked = true;
            });
            updateAssemblyProgress();
          }
        }
      } catch (e) {
        console.warn('Could not load assembly progress from localStorage', e);
      }
    }

    function saveAssemblyProgress() {
      try {
        const checkboxes = document.querySelectorAll('.assembly-step-check');
        const checked = [];
        checkboxes.forEach(cb => {
          if (cb.checked) {
            checked.push(parseInt(cb.getAttribute('data-step')));
          }
        });
        localStorage.setItem('suas_assembly_steps', JSON.stringify(checked));
      } catch (e) {
        console.warn('Could not save assembly progress to localStorage', e);
      }
    }

    // Feature Enhancement: Save & restore unit preference in localStorage
    function loadSavedUnitPreference() {
      try {
        const savedUnit = localStorage.getItem('suas_unit_pref');
        if (savedUnit === 'Metric') {
          const btnMetric = document.getElementById('unitBtnMetric');
          if (btnMetric) btnMetric.click();
        }
      } catch (e) {
        console.warn('Could not load unit preference from localStorage', e);
      }
    }

    function saveUnitPreference(unit) {
      try {
        localStorage.setItem('suas_unit_pref', unit);
      } catch (e) {
        console.warn('Could not save unit preference to localStorage', e);
      }
    }

    // LocalStorage helper with security validation
    function loadSavedRecords() {
      try {
        const saved = localStorage.getItem('suas_user_records');
        if (saved) {
          const parsed = JSON.parse(saved);
          state.customRecords = sanitizeAndValidateRecords(parsed);
        } else {
          state.customRecords = [...defaultRecords];
          localStorage.setItem('suas_user_records', JSON.stringify(state.customRecords));
        }
      } catch (e) {
        state.customRecords = [...defaultRecords];
      }
    }

    function saveRecords() {
      try {
        // Enforce max storage cap to prevent LocalStorage denial of service (DoS)
        if (state.customRecords.length > 100) {
          state.customRecords = state.customRecords.slice(0, 100);
        }
        localStorage.setItem('suas_user_records', JSON.stringify(state.customRecords));
      } catch (e) {
        showCustomToast('Warning: Storage quota exceeded or disabled.');
      }
      renderRecords();
    }

    // Tab Navigation Switcher
    function initTabs() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          switchTab(tabId);
        });
      });

      // Hero quick navigation buttons
      document.getElementById('heroGoPart107')?.addEventListener('click', () => switchTab('part107'));
      document.getElementById('heroGoCalc')?.addEventListener('click', () => {
        switchTab('part107');
        document.getElementById('tab-calculator')?.scrollIntoView({ behavior: 'smooth' });
      });
      document.getElementById('heroGoAssembly')?.addEventListener('click', () => switchTab('assembly'));
      document.getElementById('heroGoCustom')?.addEventListener('click', () => {
        switchTab('custom-info');
        openAddForm();
      });

      // Pathway card buttons
      document.getElementById('pathwayPart107')?.addEventListener('click', () => switchTab('part107'));
      document.getElementById('pathwayAssembly')?.addEventListener('click', () => switchTab('assembly'));
      document.getElementById('pathwayCustom')?.addEventListener('click', () => switchTab('custom-info'));

      // Jump anchor buttons (Hardened: replacing inline onclick handlers)
      document.getElementById('btnJumpRules')?.addEventListener('click', () => {
        document.getElementById('tab-rules')?.scrollIntoView({ behavior: 'smooth' });
      });
      document.getElementById('btnJumpCalc')?.addEventListener('click', () => {
        document.getElementById('tab-calculator')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    function switchTab(tabId) {
      if (tabId === 'rules' || tabId === 'calculator') {
        const targetScroll = tabId === 'calculator' ? 'tab-calculator' : 'tab-rules';
        tabId = 'part107';
        setTimeout(() => {
          document.getElementById(targetScroll)?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
      state.activeTab = tabId;
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-tab') === tabId;
        if (isCurrent) {
          btn.classList.add('border-sky-500', 'text-sky-400', 'bg-slate-800/50');
          btn.classList.remove('border-transparent', 'text-slate-400');
        } else {
          btn.classList.remove('border-sky-500', 'text-sky-400', 'bg-slate-800/50');
          btn.classList.add('border-transparent', 'text-slate-400');
        }
      });

      document.querySelectorAll('.tab-content').forEach(section => {
        if (section.id === `tab-${tabId}`) {
          section.classList.remove('hidden');
          section.classList.add('block');
        } else {
          section.classList.add('hidden');
          section.classList.remove('block');
        }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Unit Converter (US Imperial <-> Metric)
    function initUnitSwitcher() {
      const btnUS = document.getElementById('unitBtnUS');
      const btnMetric = document.getElementById('unitBtnMetric');

      btnUS.addEventListener('click', () => {
        state.unitSystem = 'US';
        saveUnitPreference('US');
        btnUS.classList.add('bg-sky-600', 'text-white', 'font-semibold');
        btnUS.classList.remove('text-slate-300');
        btnMetric.classList.remove('bg-sky-600', 'text-white', 'font-semibold');
        btnMetric.classList.add('text-slate-300');
        updateUnitDisplays();
      });

      btnMetric.addEventListener('click', () => {
        state.unitSystem = 'Metric';
        saveUnitPreference('Metric');
        btnMetric.classList.add('bg-sky-600', 'text-white', 'font-semibold');
        btnMetric.classList.remove('text-slate-300');
        btnUS.classList.remove('bg-sky-600', 'text-white', 'font-semibold');
        btnUS.classList.add('text-slate-300');
        updateUnitDisplays();
      });
    }

    function updateUnitDisplays() {
      const alt = document.getElementById('statAltitude');
      const spd = document.getElementById('statSpeed');
      const wt = document.getElementById('statWeight');
      const vis = document.getElementById('statVisibility');

      if (state.unitSystem === 'US') {
        if (alt) alt.innerHTML = '400 <span class="text-base font-medium text-slate-600">ft AGL</span>';
        if (spd) spd.innerHTML = '100 <span class="text-base font-medium text-slate-600">mph</span>';
        if (wt) wt.innerHTML = '&lt; 55 <span class="text-base font-medium text-slate-600">lbs</span>';
        if (vis) vis.innerHTML = '3 <span class="text-base font-medium text-slate-600">statute miles</span>';
      } else {
        if (alt) alt.innerHTML = '122 <span class="text-base font-medium text-slate-600">m AGL</span>';
        if (spd) spd.innerHTML = '161 <span class="text-base font-medium text-slate-600">km/h (87 kts)</span>';
        if (wt) wt.innerHTML = '&lt; 24.9 <span class="text-base font-medium text-slate-600">kg</span>';
        if (vis) vis.innerHTML = '4.8 <span class="text-base font-medium text-slate-600">kilometers</span>';
      }
      evaluateCompliance();
    }

    // Compliance Calculator
    function initCalculator() {
      const weightInput = document.getElementById('calcWeight');
      const altInput = document.getElementById('calcAltitude');
      const visInput = document.getElementById('calcVisibility');
      const speedInput = document.getElementById('calcSpeed');
      const structInput = document.getElementById('calcNearStructure');
      const cloudBelow = document.getElementById('calcCloudBelow');
      const cloudHoriz = document.getElementById('calcCloudHoriz');

      [weightInput, altInput, visInput, speedInput, structInput, cloudBelow, cloudHoriz].forEach(el => {
        if (el) {
          el.addEventListener('input', evaluateCompliance);
          el.addEventListener('change', evaluateCompliance);
        }
      });

      evaluateCompliance();
    }

    function evaluateCompliance() {
      let weight = parseFloat(document.getElementById('calcWeight')?.value);
      let alt = parseFloat(document.getElementById('calcAltitude')?.value);
      let vis = parseFloat(document.getElementById('calcVisibility')?.value);
      let speed = parseFloat(document.getElementById('calcSpeed')?.value);
      const nearStructure = Boolean(document.getElementById('calcNearStructure')?.checked);
      let belowCloud = parseFloat(document.getElementById('calcCloudBelow')?.value);
      let horizCloud = parseFloat(document.getElementById('calcCloudHoriz')?.value);

      // Defense-in-depth: Validate numeric finite bounds against NaN injection
      weight = (Number.isFinite(weight) && weight >= 0) ? Math.min(weight, 1000) : 4.2;
      alt = (Number.isFinite(alt) && alt >= 0) ? Math.min(alt, 10000) : 250;
      vis = (Number.isFinite(vis) && vis >= 0) ? Math.min(vis, 100) : 5.0;
      speed = (Number.isFinite(speed) && speed >= 0) ? Math.min(speed, 500) : 35;
      belowCloud = (Number.isFinite(belowCloud) && belowCloud >= 0) ? belowCloud : 600;
      horizCloud = (Number.isFinite(horizCloud) && horizCloud >= 0) ? horizCloud : 3000;

      const weightLabel = document.getElementById('calcWeightLabel');
      const altLabel = document.getElementById('calcAltitudeLabel');
      const visLabel = document.getElementById('calcVisibilityLabel');
      const speedLabel = document.getElementById('calcSpeedLabel');

      if (weightLabel) weightLabel.textContent = `${weight.toFixed(1)} lbs (${(weight * 0.453592).toFixed(2)} kg)`;
      if (altLabel) altLabel.textContent = `${alt} ft AGL (${Math.round(alt * 0.3048)} m)`;
      if (visLabel) visLabel.textContent = `${vis.toFixed(1)} statute miles (${(vis * 1.60934).toFixed(1)} km)`;
      if (speedLabel) speedLabel.textContent = `${speed} mph (${Math.round(speed * 0.868976)} kts)`;

      const passWeight = weight < 55.0;
      const passAlt = nearStructure ? true : (alt <= 400);
      const passVis = vis >= 3.0;
      const passSpeed = speed <= 100;
      const passCloud = belowCloud >= 500 && horizCloud >= 2000;

      updateRuleStatus('ruleWeightCheck', passWeight, weight < 55.0 ? 'PASS (&lt; 55 lbs)' : 'FAIL (&ge; 55 lbs)');
      updateRuleStatus('ruleAltCheck', passAlt, passAlt ? (nearStructure ? 'PASS (Structure Rule)' : 'PASS (&le; 400 ft)') : 'FAIL (&gt; 400 ft)');
      updateRuleStatus('ruleVisCheck', passVis, passVis ? 'PASS (&ge; 3 SM)' : 'FAIL (&lt; 3 SM)');
      updateRuleStatus('ruleSpeedCheck', passSpeed, passSpeed ? 'PASS (&le; 100 mph)' : 'FAIL (&gt; 100 mph)');
      updateRuleStatus('ruleCloudCheck', passCloud, passCloud ? 'PASS (500 ft / 2000 ft)' : 'FAIL (Cloud Violation)');

      const isAllPassing = passWeight && passAlt && passVis && passSpeed && passCloud;

      const badge = document.getElementById('complianceBadge');
      const icon = document.getElementById('complianceIcon');
      const title = document.getElementById('complianceTitle');
      const sub = document.getElementById('complianceSub');

      if (badge && icon && title && sub) {
        if (isAllPassing) {
          badge.className = 'p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 transition-all';
          icon.className = 'w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg';
          icon.textContent = '✓';
          title.textContent = 'FLIGHT PERMITTED';
          sub.textContent = 'All inputs satisfy Part 107 baseline requirements.';
        } else {
          badge.className = 'p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 transition-all';
          icon.className = 'w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-lg';
          icon.textContent = '✕';
          title.textContent = 'REGULATORY RESTRICTION';
          sub.textContent = 'One or more flight parameters exceed Part 107 legal limits.';
        }
      }
    }

    function updateRuleStatus(elementId, passed, text) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const span = el.querySelector('span:last-child');
      if (span) {
        span.innerHTML = text;
        span.className = passed ? 'font-bold text-emerald-600' : 'font-bold text-rose-600';
      }
    }

    // Drone Assembly Module Initialization
    function initDroneAssembly() {
      // Component Explorer Pills
      const pills = document.querySelectorAll('.comp-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          const compKey = pill.getAttribute('data-comp');
          state.selectedComponent = compKey;

          pills.forEach(p => {
            p.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
            p.classList.add('bg-slate-100', 'text-slate-700');
          });
          pill.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
          pill.classList.remove('bg-slate-100', 'text-slate-700');

          renderComponentDetail(compKey);
        });
      });
      renderComponentDetail(state.selectedComponent);

      // Assembly Steps Checkboxes
      const stepCheckboxes = document.querySelectorAll('.assembly-step-check');
      stepCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          updateAssemblyProgress();
          saveAssemblyProgress();
        });
      });
      updateAssemblyProgress();

      // Motor Rotation Mode Switcher
      const btnIn = document.getElementById('motorModeIn');
      const btnOut = document.getElementById('motorModeOut');

      btnIn?.addEventListener('click', () => {
        state.motorSpinMode = 'in';
        btnIn.classList.add('bg-emerald-600', 'text-white', 'font-semibold');
        btnIn.classList.remove('text-slate-600');
        btnOut.classList.remove('bg-emerald-600', 'text-white', 'font-semibold');
        btnOut.classList.add('text-slate-600');
        updateMotorRotationVisuals();
      });

      btnOut?.addEventListener('click', () => {
        state.motorSpinMode = 'out';
        btnOut.classList.add('bg-emerald-600', 'text-white', 'font-semibold');
        btnOut.classList.remove('text-slate-600');
        btnIn.classList.remove('bg-emerald-600', 'text-white', 'font-semibold');
        btnIn.classList.add('text-slate-600');
        updateMotorRotationVisuals();
      });

      // Smoke Stopper Simulator Buttons
      document.getElementById('simSafeTestBtn')?.addEventListener('click', () => runSmokeTest('safe'));
      document.getElementById('simShortPolarityBtn')?.addEventListener('click', () => runSmokeTest('polarity'));
      document.getElementById('simMotorShortBtn')?.addEventListener('click', () => runSmokeTest('motor'));
    }

    function renderComponentDetail(key) {
      const card = document.getElementById('componentDetailCard');
      const data = componentData[key];
      if (!card || !data) return;

      card.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">${data.role}</span>
            <h4 class="text-lg font-bold text-slate-900 mt-1">${data.title}</h4>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div class="p-3 bg-white rounded-lg border border-slate-200">
            <strong class="text-slate-900 block font-semibold mb-1">Specifications & Materials:</strong>
            <p class="text-slate-600 leading-relaxed">${data.specs}</p>
          </div>
          <div class="p-3 bg-white rounded-lg border border-slate-200">
            <strong class="text-slate-900 block font-semibold mb-1">Wiring & Electrical Interface:</strong>
            <p class="text-slate-600 leading-relaxed">${data.wiring}</p>
          </div>
        </div>
        <div class="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div><strong>Critical Engineering Caution:</strong> ${data.caution}</div>
        </div>
      `;
    }

    function updateAssemblyProgress() {
      const checkboxes = document.querySelectorAll('.assembly-step-check');
      let checkedCount = 0;
      checkboxes.forEach(cb => {
        if (cb.checked) checkedCount++;
      });
      const pct = Math.round((checkedCount / checkboxes.length) * 100);
      const text = document.getElementById('assemblyProgressText');
      const bar = document.getElementById('assemblyProgressBar');

      if (text) text.textContent = `${checkedCount} / ${checkboxes.length} (${pct}%)`;
      if (bar) bar.style.width = `${pct}%`;

      if (checkedCount === checkboxes.length) {
        showCustomToast('All assembly stages complete! Ready for pre-flight bench testing.');
      }
    }

    function updateMotorRotationVisuals() {
      const m1 = document.getElementById('m1Dir');
      const m2 = document.getElementById('m2Dir');
      const m3 = document.getElementById('m3Dir');
      const m4 = document.getElementById('m4Dir');
      const expl = document.getElementById('motorExplanationBox');

      if (state.motorSpinMode === 'in') {
        if (m4) { m4.textContent = 'CW ↻'; m4.className = 'text-[9px] font-mono text-emerald-400'; }
        if (m2) { m2.textContent = 'CCW ↺'; m2.className = 'text-[9px] font-mono text-rose-400'; }
        if (m3) { m3.textContent = 'CCW ↺'; m3.className = 'text-[9px] font-mono text-rose-400'; }
        if (m1) { m1.textContent = 'CW ↻'; m1.className = 'text-[9px] font-mono text-emerald-400'; }
        if (expl) {
          expl.innerHTML = '<strong>Props In (Standard):</strong> Front motors spin inward toward the center body line. Dirt/grass pushed outwards away from FPV camera lens.';
        }
      } else {
        if (m4) { m4.textContent = 'CCW ↺'; m4.className = 'text-[9px] font-mono text-rose-400'; }
        if (m2) { m2.textContent = 'CW ↻'; m2.className = 'text-[9px] font-mono text-emerald-400'; }
        if (m3) { m3.textContent = 'CW ↻'; m3.className = 'text-[9px] font-mono text-emerald-400'; }
        if (m1) { m1.textContent = 'CCW ↺'; m1.className = 'text-[9px] font-mono text-rose-400'; }
        if (expl) {
          expl.innerHTML = '<strong>Props Out (Reversed):</strong> Front motors spin outward. Reduces wash over camera during aggressive high-speed roll turns and keeps branches from hooking props.';
        }
      }
    }

    function runSmokeTest(type) {
      const led = document.getElementById('smokeLedIndicator');
      const status = document.getElementById('smokeLedStatus');
      const details = document.getElementById('smokeLedDetails');

      if (type === 'safe') {
        led.className = 'w-3 h-3 rounded-full bg-emerald-400 animate-pulse';
        status.className = 'font-bold text-emerald-400';
        status.textContent = 'TEST PASSED: 0 SHORTS (SAFE)';
        details.textContent = 'Current draw is nominal (~45mA idle). Flight controller and receiver boot cleanly. ESC startup chimes sound normally. Safe to connect USB and configure Betaflight!';
        showCustomToast('Smoke stopper check PASSED.');
      } else if (type === 'polarity') {
        led.className = 'w-3 h-3 rounded-full bg-rose-500 animate-ping';
        status.className = 'font-bold text-rose-400';
        status.textContent = 'TRIPPED: REVERSE POLARITY DETECTED!';
        details.textContent = 'Smoke Stopper polyfuse tripped in 4.2ms! Positive (+) and Negative (-) swapped. Without the current limiter, all MOSFET transistors on the ESC would have caught fire.';
        showCustomToast('Smoke stopper TRIPPED (Short circuit prevented)!');
      } else if (type === 'motor') {
        led.className = 'w-3 h-3 rounded-full bg-amber-400 animate-bounce';
        status.className = 'font-bold text-amber-400';
        status.textContent = 'TRIPPED: MOTOR WINDING STATOR SHORT';
        details.textContent = 'Motor 2 mounting screw penetrated copper winding and grounded to carbon fiber arm. Unscrew motor bolts, verify screw length is under 7mm, and inspect enamel insulation.';
        showCustomToast('Stator grounding fault detected.');
      }
    }

    // Custom Information Records Management
    function initCustomInfo() {
      const toggleBtn = document.getElementById('toggleAddFormBtn');
      const cancelBtn = document.getElementById('cancelRecordBtn');
      const saveBtn = document.getElementById('saveRecordBtn');
      const searchInput = document.getElementById('searchRecords');

      toggleBtn.addEventListener('click', toggleAddForm);
      cancelBtn.addEventListener('click', closeAddForm);
      saveBtn.addEventListener('click', handleSaveRecord);

      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderRecords();
      });

      // Category filters
      const filterBtns = document.querySelectorAll('.cat-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => {
            b.classList.remove('bg-sky-600', 'text-white');
            b.classList.add('bg-slate-100', 'text-slate-600');
          });
          btn.classList.add('bg-sky-600', 'text-white');
          btn.classList.remove('bg-slate-100', 'text-slate-600');

          state.activeFilter = btn.getAttribute('data-cat');
          renderRecords();
        });
      });

      renderRecords();
    }

    function toggleAddForm() {
      const form = document.getElementById('addRecordForm');
      if (form.classList.contains('hidden')) {
        openAddForm();
      } else {
        closeAddForm();
      }
    }

    function openAddForm() {
      const form = document.getElementById('addRecordForm');
      const text = document.getElementById('toggleAddFormText');
      form.classList.remove('hidden');
      text.textContent = 'Close Form';
      document.getElementById('customTitle')?.focus();
    }

    function closeAddForm() {
      const form = document.getElementById('addRecordForm');
      const text = document.getElementById('toggleAddFormText');
      form.classList.add('hidden');
      text.textContent = 'Add New Record';
      clearAddForm();
    }

    function clearAddForm() {
      document.getElementById('customTitle').value = '';
      document.getElementById('customTag').value = '';
      document.getElementById('customDetails').value = '';
    }

    function handleSaveRecord() {
      const rawTitle = document.getElementById('customTitle')?.value || '';
      const rawCategory = document.getElementById('customCategory')?.value || '';
      const rawTag = document.getElementById('customTag')?.value || '';
      const rawDetails = document.getElementById('customDetails')?.value || '';

      const title = rawTitle.trim().substring(0, 100);
      const tag = rawTag.trim().substring(0, 50);
      const details = rawDetails.trim().substring(0, 2000);
      const category = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : 'Equipment Spec';

      if (!title || !details) {
        showCustomToast('Please provide both a Title and Information Details.');
        return;
      }

      const newRecord = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title,
        category,
        tag: tag || 'N/A',
        details,
        date: new Date().toISOString().split('T')[0]
      };

      state.customRecords.unshift(newRecord);
      saveRecords();
      closeAddForm();
      showCustomToast('Record saved successfully!');
    }

    function deleteRecord(id) {
      state.customRecords = state.customRecords.filter(r => r.id !== id);
      saveRecords();
      showCustomToast('Record deleted.');
    }

    function renderRecords() {
      const grid = document.getElementById('recordsGrid');
      const emptyState = document.getElementById('emptyState');
      const countAll = document.getElementById('countAll');
      if (countAll) countAll.textContent = state.customRecords.length;

      let filtered = state.customRecords.filter(item => {
        const matchesCat = state.activeFilter === 'ALL' || item.category === state.activeFilter;
        const matchesSearch = !state.searchQuery || 
          item.title.toLowerCase().includes(state.searchQuery) ||
          item.details.toLowerCase().includes(state.searchQuery) ||
          (item.tag && item.tag.toLowerCase().includes(state.searchQuery));
        return matchesCat && matchesSearch;
      });

      if (!grid) return;
      grid.innerHTML = '';

      if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        grid.classList.add('hidden');
      } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');

        filtered.forEach(rec => {
          const card = document.createElement('div');
          card.className = 'bg-slate-50 hover:bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-300 shadow-sm transition-all flex flex-col justify-between group';

          let catBadgeClass = 'bg-sky-100 text-sky-800';
          if (rec.category === 'Aircraft Fleet') catBadgeClass = 'bg-indigo-100 text-indigo-800';
          if (rec.category === 'Drone Assembly') catBadgeClass = 'bg-emerald-100 text-emerald-800';
          if (rec.category === 'Mission Notes') catBadgeClass = 'bg-teal-100 text-teal-800';
          if (rec.category === 'Maintenance') catBadgeClass = 'bg-amber-100 text-amber-800';

          const safeId = sanitizeId(rec.id);
          const safeCategory = escapeHtml(rec.category);
          const safeDate = escapeHtml(rec.date);
          const safeTitle = escapeHtml(rec.title);
          const safeTag = escapeHtml(rec.tag);
          const safeDetails = escapeHtml(rec.details);
          const safeShortId = escapeHtml(safeId.substring(0, 10));

          card.innerHTML = `
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${catBadgeClass}">${safeCategory}</span>
                <span class="text-[11px] font-mono text-slate-600">${safeDate}</span>
              </div>
              <h4 class="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors mb-1">${safeTitle}</h4>
              ${rec.tag && rec.tag !== 'N/A' ? `<div class="text-xs font-mono text-slate-600 mb-2">ID: <span class="text-slate-700 font-semibold">${safeTag}</span></div>` : ''}
              <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">${safeDetails}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <span class="text-[11px] text-slate-600">ID: ${safeShortId}</span>
              <button data-delete-id="${safeId}" class="delete-rec-btn text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline">
                Delete
              </button>
            </div>
          `;
          grid.appendChild(card);
        });

        grid.querySelectorAll('.delete-rec-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-id');
            deleteRecord(id);
          });
        });
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // In-page Toast Feedback (DOM-Safe: uses textContent to prevent DOM XSS)
    function showCustomToast(message) {
      const existing = document.getElementById('customToast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'customToast';
      toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
      
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('class', 'w-4 h-4 text-sky-400 shrink-0');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

      const textSpan = document.createElement('span');
      textSpan.textContent = String(message).substring(0, 200); // Safe textContent + length bounded

      toast.appendChild(iconSvg);
      toast.appendChild(textSpan);
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      }, 10);

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    // Quiz Engine
    function initQuiz() {
      const container = document.getElementById('quizContainer');
      const resetBtn = document.getElementById('resetQuizBtn');

      resetBtn.addEventListener('click', resetQuiz);

      renderQuiz();
    }

    function renderQuiz() {
      const container = document.getElementById('quizContainer');
      if (!container) return;
      container.innerHTML = '';

      quizQuestions.forEach((q, idx) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'p-5 bg-slate-50 rounded-xl border border-slate-200';

        const userPick = state.quizAnswers[q.id];
        const isAnswered = userPick !== undefined;

        let optionsHtml = '';
        q.options.forEach((opt, optIdx) => {
          let btnClass = 'w-full text-left p-3 rounded-lg text-xs sm:text-sm font-medium transition-colors border ';

          if (!isAnswered) {
            btnClass += 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 cursor-pointer';
          } else {
            if (optIdx === q.correct) {
              btnClass += 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
            } else if (optIdx === userPick) {
              btnClass += 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
            } else {
              btnClass += 'bg-white border-slate-200 text-slate-600 opacity-60';
            }
          }

          optionsHtml += `
            <button data-qid="${q.id}" data-opt="${optIdx}" class="quiz-opt-btn ${btnClass}" ${isAnswered ? 'disabled' : ''}>
              <span class="font-mono mr-2">${String.fromCharCode(65 + optIdx)}.</span> ${opt}
            </button>
          `;
        });

        qBlock.innerHTML = `
          <div class="flex items-start justify-between gap-4 mb-3">
            <span class="text-xs font-mono font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded">Question ${idx + 1} of ${quizQuestions.length}</span>
            ${isAnswered ? (userPick === q.correct ? '<span class="text-xs font-bold text-emerald-600">✓ Correct</span>' : '<span class="text-xs font-bold text-rose-600">✕ Incorrect</span>') : ''}
          </div>
          <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-3">${q.question}</h3>
          <div class="space-y-2 mb-3">
            ${optionsHtml}
          </div>
          ${isAnswered ? `
            <div class="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
              <strong>FAA & Assembly Rule:</strong> ${q.explanation}
            </div>
          ` : ''}
        `;
        container.appendChild(qBlock);
      });

      container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const qid = parseInt(e.currentTarget.getAttribute('data-qid'));
          const opt = parseInt(e.currentTarget.getAttribute('data-opt'));
          state.quizAnswers[qid] = opt;
          updateScore();
          renderQuiz();
        });
      });

      updateScore();
    }

    function updateScore() {
      let correct = 0;
      Object.keys(state.quizAnswers).forEach(qid => {
        const q = quizQuestions.find(item => item.id === parseInt(qid));
        if (q && state.quizAnswers[qid] === q.correct) {
          correct++;
        }
      });
      const scoreEl = document.getElementById('quizScoreDisplay');
      if (scoreEl) {
        scoreEl.textContent = `${correct} / ${quizQuestions.length}`;
      }
    }

    function resetQuiz() {
      state.quizAnswers = {};
      renderQuiz();
      showCustomToast('Quiz reset.');
    }

    // App Initialization
    document.addEventListener('DOMContentLoaded', () => {
      loadSavedRecords();
      loadSavedUnitPreference();
      loadSavedAssemblyProgress();
      initTabs();
      initUnitSwitcher();
      initCalculator();
      initDroneAssembly();
      initCustomInfo();
      initQuiz();
    });
