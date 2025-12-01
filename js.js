/* ===========================================
   js.js — Olahplastik (single-file ready-to-use)
   Combines: auth UI replacement, profile dark toggle,
   contact -> Formspree, form validation, profile layout fixes.
   No optional chaining used.
   =========================================== */

/* -------------------------
   Configuration / Constants
   ------------------------- */
var NOTIF_SOUND_SRC = 'assets/Ding.mp3'; // use your sound file path
var USERS_STORAGE_KEY = 'olahplastik_users';
var CURRENT_USER_KEY = 'olahplastik_current_user';
var PROFILE_DARK_KEY = 'olahplastik_profile_dark';
var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mrbnpale';

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
function getCurrentUserId() {
    try { return localStorage.getItem(CURRENT_USER_KEY); } catch (e) { return null; }
}
function setCurrentUserId(id) {
    try { localStorage.setItem(CURRENT_USER_KEY, String(id)); } catch (e) {}
}
function clearCurrentUserId() {
    try { localStorage.removeItem(CURRENT_USER_KEY); } catch (e) {}
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
function getCurrentUser() {
    var id = getCurrentUserId();
    if (!id) return null;
    var users = getUsers();
    for (var i=0;i<users.length;i++){ var u = users[i]; if (u && u.id === id) return u; }
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
    // icons (lucide)
    try { if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons(); } catch(e){}

    // init validations
    try { setupContactFormValidation(); } catch(e){ console.warn(e); }
    try { setupPickupFormValidation(); } catch(e){ console.warn(e); }
    try { setupCompanyFormValidation(); } catch(e){ console.warn(e); }
    try { setupEventFormValidation(); } catch(e){ console.warn(e); }
    try { setupSignupFormValidation(); } catch(e){ console.warn(e); }
    try { initScrollAnimations(); } catch(e){ console.warn(e); }

    // ensure main scroll enabled by default
    var mainScroll = document.getElementById('main-scroll-container');
    if (mainScroll) mainScroll.classList.add('overflow-y-auto');

    // init auth UI replacement & profile actions
    try { updateAuthUI(); } catch(e){ console.warn(e); }
    try { ensureProfileActionsLayout(); } catch(e){}

    // init profile dark toggle (if profile visible)
    try { initProfileDarkToggle(); } catch(e){}

    // bind contact form submit interception if form exists
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactSubmit();
        });
    }
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
        // IntersectionObserver not supported
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
        // remove profile dark when viewing login/signup
        removeProfileDarkClasses();
        return;
    } else if (pageId === 'signup') {
        if (signupContainer) signupContainer.classList.remove('hidden');
        if (footer) footer.classList.add('hidden');
        resetNavAppearance();
        removeProfileDarkClasses();
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
        try { if (window.lucide) window.lucide.createIcons(); } catch(e){}
        initScrollAnimations();
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

    // if profile page shown, init dark toggle and layout
    if (pageId === 'profile') {
        try { initProfileDarkToggle(); } catch(e){}
        try { ensureProfileActionsLayout(); } catch(e){}
    } else {
        // remove floating dark mode when leaving profile
        removeProfileDarkClasses();
    }

    try { if (window.lucide) window.lucide.createIcons(); } catch(e){}
    initScrollAnimations();
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
   Forms: Contact -> Formspree
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
    var nameEl = document.getElementById('contact-name');
    var phoneEl = document.getElementById('contact-phone');
    var emailEl = document.getElementById('contact-email');
    var messageEl = document.getElementById('contact-message');
    var submitBtn = document.getElementById('contact-submit-btn');

    var name = nameEl ? nameEl.value.trim() : '';
    var phone = phoneEl ? phoneEl.value.trim() : '';
    var email = emailEl ? emailEl.value.trim() : '';
    var message = messageEl ? messageEl.value.trim() : '';

    if (!name || !email || !message) {
        var warningEl = document.getElementById('contact-warning');
        if (warningEl) {
            warningEl.innerText = 'Mohon isi Nama, Email, dan Pesan.';
            warningEl.classList.remove('hidden');
        } else {
            alert('Mohon isi Nama, Email, dan Pesan.');
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    var formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('_replyto', email);
    formData.append('_subject', 'Incoming contact from Olahplastik website');

    fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
        mode: 'cors'
    }).then(function(response) {
        if (response.ok) {
            return response.json().catch(function(){ return {}; });
        } else {
            return response.json().then(function(err) { throw err; }).catch(function(){ throw new Error('Gagal mengirim (status ' + response.status + ')'); });
        }
    }).then(function(data) {
        if (nameEl) nameEl.value = '';
        if (phoneEl) phoneEl.value = '';
        if (emailEl) emailEl.value = '';
        if (messageEl) messageEl.value = '';

        var modal = document.getElementById('contact-success-modal');
        if (modal) {
            try {
                var h3 = modal.querySelector('h3');
                var p = modal.querySelector('p');
                if (h3) h3.innerText = 'Pesan Terkirim';
                if (p) p.innerText = 'Terima kasih — pesan Anda telah dikirim.';
            } catch (e) {}
            modal.classList.remove('hidden');
        } else {
            alert('Pesan terkirim. Terima kasih!');
        }
        try { playNotifSound(); } catch(e){}
    }).catch(function(err) {
        console.error('Formspree send error', err);
        var modal = document.getElementById('contact-fail-modal');
        if (modal) {
            try {
                var h3 = modal.querySelector('h3');
                var p = modal.querySelector('p');
                if (h3) h3.innerText = 'Gagal Mengirim';
                if (p) p.innerText = 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi atau hubungi kami langsung.';
            } catch (e) {}
            modal.classList.remove('hidden');
        } else {
            alert('Gagal mengirim pesan. Silakan coba lagi.');
        }
    }).finally(function() {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
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
        return;
    }
    if (selectedDateStr === todayStr && timeSelect && timeSelect.value) {
        var currentHour = now.getHours();
        var slotStartHour = parseInt(timeSelect.value.split(':')[0], 10);
        if (currentHour >= slotStartHour) {
            if (warningText) warningText.innerText = "Jam sudah terlewat";
            if (warningEl) warningEl.classList.remove('hidden');
            return;
        }
    }
    if (warningEl) warningEl.classList.add('hidden');
}
function handlePickupSubmit() {
    var inputs = document.querySelectorAll('#pickup-page input, #pickup-page textarea, #pickup-page select');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    var submitBtn = document.getElementById('pickup-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('pickup-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
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
function handleCompanySubmit() {
    var inputs = document.querySelectorAll('#company-page input, #company-page textarea, #company-page select');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    toggleFrequencyFields();
    var submitBtn = document.getElementById('company-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('company-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
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
    } else {
        if (warningEl) warningEl.classList.add('hidden');
    }
}
function handleEventSubmit() {
    var inputs = document.querySelectorAll('#event-page input, #event-page textarea, #event-page input');
    for (var i=0;i<inputs.length;i++) inputs[i].value = '';
    var submitBtn = document.getElementById('event-submit-btn');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    var modal = document.getElementById('event-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }
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
    setCurrentUserId(newUser.id);
    updateAuthUI();
    loadProfile();

    var modal = document.getElementById('signup-success-modal');
    if (modal) { modal.classList.remove('hidden'); try { playNotifSound(); } catch(e){} }

    var clearFields = [nameEl, emailEl, phoneEl, passEl, passConfirmEl];
    for (var j=0;j<clearFields.length;j++) { if (clearFields[j]) clearFields[j].value = ''; }

    var submitBtn = document.getElementById('signup-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
        submitBtn.classList.remove('hover:bg-[#c4e04e]', 'shadow-lg');
    }

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

    setCurrentUserId(user.id);
    updateAuthUI();
    loadProfile();

    showPage('profile');

    var modal = document.getElementById('contact-success-modal');
    if (modal) {
        try {
            var h3 = modal.querySelector('h3');
            var p = modal.querySelector('p');
            if (h3) h3.innerText = 'Login Berhasil!';
            if (p) p.innerText = 'Selamat datang kembali.';
        } catch (e) {}
        modal.classList.remove('hidden');
        try { playNotifSound(); } catch(e){}
    }
}

/* -------------------------
   Sign-out / session helpers
   ------------------------- */
function signOut() {
    try {
        clearCurrentUserId();
        // restore auth UI
        updateAuthUI();
        // clear profile dark flag when signing out
        try { localStorage.setItem(PROFILE_DARK_KEY, '0'); } catch(e){}
        removeProfileDarkClasses();

        try { playNotifSound(); } catch (e) {}
        // force small reload to avoid leftover injected nodes
        setTimeout(function(){
            try { location.replace(location.pathname + location.search + location.hash); } catch(e){ window.location.reload(); }
        }, 120);
    } catch (e) {
        console.error('signOut error', e);
        try { window.location.reload(); } catch(_e) {}
    }
}

/* -------------------------
   Show/hide password
   ------------------------- */
function togglePassword(inputId, iconId) {
    var input = document.getElementById(inputId);
    var icon = document.getElementById(iconId);
    if (!input) return;
    var isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    if (icon && icon.setAttribute) {
        try { icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye'); } catch(e){}
        try { if (window.lucide) window.lucide.createIcons(); } catch(e){}
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
        // remove color utilities to let CSS control
        try { btn.className = btn.className.replace(/bg-[^\s]+/g, '').replace(/text-[^\s]+/g, '').replace(/border-[^\s]+/g, '').trim(); } catch(e){}
        var extra = ' py-3 px-6 rounded-lg font-semibold profile-btn'; // ensure consistent button class
        btn.className = (btn.className + ' ' + extra + ' bg-blue-600 text-white').trim();
        btn.innerText = 'Profil';
        btn.setAttribute('role','button');
        try { btn.setAttribute('data-is-profile-button', '1'); } catch(e){}
        // ensure dataset marker for CSS targeting
        try { btn.dataset.isProfileButton = '1'; } catch(e){}
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
            // if already injected, skip
            if (document.querySelector('[data-is-profile-button="1"]')) return;

            // backup originals
            window._olah_auth_backup = nodes.map(function(n){ try { return n.outerHTML; } catch(e){ return null; } }).filter(function(x){ return x; });

            // insert profile button into first's parent (or nav)
            var first = nodes[0];
            var parent = first.parentNode || document.querySelector('nav') || document.body;
            var profileBtn = createProfileButtonFrom(first);
            try { parent.appendChild(profileBtn); } catch(e){ document.body.appendChild(profileBtn); }

            // remove originals
            for (var i=0;i<nodes.length;i++){
                try { nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]); } catch(e){}
            }
        } catch (e) { console.error('backupAndReplace error', e); }
    }

    function restoreBackups() {
        try {
            // remove injected profile nodes
            var injected = Array.prototype.slice.call(document.querySelectorAll('[data-is-profile-button="1"]'));
            for (var i=0;i<injected.length;i++){
                try { injected[i].parentNode && injected[i].parentNode.removeChild(injected[i]); } catch(e){}
            }
            // re-insert backups if any
            if (window._olah_auth_backup && window._olah_auth_backup.length) {
                var parent = document.querySelector('nav') || document.querySelector('header') || document.body;
                for (var j=0;j<window._olah_auth_backup.length;j++){
                    try {
                        var html = window._olah_auth_backup[j];
                        var tmp = document.createElement('div');
                        tmp.innerHTML = html;
                        var el = tmp.firstElementChild;
                        if (el && parent) parent.appendChild(el);
                    } catch(e){}
                }
                // re-run form setups
                setTimeout(function(){
                    try { setupSignupFormValidation(); } catch(e){}
                    try { setupContactFormValidation(); } catch(e){}
                }, 120);
            }
            window._olah_auth_backup = [];
        } catch (e) { console.error('restoreBackups error', e); }
    }

    // externally callable
    window.updateAuthUI = function() {
        try {
            var logged = !!getCurrentUserId();
            if (logged) backupAndReplace(); else restoreBackups();
            // ensure profile button visuals match CSS (uniform size)
            normalizeProfileButtonsAppearance();
        } catch (e) { console.error('updateAuthUI failure', e); }
    };

    // run on DOMContentLoaded as well
    document.addEventListener('DOMContentLoaded', function(){ try { window.updateAuthUI(); } catch(e){} });
})();

/* helper: make all profile buttons share same base classes */
function normalizeProfileButtonsAppearance() {
    try {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-is-profile-button="1"], [data-profile-btn="1"], [data-olah-profile="1"]'));
        for (var i=0;i<els.length;i++){
            var btn = els[i];
            if (!btn) continue;
            // remove inline BG classes that may conflict
            try { btn.classList.remove('bg-blue-600','text-blue-600','bg-[#1A56DB]'); } catch(e){}
            // ensure it has profile-btn class which CSS already styles to consistent size
            if (btn.classList && btn.classList.indexOf('profile-btn') === -1) {
                try { btn.classList.add('profile-btn'); } catch(e){}
            }
            // set data attr for CSS selectors
            try { btn.setAttribute('data-is-profile-button','1'); } catch(e){}
        }
    } catch (e) { console.warn(e); }
}

/* -------------------------
   Profile dark mode module
   - toggles .profile-dark on #app-layout
   - toggles .profile-dark-body on <body> and <html>
   - persists setting to localStorage
   ------------------------- */
function readStoredProfileDark() {
    try { return localStorage.getItem(PROFILE_DARK_KEY) === '1'; } catch (e) { return false; }
}
function writeStoredProfileDark(v) {
    try { localStorage.setItem(PROFILE_DARK_KEY, v ? '1' : '0'); } catch (e) {}
}
function applyProfileDarkClasses(enabled) {
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
    } catch (e) {}
    // ensure profile buttons styled correctly when dark toggled
    normalizeProfileButtonsAppearance();
    if (enabled) applyDarkModeFixes(); else removeDarkModeFixes();
}
function applyDarkModeFixes() {
    try {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-is-profile-button="1"], [data-profile-btn="1"], [data-olah-profile="1"], .profile-btn'));
        for (var i=0;i<els.length;i++){
            var btn = els[i];
            if (!btn) continue;
            try {
                // remove tailwind color classes that often override CSS
                btn.classList.remove('bg-blue-600','text-white','text-blue-600');
            } catch(e){}
            // apply inline safe styles for dark mode (ensures visible)
            try {
                btn.style.backgroundColor = '#000';
                btn.style.color = '#fff';
                btn.style.borderColor = '#000';
            } catch(e){}
        }
    } catch (e) {}
}
function removeDarkModeFixes() {
    try {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-is-profile-button="1"], [data-profile-btn="1"], [data-olah-profile="1"], .profile-btn'));
        for (var i=0;i<els.length;i++){
            try {
                els[i].style.backgroundColor = '';
                els[i].style.color = '';
                els[i].style.borderColor = '';
            } catch(e){}
        }
    } catch (e) {}
}
function removeProfileDarkClasses() {
    var app = document.getElementById('app-layout');
    if (app) app.classList.remove('profile-dark');
    try {
        document.body.classList.remove('profile-dark-body');
        document.documentElement.classList.remove('profile-dark-body');
    } catch (e) {}
    removeDarkModeFixes();
}

/* Init toggle button inside profile page (creates if missing, wires state) */
function initProfileDarkToggle() {
    try {
        var profilePage = document.getElementById('profile-page');
        if (!profilePage) return;

        // if toggle already exists, ensure label/state matches stored
        var existing = profilePage.querySelector('#profile-dark-toggle');
        var stored = readStoredProfileDark();

        if (!existing) {
            // create toggle markup consistent with your HTML structure
            var btn = document.createElement('button');
            btn.id = 'profile-dark-toggle';
            btn.type = 'button';
            btn.className = 'dark-toggle-btn profile-btn'; // CSS in your file sets sizes
            btn.innerText = stored ? 'Light Mode' : 'Dark Mode';
            // prefer insertion into designated center area if present
            var center = document.getElementById('profile-actions-center');
            if (center) {
                center.appendChild(btn);
            } else {
                // fallback: insert top-right of profile content
                var insertBefore = profilePage.querySelector('.space-y-4') || profilePage.firstElementChild;
                var wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.justifyContent = 'flex-end';
                wrapper.style.width = '100%';
                wrapper.style.paddingBottom = '8px';
                wrapper.appendChild(btn);
                if (insertBefore && insertBefore.parentNode) insertBefore.parentNode.insertBefore(wrapper, insertBefore);
                else profilePage.insertBefore(wrapper, profilePage.firstChild);
            }

            btn.addEventListener('click', function() {
                var now = !readStoredProfileDark();
                writeStoredProfileDark(now);
                applyProfileDarkClasses(now);
                try { btn.innerText = now ? 'Light Mode' : 'Dark Mode'; } catch(e){}
            });

            // ensure buttons uniform
            normalizeProfileButtonsAppearance();
        } else {
            // update text to match stored
            existing.innerText = stored ? 'Light Mode' : 'Dark Mode';
        }

        // apply saved state
        applyProfileDarkClasses(stored);
    } catch (e) {
        console.warn('initProfileDarkToggle error', e);
    }
}

/* -------------------------
   Profile actions layout helpers
   - ensure buttons inserted into correct columns,
   - make all profile-page buttons same shape/size without altering functionality
   ------------------------- */
function ensureProfileActionsLayout() {
    var left = document.getElementById('profile-actions-left');
    var center = document.getElementById('profile-actions-center');
    var right = document.getElementById('profile-actions-right');

    var backBtn = document.getElementById('profile-back-home-btn');
    var editBtn = document.getElementById('profile-edit-btn');
    var signoutBtn = document.getElementById('profile-signout-btn');
    var darkBtn = document.getElementById('profile-dark-toggle');

    // ensure columns exist (if markup present)
    if (left && backBtn && backBtn.parentNode !== left) left.appendChild(backBtn);
    if (left && editBtn && editBtn.parentNode !== left) left.appendChild(editBtn);
    if (right && signoutBtn && signoutBtn.parentNode !== right) right.appendChild(signoutBtn);
    if (center && darkBtn && darkBtn.parentNode !== center) center.appendChild(darkBtn);

    // Normalise all profile action buttons to have same class set
    var selector = '#profile-actions button, #profile-actions a, .profile-btn';
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    for (var i=0;i<nodes.length;i++){
        var n = nodes[i];
        if (!n) continue;
        try {
            // ensure base class
            if (n.classList && n.classList.indexOf('profile-btn') === -1) n.classList.add('profile-btn');
            // remove conflicting tiny modifiers potentially added inline
            n.classList.remove('px-8', 'px-6', 'py-2', 'py-3');
            // enforce minimal consistent inline style if needed (but prefer CSS)
            n.style.minWidth = '140px';
            n.style.height = '44px';
            n.style.display = 'inline-flex';
            n.style.alignItems = 'center';
            n.style.justifyContent = 'center';
            n.style.gap = '8px';
            n.style.borderRadius = '999px';
        } catch (e) {}
    }
}

/* -------------------------
   Utility: close modal
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
window.ensureProfileActionsLayout = ensureProfileActionsLayout;
window.initProfileDarkToggle = initProfileDarkToggle;
