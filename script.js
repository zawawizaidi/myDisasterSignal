const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx23XG03pK0O3PMn1AcM9hWkcUMoGPckDYMfmlTpTpmEsppa33tgoVJSvgv5i6nUxdK8g/exec';

const CRITICAL_KEYWORDS = [
    // General Distress
    'tolong', 'help', 'sos', 'bantuan', 'cemas', 'darurat', 'emergency', 'urgent', 'bahaya', 'danger',
    // Fire/Explosion
    'api', 'fire', 'terbakar', 'burn', 'asap', 'smoke', 'meletup', 'explosion', 'hangus',
    // Flood/Water
    'banjir', 'flood', 'air naik', 'water rising', 'lemas', 'drowning', 'tenggelam', 'hanyut', 'sinking',
    // Medical/Injury
    'sakit', 'pain', 'darah', 'blood', 'cedera', 'injured', 'patah', 'broken', 'pengsan', 'unconscious',
    'sesak', 'choking', 'mengandung', 'pregnant', 'melahirkan', 'labor',
    // Trapped/Lost
    'terperangkap', 'trapped', 'sesat', 'lost', 'runtuh', 'collapse'
];

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        name: '',
        message: '',
        lat: null,
        long: null,
        priority: 'NORMAL'
    };

    // Elements
    const steps = {
        start: document.getElementById('step-start'),
        name: document.getElementById('step-name'),
        message: document.getElementById('step-message'),
        processing: document.getElementById('step-processing'),
        success: document.getElementById('step-success')
    };

    const inputs = {
        name: document.getElementById('input-name'),
        message: document.getElementById('input-message')
    };

    const buttons = {
        start: document.getElementById('btn-start'),
        nameNext: document.getElementById('btn-name-next'),
        submit: document.getElementById('btn-submit')
    };

    const geoStatus = document.getElementById('geo-status');
    const geoText = document.getElementById('geo-text');
    const finalPriority = document.getElementById('final-priority');

    // --- Logic ---

    // 1. Init Geolocation immediately
    if ('geolocation' in navigator) {
        geoStatus.classList.remove('hidden');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.lat = pos.coords.latitude;
                state.long = pos.coords.longitude;
                geoText.textContent = "Location Secured";
                geoText.style.fontWeight = "600";
            },
            (err) => {
                console.error("Geo error:", err);
                geoText.textContent = "Location Failed";
                geoText.style.color = "var(--danger-red)";
            }
        );
    }

    // 2. Navigation Functions
    function goToStep(stepName) {
        // Hide all
        Object.values(steps).forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Show target
        const target = steps[stepName];
        // Short delay to allow 'hidden' transition to start
        setTimeout(() => {
            target.classList.remove('hidden');
            target.classList.add('active');

            // Auto focus inputs if applicable
            if (stepName === 'name') setTimeout(() => inputs.name.focus(), 100);
            if (stepName === 'message') setTimeout(() => inputs.message.focus(), 100);
        }, 300);
    }

    // 3. Event Listeners

    // Start -> Name
    buttons.start.addEventListener('click', () => {
        goToStep('name');
    });

    // Name -> Message
    function handleNameSubmit() {
        const val = inputs.name.value.trim();
        if (val) {
            state.name = val;
            goToStep('message');
        } else {
            inputs.name.placeholder = "Name is required!";
            inputs.name.classList.add('shake');
            setTimeout(() => inputs.name.classList.remove('shake'), 500);
        }
    }

    buttons.nameNext.addEventListener('click', handleNameSubmit);
    inputs.name.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameSubmit();
    });

    // Message -> Processing -> Success
    async function handleFinalSubmit() {
        const val = inputs.message.value.trim();
        if (!val) {
            inputs.message.placeholder = "Please state emergency!";
            return;
        }

        state.message = val;

        // PADS Analysis
        const lowerText = val.toLowerCase();
        const isCritical = CRITICAL_KEYWORDS.some(k => lowerText.includes(k));
        state.priority = isCritical ? 'CRITICAL' : 'NORMAL';

        // Transition to Processing (LOCKS INTERFACE)
        goToStep('processing');

        // Send Data
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: state.name,
                    message: state.message,
                    priority: state.priority,
                    latitude: state.lat,
                    longitude: state.long,
                    timestamp: new Date().toISOString()
                })
            });
            console.log("Sent successfully");
        } catch (e) {
            console.error("Send error", e);
        }

        // Show Success (after min delay for animation)
        setTimeout(() => {
            // Update Priority Badge in Success Card
            finalPriority.textContent = `PRIORITY: ${state.priority}`;
            if (state.priority === 'CRITICAL') {
                finalPriority.classList.add('priority-critical');
            }
            goToStep('success');
        }, 2000);
    }

    buttons.submit.addEventListener('click', handleFinalSubmit);
    inputs.message.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFinalSubmit();
    });
});
