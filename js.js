// Initialize Lucide Icons
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            setupContactFormValidation();
            setupPickupFormValidation();
            setupCompanyFormValidation();
            setupEventFormValidation();
            initScrollAnimations();
            // Observe scroll for animation reset
            const mainScroll = document.getElementById('main-scroll-container');
            if (mainScroll) {
                mainScroll.addEventListener('scroll', () => {
                    // Trigger animation check on scroll if needed
                });
            }
        });
        // --- SCROLL ANIMATION LOGIC ---
        const observerOptions = {
            root: document.getElementById('main-scroll-container'),
            threshold: 0.1
        };
        function initScrollAnimations() {
            const scrollContainer = document.getElementById('main-scroll-container');
            if (!scrollContainer) return;
                const observerOptions = {
                root: scrollContainer,
                threshold: 0.12
                };
            const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                el.classList.add('pop-up-visible');
                el.classList.remove('pop-up-hidden-down', 'pop-up-hidden-up');
            } else {
                const containerRect = scrollContainer.getBoundingClientRect();
                const elRect = entry.boundingClientRect;
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
        let activePage = scrollContainer.querySelector(':scope > div:not(.hidden)');
        if (!activePage) {
            activePage = scrollContainer.querySelector('.fade-in:not(.hidden)') || scrollContainer;
            }
        const elements = activePage.querySelectorAll('.pop-up-element');
            elements.forEach(el => {
                el.classList.remove('pop-up-visible', 'pop-up-hidden-up');
                el.classList.add('pop-up-hidden-down');
                    observer.observe(el);
                });
        const containerRect = scrollContainer.getBoundingClientRect();
            elements.forEach(el => {
                const r = el.getBoundingClientRect();
                const verticallyVisible = (r.top < containerRect.bottom) && (r.bottom > containerRect.top);
                if (verticallyVisible) {
                    el.classList.add('pop-up-visible');
                    el.classList.remove('pop-up-hidden-down', 'pop-up-hidden-up');
                    }
            });
        }
        function setupContactFormValidation() {
            const inputIds = ['contact-name', 'contact-phone', 'contact-email', 'contact-message'];
            const submitBtn = document.getElementById('contact-submit-btn');
            if (!submitBtn) return;
            const checkValidity = () => {
                const allFilled = inputIds.every(id => {
                    const el = document.getElementById(id);
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
            inputIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', checkValidity);
                }
            });
            checkValidity();
        }
        function handleContactSubmit() {
            const contactPage = document.getElementById('contact-page');
            const inputs = contactPage.querySelectorAll('input, textarea');            
            inputs.forEach(input => {
                input.value = '';
                if (input.tagName.toLowerCase() === 'textarea') {
                    input.style.height = '';
                }
            });            
            const submitBtn = document.getElementById('contact-submit-btn');
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
            }
            const modal = document.getElementById('contact-success-modal');
            modal.classList.remove('hidden');
            lucide.createIcons();
        }
        function closeContactModal() {
            const modal = document.getElementById('contact-success-modal');
            modal.classList.add('hidden');
        }
        // --- MOBILE MENU LOGIC ---
        function toggleMobileMenu() {
            const overlay = document.getElementById('mobile-menu-overlay');
            const sidebar = document.getElementById('mobile-menu-sidebar');           
            if (sidebar.classList.contains('translate-x-full')) {
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    overlay.classList.remove('opacity-0');
                    sidebar.classList.remove('translate-x-full');
                }, 10);
            } else {
                overlay.classList.add('opacity-0');
                sidebar.classList.add('translate-x-full');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
        }
        // --- PAGE NAVIGATION LOGIC ---
        function showPage(pageId) {
    const appLayout = document.getElementById('app-layout');
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');
    // Reset views
    appLayout.classList.add('hidden');
    loginContainer.classList.add('hidden');
    signupContainer.classList.add('hidden');
    if (pageId === 'login') {
        loginContainer.classList.remove('hidden');
        // Reset nav appearance when showing login
        resetNavAppearance();
        return;
    } else if (pageId === 'signup') {
        signupContainer.classList.remove('hidden');
        resetNavAppearance();
        return;
    } else {
        appLayout.classList.remove('hidden');
    }
    const pages = ['home', 'services', 'solutions', 'contact', 'all-about', 'pickup', 'dropoff', 'company', 'event'];
    const mainContainer = document.querySelector('main');
    const mainScroll = document.getElementById('main-scroll-container');
    // Hide all pages
    pages.forEach(page => {
        const el = document.getElementById(page + '-page');
        if (el) el.classList.add('hidden');
    });
    // Always reset nav links first
    resetNavAppearance();
    // Logic for specific pages
    if (['all-about', 'pickup', 'dropoff', 'company', 'event', 'services', 'solutions'].includes(pageId)) {
        mainScroll.classList.add('overflow-y-auto');
        mainScroll.classList.remove('overflow-hidden');
        if (pageId === 'services' || pageId === 'solutions') {
            mainScroll.classList.add('justify-center');
        } else {
            mainScroll.classList.remove('justify-center');
            mainScroll.scrollTop = 0;
        }
        // Highlight Active Menu
        if (pageId === 'all-about') {
            setNavActive('about');
        } else if (['pickup', 'dropoff', 'company', 'event'].includes(pageId)) {
            setNavActive('services');
        } else if (pageId === 'services') {
            setNavActive('services');
        } else if (pageId === 'solutions') {
            setNavActive('solutions');
        }
    } else if (pageId === 'contact') {
        mainScroll.classList.remove('overflow-y-auto');
        mainScroll.classList.add('overflow-hidden');
        mainScroll.classList.remove('justify-center');
        mainScroll.classList.remove('mask-vertical');
        // Active Nav Style for Contact
        setNavActive('contact');
    } else {
        // Home
        mainScroll.classList.add('overflow-y-auto');
        mainScroll.classList.remove('overflow-hidden');
        mainScroll.classList.remove('justify-center');
        mainScroll.scrollTop = 0;
        mainScroll.classList.add('mask-vertical');
    }
    const activePage = document.getElementById(pageId + '-page');
    if (activePage) activePage.classList.remove('hidden');

    lucide.createIcons();
    initScrollAnimations();
}
function resetNavAppearance() {
    const navLinks = {
        about: document.getElementById('nav-about'),
        services: document.getElementById('nav-services'),
        solutions: document.getElementById('nav-solutions'),
        contact: document.getElementById('nav-contact')
    };
    Object.values(navLinks).forEach(nav => {
        if (nav) {
            nav.classList.remove('font-bold', 'text-black');
            nav.classList.add('text-gray-600');
        }
    });
}
function setNavActive(key) {
    const mapping = {
        about: document.getElementById('nav-about'),
        services: document.getElementById('nav-services'),
        solutions: document.getElementById('nav-solutions'),
        contact: document.getElementById('nav-contact')
    };
    const el = mapping[key];
    if (el) {
        el.classList.remove('text-gray-600');
        el.classList.add('font-bold', 'text-black');
    }
}
        function scrollToMainServices() {
    const container = document.getElementById('main-scroll-container');
    const servicesSection = document.getElementById('main-services-section');
    if (!container || !servicesSection) return;
    const offset = 80;
    const containerRect = container.getBoundingClientRect();
    const targetRect = servicesSection.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top;
    let targetScrollTop = container.scrollTop + relativeTop - offset;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;
    const duration = 550;
    const start = container.scrollTop;
    const change = targetScrollTop - start;
    const startTime = performance.now();
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(t);
        container.scrollTop = start + change * eased;
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            container.scrollTop = targetScrollTop;
        }
    }
    requestAnimationFrame(animate);
}
        function handlePickupCancel() {
            const nameInput = document.getElementById('pickup-name');
            const phoneInput = document.getElementById('pickup-phone');
            const addressInput = document.getElementById('pickup-address');
            const dateInput = document.getElementById('pickup-date');
            const timeInput = document.getElementById('pickup-time');
            const warningEl = document.getElementById('pickup-date-warning');
            const hasData = nameInput.value || phoneInput.value || addressInput.value || dateInput.value || timeInput.value;
            if (hasData) {
                nameInput.value = '';
                phoneInput.value = '';
                addressInput.value = '';
                dateInput.value = '';
                timeInput.value = ''; 
                if (warningEl) warningEl.classList.add('hidden');
            } else {
                showPage('home');
            }
        }
        function validatePickup() {
            const dateInput = document.getElementById('pickup-date');
            const timeSelect = document.getElementById('pickup-time');
            const warningEl = document.getElementById('pickup-date-warning');
            const warningText = document.getElementById('pickup-warning-text');            
            const selectedDateStr = dateInput.value;
            const selectedTimeStr = timeSelect.value;           
            if (!selectedDateStr) {
                warningEl.classList.add('hidden');
                return;
            }
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            if (selectedDateStr < todayStr) {
                warningText.innerText = "Tanggal tidak valid";
                warningEl.classList.remove('hidden');
                lucide.createIcons();
                return;
            }
            if (selectedDateStr === todayStr && selectedTimeStr) {
                const currentHour = now.getHours();
                const slotStartHour = parseInt(selectedTimeStr.split(':')[0]);
                if (currentHour >= slotStartHour) {
                    warningText.innerText = "Jam sudah terlewat";
                    warningEl.classList.remove('hidden');
                    lucide.createIcons();
                    return;
                }
            }
            warningEl.classList.add('hidden');
        }
        function handleCompanyCancel() {
            const nameInput = document.getElementById('company-name');
            const emailInput = document.getElementById('company-email'); 
            const addressInput = document.getElementById('company-address');
            const frequencySelect = document.getElementById('company-frequency');
            const daySelect = document.getElementById('company-day');
            const monthDaySelect = document.getElementById('company-month-day');
            const monthWeekSelect = document.getElementById('company-month-week');
            const hasData = nameInput.value || emailInput.value || addressInput.value || frequencySelect.value || 
                            daySelect.value || monthDaySelect.value || monthWeekSelect.value;
            if (hasData) {
                nameInput.value = '';
                emailInput.value = ''; 
                addressInput.value = '';
                frequencySelect.value = '';
                daySelect.value = '';
                monthDaySelect.value = '';
                monthWeekSelect.value = '';
                toggleFrequencyFields();
            } else {
                showPage('home');
            }
        }
        function toggleFrequencyFields() {
            const frequency = document.getElementById('company-frequency').value;
            const weeklyField = document.getElementById('field-weekly');
            const monthlyField = document.getElementById('field-monthly');

            weeklyField.classList.add('hidden');
            monthlyField.classList.add('hidden');

            if (frequency === 'mingguan') {
                weeklyField.classList.remove('hidden');
            } else if (frequency === 'bulanan') {
                monthlyField.classList.remove('hidden');
            }
        }
        function handleEventCancel() {
            const nameInput = document.getElementById('event-name');
            const organizerInput = document.getElementById('event-organizer');
            const emailInput = document.getElementById('event-email');
            const locationInput = document.getElementById('event-location');
            const dateInput = document.getElementById('event-date');
            const timeSelect = document.getElementById('event-time');
            const warningEl = document.getElementById('event-date-warning');
            const hasData = nameInput.value || organizerInput.value || emailInput.value || 
                            locationInput.value || dateInput.value || timeSelect.value;
            if (hasData) {
                nameInput.value = '';
                organizerInput.value = '';
                emailInput.value = '';
                locationInput.value = '';
                dateInput.value = '';
                timeSelect.value = '';
                if(warningEl) warningEl.classList.add('hidden');
            } else {
                showPage('home');
            }
        }
        function validateEventDate() {
            const dateInput = document.getElementById('event-date');
            const warningEl = document.getElementById('event-date-warning');
            if (!dateInput.value) {
                warningEl.classList.add('hidden');
                return;
            }
            const selectedDate = new Date(dateInput.value);
            const today = new Date();
            selectedDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffTime = selectedDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 3) {
                warningEl.classList.remove('hidden');
                lucide.createIcons();
            } else {
                warningEl.classList.add('hidden');
            }
        }
        // Close Modal Generic Function
        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }
        // Setup Validations for All Forms
        function setupPickupFormValidation() {
            const inputIds = ['pickup-name', 'pickup-phone', 'pickup-address', 'pickup-date', 'pickup-time'];
            const submitBtn = document.getElementById('pickup-submit-btn');
            if(!submitBtn) return;
            const checkValidity = () => {
                const allFilled = inputIds.every(id => {
                    const el = document.getElementById(id);
                    return el && el.value.trim() !== '';
                });
                const dateInput = document.getElementById('pickup-date');
                const timeInput = document.getElementById('pickup-time');
                const warningEl = document.getElementById('pickup-date-warning');
                let logicalValid = true;
                if(dateInput.value && !warningEl.classList.contains('hidden')) {
                     logicalValid = false;
                }
                const isValid = allFilled && logicalValid;
                submitBtn.disabled = !isValid;
                if (isValid) {
                    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg');
                } else {
                    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
                }
            };
            inputIds.forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    el.addEventListener('input', checkValidity);
                    el.addEventListener('change', checkValidity);
                }
            });
        }
        function handlePickupSubmit() {
            const inputs = document.querySelectorAll('#pickup-page input, #pickup-page textarea, #pickup-page select');
            inputs.forEach(input => input.value = '');
            const submitBtn = document.getElementById('pickup-submit-btn');
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            document.getElementById('pickup-success-modal').classList.remove('hidden');
            lucide.createIcons();
        }
        function setupCompanyFormValidation() {
             const inputIds = ['company-name', 'company-email', 'company-address', 'company-frequency'];
             const submitBtn = document.getElementById('company-submit-btn');
             if(!submitBtn) return;
             const checkValidity = () => {
                 let allFilled = inputIds.every(id => {
                     const el = document.getElementById(id);
                     return el && el.value.trim() !== '';
                 });                
                 const freq = document.getElementById('company-frequency').value;
                 if (freq === 'mingguan') {
                     const day = document.getElementById('company-day');
                     if(!day.value) allFilled = false;
                 } else if (freq === 'bulanan') {
                     const mDay = document.getElementById('company-month-day');
                     const mWeek = document.getElementById('company-month-week');
                     if(!mDay.value || !mWeek.value) allFilled = false;
                 }
                 submitBtn.disabled = !allFilled;
                 if (allFilled) {
                     submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                     submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg');
                 } else {
                     submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                     submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
                 }
             };
             const allInputs = [...inputIds, 'company-day', 'company-month-day', 'company-month-week'];
             allInputs.forEach(id => {
                 const el = document.getElementById(id);
                 if(el) {
                     el.addEventListener('input', checkValidity);
                     el.addEventListener('change', checkValidity);
                 }
             });
        }
        function handleCompanySubmit() {
             const inputs = document.querySelectorAll('#company-page input, #company-page textarea, #company-page select');
             inputs.forEach(input => input.value = '');
             toggleFrequencyFields(); 
             const submitBtn = document.getElementById('company-submit-btn');
             if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
             }
             document.getElementById('company-success-modal').classList.remove('hidden');
             lucide.createIcons();
        }
        function setupEventFormValidation() {
            const inputIds = ['event-name', 'event-organizer', 'event-email', 'event-location', 'event-date', 'event-time'];
            const submitBtn = document.getElementById('event-submit-btn');
            if(!submitBtn) return;
            const checkValidity = () => {
                const allFilled = inputIds.every(id => {
                    const el = document.getElementById(id);
                    return el && el.value.trim() !== '';
                });
                let logicalValid = true;
                const warningEl = document.getElementById('event-date-warning');
                const dateInput = document.getElementById('event-date');  
                if(dateInput.value && !warningEl.classList.contains('hidden')) {
                    logicalValid = false;
                }
                const isValid = allFilled && logicalValid;
                submitBtn.disabled = !isValid;
                if (isValid) {
                    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    submitBtn.classList.add('hover:bg-blue-50', 'shadow-lg');
                } else {
                    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    submitBtn.classList.remove('hover:bg-blue-50', 'shadow-lg');
                }
            };
            inputIds.forEach(id => {
                 const el = document.getElementById(id);
                 if(el) {
                     el.addEventListener('input', checkValidity);
                     el.addEventListener('change', checkValidity);
                 }
            });
        }
        function handleEventSubmit() {
             const inputs = document.querySelectorAll('#event-page input, #event-page textarea, #event-page input');
             inputs.forEach(input => input.value = '');
             
             const submitBtn = document.getElementById('event-submit-btn');
             if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
             }

             document.getElementById('event-success-modal').classList.remove('hidden');
             lucide.createIcons();
        }
        // Default state
        const mainScroll = document.getElementById('main-scroll-container');
        if (mainScroll) {
            mainScroll.classList.add('overflow-y-auto');
        }
(function enableSmoothWheelScroll() {
    if ('ontouchstart' in window) return;
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const config = {
        damping: 0.14,
        maxDeltaPerWheel: 2000,
        stopThreshold: 0.5
    };
    let target = container.scrollTop;
    let current = container.scrollTop;
    let ticking = false;
    function normalizeWheelDelta(e) {
        return e.deltaY;
    }
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
        const delta = normalizeWheelDelta(e);
        target += delta;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (target < 0) target = 0;
        if (target > maxScroll) target = maxScroll;
        if (!ticking) requestAnimationFrame(rafLoop);
    }
    container.addEventListener('wheel', onWheel, { passive: false, capture: false });
    container.addEventListener('scroll', () => {
        if (!ticking) {
            target = container.scrollTop;
            current = container.scrollTop;
        }
    }, { passive: true });
})();