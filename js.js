/* ===========================================
   js.js — Olahplastik (complete, normalized profile buttons)
   Single file: includes dark-mode consolidation and button normalization
   =========================================== */

/* -------------------------
   Configuration / Constants
   ------------------------- */
var NOTIF_SOUND_SRC = 'assets/sounds/ting.mp3';
var USERS_STORAGE_KEY = 'olahplastik_users';
var CURRENT_USER_KEY = 'olahplastik_current_user';

/* -------------------------
   LocalStorage Utilities
   ------------------------- */
function getUsers() {
    try {
        var raw = localStorage.getItem(USERS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to parse users from localStorage', e);
        return [];
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save users to localStorage', e);
    }
}

function findUserByEmailOrPhone(identifier) {
    if (!identifier) return null;
    var normalized = identifier.trim().toLowerCase();
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (!u) continue;
        if (u.email && u.email.toLowerCase() === normalized) return u;
        if (u.phone && u.phone === identifier.trim()) return u;
    }
    return null;
}

/* -------------------------
   Notification sound
   ------------------------- */
(function injectNotifAudio() {
    if (!document) return;
    var existing = document.getElementById('notif-sound');
    if (!existing) {
        var audio = document.createElement('audio');
        audio.id = 'notif-sound';
        audio.src = NOTIF_SOUND_SRC;
        audio.preload = 'auto';
        audio.style.display = 'none';
        if (document.body) document.body.appendChild(audio);
    }
})();
function playNotifSound() {
    var audio = document.getElementById('notif-sound');
    if (!audio) return;
    try {
        audio.currentTime = 0;
        var p = audio.play();
        if (p && p.catch) p.catch(function(){});
    } catch (e) {}
}

/* -------------------------
   DOMContentLoaded initialization
   ------------------------- */
document.addEventListener('DOMContentLoaded', function () {
    try { if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons(); } catch(e){}

    try { setupContactFormValidation(); } catch(e){ console.warn(e); }
    try { setupPickupFormValidation(); } catch(e){ console.warn(e); }
    try { setupCompanyFormValidation(); } catch(e){ console.warn(e); }
    try { setupEventFormValidation(); } catch(e){ console.warn(e); }
    try { setupSignupFormValidation(); } catch(e){ console.warn(e); }
    try { initScrollAnimations(); } catch(e){ console.warn(e); }

    // ensure main scroll enabled by default
    var mainScroll = document.getElementById('main-scroll-container');
    if (mainScroll) mainScroll.classList.add('overflow-y-auto');

    // update auth UI on load
    try { updateAuthUI(); } catch(e){}

    // init profile dark toggle if profile visible (central module exposes helper)
    try { if (document.getElementById('profile-page') && !document.getElementById('profile-page').classList.contains('hidden')) { window._centralProfileDarkApply && window._centralProfileDarkApply(localStorage.getItem('olahplastik_profile_dark') === '1'); } } catch(e){}

    // normalize profile buttons initially (if profile present)
    try { normalizeProfileButtons(); } catch(e){}
});

/* -------------------------
   IntersectionObserver scroll animations
   ------------------------- */
function initScrollAnimations() {
    var scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    var observerOptions = { root: scrollContainer, threshold: 0.12 };
    var observer;
    try {
        observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var el = entry.target;
                if (entry.isIntersecting) {
                    el.classList.add('pop-up-visible');
                    el.classList.remove('pop-up-hidden-down', 'pop-up-hidden-up');
                } else {
                    var containerRect = scrollContainer.getBoundingClientRect();
                    var elRect = entry.boundingClientRect;
                    if (elRect.top < containerRect.top) {
                        el.classList.add('pop-up-hidden-up');
                        el.classList.remove('pop-up-hidden-down');
                    } else {
                        el.classList.add('pop-up-hidden-down');
                        el.classList.remove('pop-up-hidden-up');
                    }
                    el.classList.remove('pop-up-visible');
                }
            });
        }, observerOptions);
    } catch (e) {
        console.warn('IntersectionObserver not available', e);
        return;
    }

    var activePage = scrollContainer.querySelector(':scope > div:not(.hidden)') || scrollContainer.querySelector('.fade-in:not(.hidden)') || scrollContainer;
    if (!activePage) return;

    var elements = activePage.querySelectorAll('.pop-up-element');
    for (var i=0;i<elements.length;i++){
        var el = elements[i];
        el.classList.remove('pop-up-visible', 'pop-up-hidden-up');
        el.classList.add('pop-up-hidden-down');
        try { observer.observe(el); } catch(e){}
    }

    // initial visibility
    var containerRect = scrollContainer.getBoundingClientRect();
    for (var j=0;j<elements.length;j++){
        var r = elements[j].getBoundingClientRect();
        var verticallyVisible = (r.top < containerRect.bottom) && (r.bottom > containerRect.top);
        if (verticallyVisible) {
            elements[j].classList.add('pop-up-visible');
            elements[j].classList.remove('pop-up-hidden-down', 'pop-up-hidden-up');
        }
    }
}

/* -------------------------
   Smooth wheel scrolling inside main-scroll-container
   ------------------------- */
(function enableSmoothWheelScroll() {
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window) return;
    var container = document.getElementById('main-scroll-container');
    if (!container) return;
    var config = { damping: 0.14, maxDeltaPerWheel: 2000, stopThreshold: 0.5 };
    var target = container.scrollTop;
    var current = container.scrollTop;
    var ticking = false;

    function rafLoop() {
        ticking = true;
        current += (target - current) * config.damping;
        container.scrollTop = current;
        if (Math.abs(target - current) > config.stopThreshold) {
            requestAnimationFrame(rafLoop);
        } else {
            container.scrollTop = target;
            current = target;
            ticking = false;
        }
    }
    function onWheel(e) {
        e.preventDefault();
        var delta = e.deltaY;
        target += delta;
        var maxScroll = container.scrollHeight - container.clientHeight;
        if (target < 0) target = 0;
        if (target > maxScroll) target = maxScroll;
        if (!ticking) requestAnimationFrame(rafLoop);
    }
    container.addEventListener('wheel', onWheel, { passive: false, capture: false });
    container.addEventListener('scroll', function() {
        if (!ticking) {
            target = container.scrollTop;
            current = container.scrollTop;
        }
    }, { passive: true });
})();

/* -------------------------
   Mobile menu toggle
   ------------------------- */
function toggleMobileMenu() {
    var overlay = document.getElementById('mobile-menu-overlay');
    var sidebar = document.getElementById('mobile-menu-sidebar');
    if (!overlay || !sidebar) return;
    if (sidebar.classList.contains('translate-x-full')) {
        overlay.classList.remove('hidden');
        setTimeout(function() {
            overlay.classList.remove('opacity-0');
            sidebar.classList.remove('translate-x-full');
        }, 10);
    } else {
        overlay.classList.add('opacity-0');
        sidebar.classList.add('translate-x-full');
        setTimeout(function() { overlay.classList.add('hidden'); }, 300);
    }
}

/* -------------------------
   Page navigation + footer visibility
   ------------------------- */
function showPage(pageId) {
    var appLayout = document.getElementById('app-layout');
    var loginContainer = document.getElementById('login-container');
    var signupContainer = document.getElementById('signup-container');
    var footer = document.getElementById('global-footer');

    if (appLayout) appLayout.classList.add('hidden');
    if (loginContainer) loginContainer.classList.add('hidden');
    if (signupContainer) signupContainer.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    if (pageId === 'login') {
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (footer) footer.classList.add('hidden');
        resetNavAppearance();
        // remove profile dark classes so overlay unaffected
        try {
            document.body.classList.remove('profile-dark-body');
            document.documentElement.classList.remove('profile-dark-body');
            if (appLayout) appLayout.classList.remove('profile-dark');
        } catch (e) {}
        return;
    } else if (pageId === 'signup') {
        if (signupContainer) signupContainer.classList.remove('hidden');
        if (footer) footer.classList.add('hidden');
        resetNavAppearance();
        try {
            document.body.classList.remove('profile-dark-body');
            document.documentElement.classList.remove('profile-dark-body');
            if (appLayout) appLayout.classList.remove('profile-dark');
        } catch (e) {}
        return;
    } else {
        if (appLayout) appLayout.classList.remove('hidden');
    }

    var pages = ['home', 'services', 'solutions', 'contact', 'all-about', 'pickup', 'dropoff', 'company', 'event', 'profile'];
    var mainScroll = document.getElementById('main-scroll-container');

    pages.forEach(function(page) {
        var el = document.getElementById(page + '-page');
        if (el) el.classList.add('hidden');
    });

    resetNavAppearance();

    if (!mainScroll) {
        var activePage = document.getElementById(pageId + '-page');
        if (activePage) activePage.classList.remove('hidden');
        try { if (window.lucide) lucide.createIcons(); } catch(e){}
        initScrollAnimations();
        // normalize profile buttons if profile shown
        try { if (pageId === 'profile') normalizeProfileButtons(); } catch(e){}
        return;
    }

    if (['all-about', 'pickup', 'dropoff', 'company', 'event', 'services', 'solutions', 'profile'].indexOf(pageId) !== -1) {
        mainScroll.classList.add('overflow-y-auto');
        mainScroll.classList.remove('overflow-hidden');
        if (pageId === 'services' || pageId === 'solutions') mainScroll.classList.add('justify-center'); else {
            mainScroll.classList.remove('justify-center');
            mainScroll.scrollTop = 0;
        }
        if (pageId === 'all-about') setNavActive('about');
        else if (['pickup','dropoff','company','event','services'].indexOf(pageId) !== -1) setNavActive('services');
        else if (pageId === 'solutions') setNavActive('solutions');
    } else if (pageId === 'contact') {
        mainScroll.classList.remove('overflow-y-auto');
        mainScroll.classList.add('overflow-hidden');
        mainScroll.classList.remove('justify-center');
        mainScroll.classList.remove('mask-vertical');
        setNavActive('contact');
    } else {
        mainScroll.classList.add('overflow-y-auto');
        mainScroll.classList.remove('overflow-hidden');
        mainScroll.classList.remove('justify-center');
        mainScroll.scrollTop = 0;
        mainScroll.classList.add('mask-vertical');
    }

    var activePage = document.getElementById(pageId + '-page');
    if (activePage) activePage.classList.remove('hidden');

    try { if (window.lucide) lucide.createIcons(); } catch(e){}
    initScrollAnimations();

    // Normalize profile buttons when profile page is shown
    try { if (pageId === 'profile') normalizeProfileButtons(); } catch(e){}
}

/* -------------------------
   Nav helpers
   ------------------------- */
function resetNavAppearance() {
    var navLinks = {
        about: document.getElementById('nav-about'),
        services: document.getElementById('nav-services'),
        solutions: document.getElementById('nav-solutions'),
        contact: document.getElementById('nav-contact')
    };
    for (var k in navLinks) {
        var nav = navLinks[k];
        if (nav) {
            nav.classList.remove('font-bold', 'text-black');
            nav.classList.add('text-gray-600');
        }
    }
}
function setNavActive(key) {
    var mapping = {
        about: document.getElementById('nav-about'),
        services: document.getElementById('nav-services'),
        solutions: document.getElementById('nav-solutions'),
        contact: document.getElementById('nav-contact')
    };
    var el = mapping[key];
    if (el) {
        el.classList.remove('text-gray-600');
        el.classList.add('font-bold', 'text-black');
    }
}

/* -------------------------
   ScrollTo Main Services
   ------------------------- */
function scrollToMainServices() {
    var container = document.getElementById('main-scroll-container');
    var servicesSection = document.getElementById('main-services-section');
    if (!container || !servicesSection) return;
    var offset = 80;
    var containerRect = container.getBoundingClientRect();
    var targetRect = servicesSection.getBoundingClientRect();
    var relativeTop = targetRect.top - containerRect.top;
    var targetScrollTop = container.scrollTop + relativeTop - offset;
    var maxScroll = container.scrollHeight - container.clientHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;
    var duration = 550;
    var start = container.scrollTop;
    var change = targetScrollTop - start;
    var startTime = performance.now();
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function animate(now) {
        var elapsed = now - startTime;
        var t = Math.min(1, elapsed / duration);
        var eased = easeInOutCubic(t);
        container.scrollTop = start + change * eased;
        if (t < 1) requestAnimationFrame(animate); else container.scrollTop = targetScrollTop;
    }
    requestAnimationFrame(animate);
}

/* -------------------------
   Forms: Contact
   ------------------------- */
function setupContactFormValidation() {
    var inputIds = ['contact-name', 'contact-phone', 'contact-email', 'contact-message'];
    var submitBtn = document.getElementById('contact-submit-btn');
    if (!submitBtn) return;
    var checkValidity = function() {
        var allFilled = inputIds.every(function(id) {
            var el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
        submitBtn.disabled = !allFilled;
        if (allFilled) {
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg');
        } else {
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
        }
    };
    for (var i=0;i<inputIds.length;i++){
        var el = document.getElementById(inputIds[i]);
        if (el) { el.addEventListener('input', checkValidity); el.addEventListener('change', checkValidity); }
    }
    checkValidity();
}
function handleContactSubmit() {
    var contactPage = document.getElementById('contact-page');
    if (contactPage) {
        var inputs = contactPage.querySelectorAll('input, textarea');
        for (var i=0;i<inputs.length;i++){
            var input = inputs[i];
            input.value = '';
            if (input.tagName.toLowerCase() === 'textarea') input.style.height = '';
        }
    }
    var submitBtn = document.getElementById('contact-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
    }
    var modal = document.getElementById('contact-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        try { playNotifSound(); } catch(e){}
    }
    try { if (window.lucide) lucide.createIcons(); } catch(e){}
}

/* -------------------------
   Forms: Pickup
   ------------------------- */
function setupPickupFormValidation() {
    var inputIds = ['pickup-name', 'pickup-phone', 'pickup-address', 'pickup-date', 'pickup-time'];
    var submitBtn = document.getElementById('pickup-submit-btn');
    if(!submitBtn) return;
    var checkValidity = function() {
        var allFilled = inputIds.every(function(id) {
            var el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
        var dateInput = document.getElementById('pickup-date');
        var warningEl = document.getElementById('pickup-date-warning');
        var logicalValid = true;
        if (dateInput && warningEl && dateInput.value && !warningEl.classList.contains('hidden')) logicalValid = false;
        var isValid = allFilled && logicalValid;
        submitBtn.disabled = !isValid;
        if (isValid) { submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg'); }
        else { submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg'); }
    };
    for (var i=0;i<inputIds.length;i++){
        var el = document.getElementById(inputIds[i]);
        if (el) { el.addEventListener('input', checkValidity); el.addEventListener('change', checkValidity); }
    }
    checkValidity();
}
function handlePickupSubmit() {
    var inputs = document.querySelectorAll('#pickup-page input, #pickup-page textarea, #pickup-page select');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    var submitBtn = document.getElementById('pickup-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('pickup-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
    try { if (window.lucide) lucide.createIcons(); } catch(e){}
}
function validatePickup() {
    var dateInput = document.getElementById('pickup-date');
    var timeSelect = document.getElementById('pickup-time');
    var warningEl = document.getElementById('pickup-date-warning');
    var warningText = document.getElementById('pickup-warning-text');
    if (!dateInput) return;
    var selectedDateStr = dateInput.value;
    if (!selectedDateStr) { if (warningEl) warningEl.classList.add('hidden'); return; }
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var todayStr = year + '-' + month + '-' + day;
    if (selectedDateStr < todayStr) {
        if (warningText) warningText.innerText = "Tanggal tidak valid";
        if (warningEl) warningEl.classList.remove('hidden');
        try { if (window.lucide) lucide.createIcons(); } catch(e){}
        return;
    }
    if (selectedDateStr === todayStr && timeSelect && timeSelect.value) {
        var currentHour = now.getHours();
        var slotStartHour = parseInt(timeSelect.value.split(':')[0], 10);
        if (currentHour >= slotStartHour) {
            if (warningText) warningText.innerText = "Jam sudah terlewat";
            if (warningEl) warningEl.classList.remove('hidden');
            try { if (window.lucide) lucide.createIcons(); } catch(e){}
            return;
        }
    }
    if (warningEl) warningEl.classList.add('hidden');
}

/* -------------------------
   Forms: Company
   ------------------------- */
function setupCompanyFormValidation() {
    var inputIds = ['company-name', 'company-email', 'company-address', 'company-frequency'];
    var submitBtn = document.getElementById('company-submit-btn');
    if(!submitBtn) return;
    var checkValidity = function() {
        var allFilled = inputIds.every(function(id) {
            var el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
        var freqEl = document.getElementById('company-frequency');
        var freq = freqEl ? freqEl.value : '';
        if (freq === 'mingguan') {
            var day = document.getElementById('company-day');
            if(!day || !day.value) allFilled = false;
        } else if (freq === 'bulanan') {
            var mDay = document.getElementById('company-month-day');
            var mWeek = document.getElementById('company-month-week');
            if(!mDay || !mDay.value || !mWeek || !mWeek.value) allFilled = false;
        }
        submitBtn.disabled = !allFilled;
        if (allFilled) { submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg'); }
        else { submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg'); }
    };
    var allInputs = ['company-name','company-email','company-address','company-frequency','company-day','company-month-day','company-month-week'];
    for (var i=0;i<allInputs.length;i++){
        var el = document.getElementById(allInputs[i]);
        if (el) { el.addEventListener('input', checkValidity); el.addEventListener('change', checkValidity); }
    }
    checkValidity();
}
function handleCompanySubmit() {
    var inputs = document.querySelectorAll('#company-page input, #company-page textarea, #company-page select');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    toggleFrequencyFields();
    var submitBtn = document.getElementById('company-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('company-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
    try { if (window.lucide) lucide.createIcons(); } catch(e){}
}
function toggleFrequencyFields() {
    var freqEl = document.getElementById('company-frequency');
    var frequency = freqEl ? freqEl.value : '';
    var weeklyField = document.getElementById('field-weekly');
    var monthlyField = document.getElementById('field-monthly');
    if (weeklyField) weeklyField.classList.add('hidden');
    if (monthlyField) monthlyField.classList.add('hidden');
    if (frequency === 'mingguan') { if (weeklyField) weeklyField.classList.remove('hidden'); }
    else if (frequency === 'bulanan') { if (monthlyField) monthlyField.classList.remove('hidden'); }
}

/* -------------------------
   Forms: Event
   ------------------------- */
function setupEventFormValidation() {
    var inputIds = ['event-name', 'event-organizer', 'event-email', 'event-location', 'event-date', 'event-time'];
    var submitBtn = document.getElementById('event-submit-btn');
    if(!submitBtn) return;
    var checkValidity = function() {
        var allFilled = inputIds.every(function(id) {
            var el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
        var warningEl = document.getElementById('event-date-warning');
        var dateInput = document.getElementById('event-date');
        var logicalValid = true;
        if (dateInput && warningEl && dateInput.value && !warningEl.classList.contains('hidden')) logicalValid = false;
        var isValid = allFilled && logicalValid;
        submitBtn.disabled = !isValid;
        if (isValid) { submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg'); }
        else { submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg'); }
    };
    for (var i=0;i<inputIds.length;i++){
        var el = document.getElementById(inputIds[i]);
        if (el) { el.addEventListener('input', checkValidity); el.addEventListener('change', checkValidity); }
    }
    checkValidity();
}
function handleEventSubmit() {
    var inputs = document.querySelectorAll('#event-page input, #event-page textarea, #event-page input');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    var submitBtn = document.getElementById('event-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('event-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
    try { if (window.lucide) lucide.createIcons(); } catch(e){}
}
function validateEventDate() {
    var dateInput = document.getElementById('event-date');
    var warningEl = document.getElementById('event-date-warning');
    if (!dateInput) return;
    if (!dateInput.value) { if (warningEl) warningEl.classList.add('hidden'); return; }
    var selectedDate = new Date(dateInput.value);
    var today = new Date();
    selectedDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    var diffTime = selectedDate - today;
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 3) {
        if (warningEl) warningEl.classList.remove('hidden');
        try { if (window.lucide) lucide.createIcons(); } catch(e){}
    } else {
        if (warningEl) warningEl.classList.add('hidden');
    }
}

/* -------------------------
   Signup (localStorage) & validation
   ------------------------- */
function setupSignupFormValidation() {
    var nameEl = document.getElementById('signup-name');
    var emailEl = document.getElementById('signup-email');
    var phoneEl = document.getElementById('signup-phone');
    var passEl = document.getElementById('signup-password');
    var passConfirmEl = document.getElementById('signup-password-confirm');
    var submitBtn = document.getElementById('signup-submit-btn');
    var passWarning = document.getElementById('signup-pass-warning');
    var dupWarning = document.getElementById('signup-duplicate-warning');

    if (!submitBtn) return;

    function checkValidity() {
        var filled = [nameEl, emailEl, phoneEl, passEl, passConfirmEl].every(function(el) { return el && el.value.trim() !== ''; });
        var passwordsMatch = passEl && passConfirmEl && (passEl.value === passConfirmEl.value);

        if (passWarning) {
            if (!passwordsMatch && ((passEl && passEl.value) || (passConfirmEl && passConfirmEl.value))) passWarning.classList.remove('hidden');
            else passWarning.classList.add('hidden');
        }
        if (dupWarning) dupWarning.classList.add('hidden');

        var isValid = filled && passwordsMatch;
        submitBtn.disabled = !isValid;

        if (isValid) {
            submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            submitBtn.classList.add('hover:bg-[#c4e04e]', 'shadow-lg');
            submitBtn.classList.remove('text-white');
        } else {
            submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
            submitBtn.classList.remove('hover:bg-[#c4e04e]', 'shadow-lg');
        }
    }

    var arr = [nameEl, emailEl, phoneEl, passEl, passConfirmEl];
    for (var i=0;i<arr.length;i++){
        if (!arr[i]) continue;
        arr[i].addEventListener('input', checkValidity);
        arr[i].addEventListener('change', checkValidity);
    }
    checkValidity();
}

function handleSignupSubmit() {
    var nameEl = document.getElementById('signup-name');
    var emailEl = document.getElementById('signup-email');
    var phoneEl = document.getElementById('signup-phone');
    var passEl = document.getElementById('signup-password');
    var passConfirmEl = document.getElementById('signup-password-confirm');

    var dupWarning = document.getElementById('signup-duplicate-warning');
    var passWarning = document.getElementById('signup-pass-warning');

    if (dupWarning) dupWarning.classList.add('hidden');

    var name = nameEl && nameEl.value.trim() || '';
    var email = emailEl && emailEl.value.trim() || '';
    var phone = phoneEl && phoneEl.value.trim() || '';
    var password = passEl && passEl.value || '';
    var passwordConfirm = passConfirmEl && passConfirmEl.value || '';

    if (!name || !email || !phone || !password || !passwordConfirm) return;
    if (password !== passwordConfirm) {
        if (passWarning) passWarning.classList.remove('hidden');
        return;
    } else {
        if (passWarning) passWarning.classList.add('hidden');
    }

    var normEmail = email.toLowerCase();
    var normPhone = phone;

    var users = getUsers();
    var emailTaken = false, phoneTaken = false;
    for (var i=0;i<users.length;i++){
        var u = users[i];
        if (!u) continue;
        if (u.email && u.email.toLowerCase() === normEmail) emailTaken = true;
        if (u.phone && u.phone === normPhone) phoneTaken = true;
    }

    if (emailTaken || phoneTaken) {
        if (dupWarning) {
            dupWarning.innerText = emailTaken && phoneTaken ? 'Email dan nomor telepon sudah terdaftar' : (emailTaken ? 'Email sudah terdaftar' : 'Nomor telepon sudah terdaftar');
            dupWarning.classList.remove('hidden');
        } else {
            alert('Email atau nomor telepon sudah terdaftar');
        }
        return;
    }

    var newUser = {
        id: 'u_' + Date.now(),
        name: name,
        email: normEmail,
        phone: normPhone,
        password: password, // plaintext (development only)
        points: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // set current user and navigate to profile
    setCurrentUser(newUser.id);

    var modal = document.getElementById('signup-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        try { playNotifSound(); } catch(e){}
    }

    var clearFields = [nameEl, emailEl, phoneEl, passEl, passConfirmEl];
    for (var j=0;j<clearFields.length;j++) { if (clearFields[j]) clearFields[j].value = ''; }

    var submitBtn = document.getElementById('signup-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
        submitBtn.classList.remove('hover:bg-[#c4e04e]', 'shadow-lg');
    }

    try { if (window.lucide) lucide.createIcons(); } catch(e){}
    // open profile page
    try { showPage('profile'); } catch(e){}
}

/* -------------------------
   Login handler
   ------------------------- */
function handleLoginSubmit() {
    var identifierEl = document.getElementById('login-identifier');
    var passwordEl = document.getElementById('login-password');
    var warningEl = document.getElementById('login-warning');

    if (warningEl) warningEl.classList.add('hidden');

    var identifier = identifierEl && identifierEl.value.trim();
    var password = passwordEl && passwordEl.value || '';

    if (!identifier || !password) {
        if (warningEl) { warningEl.innerText = 'Mohon isi email/nomor dan password'; warningEl.classList.remove('hidden'); }
        return;
    }

    var user = findUserByEmailOrPhone(identifier);
    if (!user) {
        if (warningEl) { warningEl.innerText = 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.'; warningEl.classList.remove('hidden'); }
        return;
    }

    if (user.password !== password) {
        if (warningEl) { warningEl.innerText = 'Password salah. Periksa kembali password Anda.'; warningEl.classList.remove('hidden'); }
        return;
    }

    // login success
    if (identifierEl) identifierEl.value = '';
    if (passwordEl) passwordEl.value = '';

    setCurrentUser(user.id);

    showPage('profile');

    var modal = document.getElementById('contact-success-modal');
    if (modal) {
        var h3 = modal.querySelector('h3');
        var p = modal.querySelector('p');
        if (h3) h3.innerText = 'Login Berhasil!';
        if (p) p.innerText = 'Selamat datang kembali.';
        modal.classList.remove('hidden');
        try { playNotifSound(); } catch(e){}
    }
    try { if (window.lucide) lucide.createIcons(); } catch(e){}
}

/* -------------------------
   Sign-out / session helpers
   ------------------------- */
function setCurrentUser(userId) {
    try { localStorage.setItem(CURRENT_USER_KEY, String(userId)); } catch(e) { console.error(e); }
    try { updateAuthUI(); } catch(e){}
    try { loadProfile(); } catch(e){}
}

function clearCurrentUser() {
    try { localStorage.removeItem(CURRENT_USER_KEY); } catch(e) { console.error(e); }
    try { updateAuthUI(); } catch(e){}
}

function getCurrentUserId() {
    try { return localStorage.getItem(CURRENT_USER_KEY); } catch(e) { return null; }
}

function getCurrentUser() {
    var id = getCurrentUserId();
    if (!id) return null;
    var users = getUsers();
    for (var i=0;i<users.length;i++){
        var u = users[i];
        if (u && u.id === id) return u;
    }
    return null;
}

function signOut() {
    try {
        // Clear current user session/key
        try { localStorage.removeItem('olahplastik_current_user'); } catch (e) { console.warn(e); }
        try { window._auth_original_backups = []; } catch(e){}

        // Play notification sound (best-effort)
        try { playNotifSound(); } catch (e) {}

        // Provide immediate feedback in console
        console.info('User signed out — reloading to restore UI to original state.');
        setTimeout(function(){
            // location.replace keeps back-history cleaner than location.href
            location.replace(location.pathname + location.search + location.hash);
        }, 200);

    } catch (e) {
        console.error('signOut error', e);
        // fallback: try hard reload
        try { location.reload(); } catch (_e) {}
    }
}

/* -------------------------
   Show/hide password (used by login/signup/profile)
   HTML: call togglePassword('login-password','login-pass-icon')
   ------------------------- */
function togglePassword(inputId, iconId) {
    var input = document.getElementById(inputId);
    var icon = document.getElementById(iconId);
    if (!input) return;
    var isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    if (icon && icon.setAttribute) {
        try { icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye'); } catch(e){}
        try { if (window.lucide) lucide.createIcons(); } catch(e){}
    }
}

/* -------------------------
   Profile page: render/load
   ------------------------- */
function loadProfile() {
    var nameEl = document.getElementById('profile-name');
    var phoneEl = document.getElementById('profile-phone');
    var emailEl = document.getElementById('profile-email');
    var passEl = document.getElementById('profile-password');
    var pointsEl = document.getElementById('profile-points');

    var currentUserId = getCurrentUserId();
    var users = getUsers();
    var user = null;
    if (currentUserId) {
        for (var i=0;i<users.length;i++) { if (users[i] && users[i].id === currentUserId) { user = users[i]; break; } }
    }
    if (!user && users.length > 0) user = users[users.length - 1];

    if (user) {
        if (nameEl) nameEl.value = user.name || '';
        if (phoneEl) phoneEl.value = user.phone || '';
        if (emailEl) emailEl.value = user.email || '';
        if (passEl) passEl.value = user.password || '';
        if (pointsEl) pointsEl.innerText = (user.points !== undefined ? String(user.points) : '0');
    } else {
        if (nameEl) nameEl.value = 'Contoh Nama';
        if (phoneEl) phoneEl.value = '0812xxxx';
        if (emailEl) emailEl.value = 'contoh@domain.com';
        if (passEl) passEl.value = 'password123';
        if (pointsEl) pointsEl.innerText = '0';
    }

    // ensure profile buttons normalized after loading profile
    try { normalizeProfileButtons(); } catch(e){}
}

/* -------------------------
   Auth UI: replace Sign Up / Login with Profil when logged in
   - robust search by onclick attributes and text
   - stores backups and restores on logout
   ------------------------- */
(function authUIManager() {
    if (!window._olah_auth_backup) window._olah_auth_backup = [];

    function textMatchesAuthLabel(el) {
        if (!el) return false;
        var txt = (el.innerText || '').trim().toLowerCase();
        if (!txt) {
            txt = ((el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'))) || '').trim().toLowerCase();
        }
        if (!txt) return false;
        return ['sign up','signup','daftar','register','login','masuk','sign in','signin'].indexOf(txt) !== -1;
    }

    function onclickMatches(el) {
        try {
            var oc = el.getAttribute && el.getAttribute('onclick') || '';
            if (!oc) return false;
            return oc.indexOf("showPage('signup')") !== -1 || oc.indexOf('showPage("signup")') !== -1 ||
                   oc.indexOf("showPage('login')") !== -1  || oc.indexOf('showPage("login")') !== -1;
        } catch (e) { return false; }
    }

    function findAuthNodes() {
        var all = Array.prototype.slice.call(document.querySelectorAll('a, button'));
        var out = [];
        for (var i=0;i<all.length;i++){
            var el = all[i];
            try {
                if (textMatchesAuthLabel(el) || onclickMatches(el)) out.push(el);
            } catch(e){}
        }
        return out;
    }

    function createProfileButtonFrom(origEl) {
        var tag = (origEl && origEl.tagName && origEl.tagName.toLowerCase() === 'a') ? 'a' : 'button';
        var btn = document.createElement(tag);
        if (origEl && origEl.className) {
            try { btn.className = origEl.className; } catch(e) { btn.className = ''; }
        }
        // normalize appearance: remove color utilities, then apply consistent blue style
        try { btn.className = btn.className.replace(/bg-[^\s]+/g, '').replace(/text-[^\s]+/g, '').replace(/border-[^\s]+/g, '').trim(); } catch(e){}
        var extra = ' py-3 px-6 rounded-lg font-semibold ';
        btn.className = (btn.className + ' ' + extra + ' bg-blue-600 text-white').trim();
        btn.innerText = 'Profil';
        btn.setAttribute('role','button');
        try { btn.dataset.replacedForProfile = '1'; } catch(e){}
        btn.addEventListener('click', function(e) {
            e && e.preventDefault && e.preventDefault();
            try { showPage('profile'); } catch(err){}
        });
        return btn;
    }

    function backupAndReplace() {
        try {
            var logged = !!getCurrentUserId();
            if (!logged) return;
            var nodes = findAuthNodes();
            if (!nodes || nodes.length === 0) return;
            // if we've already injected a profile button, skip
            if (document.querySelector('[data-replaced-for-profile="1"]')) return;
            // backup originals (outerHTML)
            window._olah_auth_backup = nodes.map(function(n){ try { return n.outerHTML; } catch(e){ return null; } }).filter(function(x){ return x; });
            // replace them with single profile button inserted in first's parent
            var first = nodes[0];
            var profileBtn = createProfileButtonFrom(first);
            try { first.parentNode.insertBefore(profileBtn, first); } catch(e){}
            // remove all original nodes
            for (var i=0;i<nodes.length;i++){
                try { nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]); } catch(e){}
            }
        } catch (e) { console.error('backupAndReplace error', e); }
    }

    function restoreBackups() {
        try {
            // remove injected profile nodes
            var injected = Array.prototype.slice.call(document.querySelectorAll('[data-replaced-for-profile="1"]'));
            for (var i=0;i<injected.length;i++){
                try { injected[i].parentNode && injected[i].parentNode.removeChild(injected[i]); } catch(e){}
            }
            // re-insert backups if any
            if (window._olah_auth_backup && window._olah_auth_backup.length) {
                for (var j=0;j<window._olah_auth_backup.length;j++){
                    try {
                        var html = window._olah_auth_backup[j];
                        var tmp = document.createElement('div');
                        tmp.innerHTML = html;
                        var el = tmp.firstElementChild;
                        // append to nav if exists, else to body
                        var parent = document.querySelector('nav') || document.querySelector('header') || document.body;
                        if (el && parent) parent.appendChild(el);
                    } catch(e){}
                }
                // re-run setup for sign-up form if inserted
                setTimeout(function(){
                    try { setupSignupFormValidation(); } catch(e){}
                    try { setupContactFormValidation(); } catch(e){}
                }, 120);
            }
            window._olah_auth_backup = [];
        } catch (e) { console.error('restoreBackups error', e); }
    }

    // main exported function
    function updateAuthUI() {
        try {
            var logged = !!getCurrentUserId();
            if (logged) {
                backupAndReplace();
            } else {
                restoreBackups();
            }
            // Make sure only a single profile button exists (cleanup)
            var profileBtns = Array.prototype.slice.call(document.querySelectorAll('button, a'));
            var profileCount = 0;
            for (var k=0;k<profileBtns.length;k++){
                try {
                    if ((profileBtns[k].innerText || '').trim().toLowerCase() === 'profil' || (profileBtns[k].dataset && profileBtns[k].dataset.replacedForProfile === '1')) profileCount++;
                } catch(e){}
            }
            // nothing else to do
        } catch (e) { console.error('updateAuthUI failure', e); }
    }

    // expose
    window.updateAuthUI = updateAuthUI;
    // run on DOMContentLoaded (also called earlier)
    document.addEventListener('DOMContentLoaded', function(){ try { updateAuthUI(); } catch(e){} });
})();

/* -------------------------
   Simple Auth UI replacement (fallback module)
   ------------------------- */
(function authUiReplaceModule() {
  if (!window._auth_original_backups) window._auth_original_backups = [];

  function matchesAuthText(el) {
    if (!el) return false;
    var t = (el.innerText || '').trim().toLowerCase();
    if (!t) {
      t = ((el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'))) || '').trim().toLowerCase();
    }
    if (!t) return false;
    return ['sign up','signup','daftar','register','login','masuk','sign in','signin'].indexOf(t) !== -1;
  }

  function matchesAuthOnclick(el) {
    try {
      var oc = el.getAttribute && el.getAttribute('onclick') || '';
      if (!oc) return false;
      return oc.indexOf("showPage('signup')") !== -1 || oc.indexOf('showPage("signup")') !== -1 ||
             oc.indexOf("showPage('login')") !== -1  || oc.indexOf('showPage("login")') !== -1;
    } catch (e) { return false; }
  }

  function findAuthNodes() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('a,button'));
    var out = [];
    for (var i=0;i<nodes.length;i++){
      try {
        if (matchesAuthText(nodes[i]) || matchesAuthOnclick(nodes[i])) out.push(nodes[i]);
      } catch(e){}
    }
    return out;
  }

  function createProfileButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'py-3 px-6 rounded-lg font-semibold bg-blue-600 text-white';
    btn.innerText = 'Profil';
    btn.dataset.isProfileButton = '1';
    btn.addEventListener('click', function(e){
      e && e.preventDefault && e.preventDefault();
      try { showPage('profile'); } catch(err){}
    });
    return btn;
  }

  function replaceAuthWithProfile() {
    try {
      var cur = null;
      try { cur = localStorage.getItem('olahplastik_current_user'); } catch(e){ cur = null; }
      if (!cur) return;

      if (document.querySelector('[data-is-profile-button="1"]')) return;

      var nodes = findAuthNodes();
      if (!nodes || nodes.length === 0) return;

      window._auth_original_backups = nodes.map(function(n){
        return {
          outerHTML: (n && n.outerHTML) ? n.outerHTML : null,
          parentXPathFallback: null
        };
      }).filter(function(x){ return x.outerHTML; });

      var parent = document.querySelector('nav') || document.querySelector('header') || nodes[0].parentNode || document.body;
      var profileBtn = createProfileButton();
      try { parent.appendChild(profileBtn); } catch(e) { document.body.appendChild(profileBtn); }

      for (var i=0;i<nodes.length;i++){
        try { nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]); } catch(e){}
      }
    } catch (e) {
      console.error('replaceAuthWithProfile error', e);
    }
  }

  function restoreAuthButtons() {
    try {
      var injected = Array.prototype.slice.call(document.querySelectorAll('[data-is-profile-button="1"]'));
      for (var i=0;i<injected.length;i++){
        try { injected[i].parentNode && injected[i].parentNode.removeChild(injected[i]); } catch(e){}
      }

      if (!window._auth_original_backups || window._auth_original_backups.length === 0) return;

      var headerParent = document.querySelector('nav') || document.querySelector('header') || document.body;
      for (var j=0;j<window._auth_original_backups.length;j++){
        try {
          var html = window._auth_original_backups[j].outerHTML;
          if (!html) continue;
          var tmp = document.createElement('div');
          tmp.innerHTML = html;
          var restored = tmp.firstElementChild;
          if (restored && headerParent) headerParent.appendChild(restored);
        } catch(e){}
      }

      window._auth_original_backups = [];
      setTimeout(function(){
        try { setupSignupFormValidation(); } catch(e){}
        try { setupContactFormValidation(); } catch(e){}
      }, 120);
    } catch (e) {
      console.error('restoreAuthButtons error', e);
    }
  }

  function updateAuthUI_Sync() {
    try {
      var logged = false;
      try { logged = !!localStorage.getItem('olahplastik_current_user'); } catch(e) { logged = false; }
      if (logged) replaceAuthWithProfile(); else restoreAuthButtons();
    } catch (e) { console.error('updateAuthUI_Sync failed', e); }
  }

  window.updateAuthUI = updateAuthUI_Sync;
  document.addEventListener('DOMContentLoaded', function(){ try { updateAuthUI_Sync(); } catch(e){} });
  setTimeout(function(){ try { updateAuthUI_Sync(); } catch(e){} }, 600);
})();

/* -------------------------
   Central Profile Dark Mode — single, idempotent module
   ------------------------- */
(function centralProfileDarkModule() {
  var STORAGE_KEY = 'olahplastik_profile_dark';

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }
  function writeStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }

  // authoritative apply/remove routine
  function applyProfileDark(enabled) {
    var app = document.getElementById('app-layout');
    if (app) {
      if (enabled) app.classList.add('profile-dark'); else app.classList.remove('profile-dark');
    }

    try {
      if (enabled) {
        document.body.classList.add('profile-dark-body');
        document.documentElement.classList.add('profile-dark-body');
      } else {
        document.body.classList.remove('profile-dark-body');
        document.documentElement.classList.remove('profile-dark-body');
      }
    } catch (e) { /* ignore */ }

    // clean up/restore any inline style changes previously applied to profile button-like elements
    var profileSelectors = '[data-is-profile-button="1"], [data-profile-btn="1"], [data-replaced-for-profile="1"], [data-olah-profile="1"]';
    Array.prototype.slice.call(document.querySelectorAll(profileSelectors)).forEach(function(el){
      try {
        if (enabled) {
          // remove commonly-conflicting tailwind utility classes so CSS can override
          el.classList.remove('bg-blue-600', 'text-blue-600', 'bg-[#1A56DB]', 'text-white');
          // apply safe inline dark mode style (if necessary)
          el.style.backgroundColor = '#000';
          el.style.color = '#fff';
          el.style.borderColor = '#000';
        } else {
          // remove inline overrides to restore original CSS
          el.style.backgroundColor = '';
          el.style.color = '';
          el.style.borderColor = '';
        }
      } catch (e) {}
    });

    // update toggle label if present
    var t = document.getElementById('profile-dark-toggle');
    if (t) t.innerText = enabled ? 'Light Mode' : 'Dark Mode';
  }

  // create toggle if not present (and place it reliably in profile actions center)
  function ensureToggle() {
    var profilePage = document.getElementById('profile-page');
    if (!profilePage) return null;

    // Remove extra duplicates if any exist (keep first)
    var existingAll = profilePage.querySelectorAll('#profile-dark-toggle');
    if (existingAll && existingAll.length > 1) {
      for (var i=1;i<existingAll.length;i++){
        try { existingAll[i].parentNode.removeChild(existingAll[i]); } catch(e) {}
      }
    }
    var existing = profilePage.querySelector('#profile-dark-toggle');
    if (existing) return existing;

    // build button
    var btn = document.createElement('button');
    btn.id = 'profile-dark-toggle';
    btn.type = 'button';
    btn.className = 'dark-toggle-btn';
    btn.setAttribute('aria-label','Toggle profile dark mode');
    btn.innerText = readStored() ? 'Light Mode' : 'Dark Mode';

    // prefer center column
    var center = document.getElementById('profile-actions-center') || document.querySelector('.center-col') || null;
    if (center) {
      center.appendChild(btn);
    } else {
      // fallback: append near top of profile page
      var header = profilePage.querySelector('.space-y-4') || profilePage.firstElementChild;
      if (header && header.parentNode) header.parentNode.insertBefore(btn, header.nextSibling);
      else profilePage.appendChild(btn);
    }
    return btn;
  }

  // one click handler (idempotent register)
  function setupHandler() {
    // ensure single listener on document (flag-based)
    if (document._olah_profile_dark_listener_installed) return;
    document._olah_profile_dark_listener_installed = true;

    document.addEventListener('click', function(e){
      var btn = (e && e.target) ? e.target.closest && e.target.closest('#profile-dark-toggle') : null;
      if (!btn) return;
      // toggle state
      var now = !readStored();
      writeStored(now);
      applyProfileDark(now);
      // after applying dark toggle, re-normalize button appearances to keep uniformity
      try { normalizeProfileButtons(); } catch (err) {}
    }, false);
  }

  // ensure consistent state on navigation; wrap showPage to remove classes for login/signup
  function wrapShowPage() {
    if (!window.showPage || window._olah_showpage_wrapped) return;
    window._olah_showpage_wrapped = true;
    var original = window.showPage;
    window.showPage = function(pageId) {
      try { original(pageId); } catch (e) {}
      // when showing profile, make sure toggle exists and classes applied from stored state
      if (pageId === 'profile') {
        try {
          ensureToggle();
          applyProfileDark(readStored());
          // also normalize buttons
          try { normalizeProfileButtons(); } catch (err) {}
        } catch (e) {}
      }
      // when showing login or signup, remove body/html classes to avoid overlay contamination
      if (pageId === 'login' || pageId === 'signup') {
        try {
          document.body.classList.remove('profile-dark-body');
          document.documentElement.classList.remove('profile-dark-body');
          var app = document.getElementById('app-layout');
          if (app) app.classList.remove('profile-dark');
        } catch (e) {}
      }
    };
  }

  // init routine (idempotent)
  function init() {
    try {
      ensureToggle();
      applyProfileDark(readStored());
      setupHandler();
      wrapShowPage();
    } catch (e) { console.error('centralProfileDarkModule init error', e); }
  }

  document.addEventListener('DOMContentLoaded', init);
  // fallback attempts for dynamically injected DOM
  setTimeout(init, 250);
  setTimeout(init, 800);

  // expose helper for debugging and other modules
  window._centralProfileDarkApply = applyProfileDark;
})();

/* -------------------------
   Normalize profile buttons
   - Ensure all clickable elements on #profile-page have same shape/size
   - Does NOT change DOM order or event listeners
   - Stores original class string in data-olah-original-class (once)
   ------------------------- */
function normalizeProfileButtons() {
    try {
        var profile = document.getElementById('profile-page');
        if (!profile) return;

        // selector: choose elements that act as buttons inside profile page:
        // - actual BUTTON elements
        // - ANCHOR elements with role=button or data attributes used for profile
        // - elements that have onclick inside profile
        var candidates = Array.prototype.slice.call(profile.querySelectorAll('button, a, [role="button"], [onclick]'));

        // Filter to elements actually inside profile container and visible
        candidates = candidates.filter(function(el) {
            if (!el) return false;
            // ensure element is a descendant of profile
            if (!profile.contains(el)) return false;
            // skip form inputs (we only want control buttons)
            var tag = (el.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea') return false;
            // skip potential links that are part of other components (if they don't look interactive)
            // but keep them if they have click handlers / data attributes indicating profile buttons
            return true;
        });

        if (!candidates || candidates.length === 0) return;

        // Standard style we want to enforce
        var standard = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            minWidth: '160px',
            padding: '10px 18px',
            minHeight: '44px',
            borderRadius: '999px',
            fontWeight: '700',
            fontSize: '15px',
            lineHeight: '1',
            cursor: 'pointer',
            boxSizing: 'border-box'
        };

        // Apply to each candidate. Preserve original class list in dataset once.
        for (var i = 0; i < candidates.length; i++) {
            var el = candidates[i];
            try {
                // only style elements that are visible (offsetParent check) or role/button
                // but still apply if not visible to keep consistency when it appears
                if (!el.dataset.olahOriginalClass) {
                    try { el.dataset.olahOriginalClass = el.className || ''; } catch(e) {}
                }
                // Remove conflicting size utilities (common Tailwind-like classes) conservatively
                try {
                    // remove classes that commonly control padding/width/height/radius/background that could conflict
                    el.classList.remove('py-2','py-3','px-4','px-6','px-5','rounded','rounded-md','rounded-lg','rounded-full','h-10','h-11','w-full','w-40','w-48','bg-blue-600','bg-[#1A56DB]','text-white');
                } catch(e){}

                // apply inline styles according to standard (preserves functionality)
                for (var k in standard) {
                    if (standard.hasOwnProperty(k)) {
                        el.style[k] = standard[k];
                    }
                }

                // ensure focus outlines remain accessible
                el.style.outline = el.style.outline || 'none';
                el.style.transition = el.style.transition || 'transform .12s ease, box-shadow .12s ease, opacity .12s ease';
                // ensure border present if none (keeps button visible on transparent backgrounds)
                if (!el.style.border) el.style.border = el.style.border || '1px solid rgba(0,0,0,0.08)';

                // add data attribute flag so we know this element is normalized
                try { el.dataset.olahNormalized = '1'; } catch(e){}
            } catch (e) {
                console.warn('normalizeProfileButtons: failed to normalize one element', e);
            }
        }
    } catch (e) {
        console.error('normalizeProfileButtons error', e);
    }
}

/* -------------------------
   Generic closeModal helper
   ------------------------- */
function closeModal(modalId) {
    var el = document.getElementById(modalId);
    if (!el) return;
    el.classList.add('hidden');
}

/* -------------------------
   Debug helper
   ------------------------- */
function listUsersForDebug() { console.table(getUsers()); }

/* -------------------------
   Profile UI adjustments & Dark Mode toggle helpers
   ------------------------- */
(function() {
  // Helper: ensure element exists
  function $(id) { return document.getElementById(id); }

  // Move Edit button so it sits below Back button
  function relocateProfileButtons() {
    var backBtn = $('profile-back-home-btn');
    var editBtn = $('profile-edit-btn');
    var actions = $('profile-actions');

    if (!actions || !backBtn || !editBtn) return;

    // Remove editBtn from its current parent and re-append after backBtn
    try {
      if (editBtn.parentNode) editBtn.parentNode.removeChild(editBtn);
      // insert after backBtn
      backBtn.parentNode.insertBefore(editBtn, backBtn.nextSibling);
    } catch (e) {
      // fallback: append to actions
      if (actions && !actions.contains(editBtn)) actions.appendChild(editBtn);
    }
  }

  // Ensure the profile action layout structure exists (left/center/right)
  function ensureProfileActionsLayout() {
    var left = document.getElementById('profile-actions-left');
    var center = document.getElementById('profile-actions-center');
    var right = document.getElementById('profile-actions-right');

    var backBtn = document.getElementById('profile-back-home-btn');
    var editBtn = document.getElementById('profile-edit-btn');
    var signoutBtn = document.getElementById('profile-signout-btn');
    var darkBtn = document.getElementById('profile-dark-toggle');

    if (left && backBtn && backBtn.parentNode !== left) left.appendChild(backBtn);
    if (left && editBtn && editBtn.parentNode !== left) left.appendChild(editBtn);
    if (right && signoutBtn && signoutBtn.parentNode !== right) right.appendChild(signoutBtn);
    if (center && darkBtn && darkBtn.parentNode !== center) center.appendChild(darkBtn);

    // remove any stray label element named 'profile-dark-label' if exists
    var stray = document.getElementById('profile-dark-label');
    if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
  }

  document.addEventListener('DOMContentLoaded', function() {
    try { relocateProfileButtons(); } catch(e){}
    try { ensureProfileActionsLayout(); } catch(e){}
    try { normalizeProfileButtons(); } catch(e){}
  });

  // Also run once immediately (in case DOM already ready)
  try {
    relocateProfileButtons();
    ensureProfileActionsLayout();
    normalizeProfileButtons();
  } catch(e){}
})();

/* -------------------------
   Expose handlers globally so HTML onclick attrs work
   ------------------------- */
window.toggleMobileMenu = toggleMobileMenu;
window.showPage = showPage;
window.scrollToMainServices = scrollToMainServices;
window.handleContactSubmit = handleContactSubmit;
window.handlePickupSubmit = handlePickupSubmit;
window.handleCompanySubmit = handleCompanySubmit;
window.handleEventSubmit = handleEventSubmit;
window.setupSignupFormValidation = setupSignupFormValidation;
window.handleSignupSubmit = handleSignupSubmit;
window.handleLoginSubmit = handleLoginSubmit;
window.validatePickup = validatePickup;
window.validateEventDate = validateEventDate;
window.togglePassword = togglePassword;
window.closeModal = closeModal;
window.listUsersForDebug = listUsersForDebug;
window.signOut = signOut;
window.loadProfile = loadProfile;
window.playNotifSound = playNotifSound;
window.normalizeProfileButtons = normalizeProfileButtons;
