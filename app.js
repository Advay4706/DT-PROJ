document.addEventListener('DOMContentLoaded', () => {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // force scroll check on load
    if (window.scrollY > 20) navbar.classList.add('scrolled');
  }

  // Hamburger menu toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Set active nav link based on current URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });

  // Login Tabs logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.auth-form');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        forms.forEach(f => f.classList.add('hidden'));
        const target = document.getElementById(btn.dataset.target);
        if(target) target.classList.remove('hidden');
      });
    });
  }

  // ===================== QR / ATTENDANCE LOGIC =====================
  const confirmBtn = document.getElementById('btnScanQR');
  const qrWrap = document.getElementById('qrWrap');
  const confirmedState = document.getElementById('attendanceConfirmed');

  if (confirmBtn && qrWrap && confirmedState) {
    confirmBtn.addEventListener('click', () => {
      confirmBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Verifying...';
      
      setTimeout(() => {
        qrWrap.style.display = 'none';
        confirmedState.style.display = 'block';
        confirmBtn.style.display = 'none';
        const dlBtn = document.querySelector('.btn-download-qr');
        if(dlBtn) dlBtn.style.display = 'none';
      }, 1500);
    });
  }

  // ===================== SEARCH & FILTER LOGIC =====================
  const searchInput = document.getElementById('eventsSearchInput');
  const catCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
  
  function applyFilters() {
    const eventCards = document.querySelectorAll('.events-grid .event-card');
    if (!eventCards.length) return;
    
    // Get active search query
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Get active categories based on checked inputs
    // We assume the label text is the category, or value. 
    // In our HTML, we'll map the categories by checking the label text.
    let activeCategories = [];
    if(catCheckboxes.length > 0) {
      catCheckboxes.forEach(cb => {
        if(cb.checked) {
          const label = cb.parentElement.textContent.trim().toLowerCase();
          // Map label names to card badge classes or datasets
          activeCategories.push(label.replace('s', '')); // 'hackathons' -> 'hackathon'
        }
      });
    }

    let count = 0;
    eventCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const matchesSearch = text.includes(query);
      
      // Determine card category by looking at its badge class
      const badge = card.querySelector('.card-badge');
      let cardCat = '';
      if(badge) {
        if(badge.classList.contains('hackathon')) cardCat = 'hackathon';
        if(badge.classList.contains('workshop')) cardCat = 'workshop';
        if(badge.classList.contains('seminar')) cardCat = 'seminar';
        if(badge.classList.contains('lecture')) cardCat = 'guest lecture'; // or 'lecture'
      }
      
      let matchesCategory = true; // default true if no checkboxes present
      if(catCheckboxes.length > 0) {
        // Find if the cardCat matches any active category string
        matchesCategory = activeCategories.some(cat => cardCat.includes(cat) || cat.includes(cardCat));
        // If no categories selected, maybe hide all or show all? We will hide all if nothing is checked
        if(activeCategories.length === 0) matchesCategory = false;
      }

      if (matchesSearch && matchesCategory) {
        card.style.display = 'block';
        count++;
      } else {
        card.style.display = 'none';
      }
    });
    
    const countLabel = document.querySelector('.events-count');
    if (countLabel) {
      countLabel.textContent = `Showing ${count} events`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', applyFilters);
  }
  
  if (catCheckboxes) {
    catCheckboxes.forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });
  }

  const heroSearchInput = document.getElementById('heroSearch');
  if (heroSearchInput) {
    heroSearchInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') {
        window.location.href = `events.html?q=${heroSearchInput.value}`;
      }
    });
  }

  // Pick up search param on load if came from hero
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q && searchInput) {
    searchInput.value = q;
    // Trigger the search manually
    searchInput.dispatchEvent(new Event('keyup'));
  }

  // ===================== SAVE / BOOKMARK LOGIC =====================
  let savedEvents = [];
  try {
    const raw = localStorage.getItem('campusSavedEvents');
    if (raw) savedEvents = JSON.parse(raw) || [];
  } catch (err) {
    savedEvents = [];
    localStorage.removeItem('campusSavedEvents');
  }
  
  // Helper to re-render dashboard list if we're on the dashboard
  function renderDashboardBookmarks() {
    const list = document.getElementById('savedEventsList');
    if (!list) return;
    
    if (savedEvents.length === 0) {
      list.innerHTML = `<p style="font-size: .85rem; color: var(--text-muted); padding: 12px;">You haven't saved any events yet. Explore events and click the bookmark icon!</p>`;
      return;
    }
    
    list.innerHTML = '';
    savedEvents.forEach(evt => {
      const el = document.createElement('div');
      el.className = 'reg-event-item';
      el.innerHTML = `
        <div class="reg-event-color bg-warning" style="background:#06b6d4;"></div>
        <div class="reg-event-info">
          <div class="reg-event-title">${evt.title}</div>
          <div class="reg-event-meta">${evt.meta}</div>
        </div>
        <div class="reg-event-actions">
          <button class="btn-qr" onclick="window.location.href='event-detail.html'">View Details</button>
        </div>
      `;
      list.appendChild(el);
    });
  }

  // Initial render if on dashboard
  renderDashboardBookmarks();

  const saveBtns = document.querySelectorAll('.card-save');
  saveBtns.forEach(btn => {
    // We need context from the card structure to save details
    const cardEl = btn.closest('.event-card');
    let title = 'Saved Event';
    let meta = 'Details TBD';
    let id = Math.random().toString(36).substr(2, 9);
    
    if (cardEl) {
      const titleEl = cardEl.querySelector('.event-card-title');
      if (titleEl) {
        title = titleEl.textContent.trim();
        id = title.replace(/\s+/g, '-').toLowerCase(); // poor man's ID based on title
      }
      const metaEl = cardEl.querySelector('.event-meta');
      if (metaEl) meta = metaEl.textContent.trim();
    }
    
    // Check if already saved on load
    if (savedEvents.some(e => e.id === id)) {
      btn.classList.add('saved');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card click redirect
      btn.classList.toggle('saved');
      
      const isSaved = btn.classList.contains('saved');
      
      if (isSaved) {
        savedEvents.push({ id, title, meta });
        localStorage.setItem('campusSavedEvents', JSON.stringify(savedEvents));
        showToast('Event saved to your bookmarks!', 'success');
      } else {
        savedEvents = savedEvents.filter(e => e.id !== id);
        localStorage.setItem('campusSavedEvents', JSON.stringify(savedEvents));
        showToast('Event removed from bookmarks.', 'info');
      }
      
      // Update DOM if on dashboard (rare edge case since you'd be saving from events page)
      renderDashboardBookmarks();
    });
  });

  // ===================== TOAST NOTIFICATION SYS =====================
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? '#10b981' : '#2563eb'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===================== EVENT DETAIL ACTIONS & GLOBAL REGISTER =====================
  let registeredEvents = [];
  try {
    const raw = localStorage.getItem('campusRegisteredEvents');
    if (raw) registeredEvents = JSON.parse(raw) || [];
  } catch (err) {
    registeredEvents = [];
    localStorage.removeItem('campusRegisteredEvents');
  }

  function renderDashboardRegistered() {
    const list = document.getElementById('registeredEventsList');
    if (!list) return;
    
    if (registeredEvents.length === 0) {
      list.innerHTML = `<p style="font-size: .85rem; color: var(--text-muted); padding: 12px;">You haven't registered for any events yet.</p>`;
      return;
    }
    
    list.innerHTML = '';
    registeredEvents.forEach(evt => {
      const el = document.createElement('div');
      el.className = 'reg-event-item';
      el.innerHTML = `
        <div class="reg-event-color bg-primary" style="background:#2563eb;"></div>
        <div class="reg-event-info">
          <div class="reg-event-title">${evt.title}</div>
          <div class="reg-event-meta">${evt.meta}</div>
        </div>
        <div class="reg-event-actions">
          <span class="reg-event-status status-upcoming">Upcoming</span>
          <button class="btn-qr" onclick="window.location.href='attendance.html'">View QR</button>
        </div>
      `;
      list.appendChild(el);
    });
  }

  renderDashboardRegistered();

  // Attach dynamic registration to all inline .btn-register buttons
  const globalRegisterBtns = document.querySelectorAll('.btn-register');
  globalRegisterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const cardEl = btn.closest('.event-card') || btn.closest('.featured-card');
      let title = 'Campus Event';
      let meta = 'Details TBD';
      
      if (cardEl) {
        const titleEl = cardEl.querySelector('.event-card-title') || cardEl.querySelector('h3');
        if (titleEl) title = titleEl.textContent.trim();
        const metaEl = cardEl.querySelector('.event-meta');
        if (metaEl) meta = metaEl.textContent.trim();
      }
      
      const id = title.replace(/\s+/g, '-').toLowerCase();
      if (!registeredEvents.some(r => r.id === id)) {
        registeredEvents.push({ id, title, meta });
        localStorage.setItem('campusRegisteredEvents', JSON.stringify(registeredEvents));
      }
      
      alert("Registered successfully!");
      showToast('Successfully registered for ' + title, 'success');
    });
  });

  const btnRegister = document.getElementById('btnRegisterEvent');
  const registerModal = document.getElementById('registerModal');
  
  if (btnRegister && registerModal) {
    btnRegister.addEventListener('click', () => {
      // Add fake big event to dashboard array
      const titleEl = document.querySelector('.event-detail-title');
      const title = titleEl ? titleEl.textContent : 'Event';
      const id = title.replace(/\s+/g, '-').toLowerCase();
      
      if (!registeredEvents.some(r => r.id === id)) {
        registeredEvents.push({ id, title, meta: 'Upcoming · View Details' });
        localStorage.setItem('campusRegisteredEvents', JSON.stringify(registeredEvents));
      }

      registerModal.classList.add('active');
      alert("Registered successfully!");
    });
    
    // Close modal if clicking outside
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        registerModal.classList.remove('active');
      }
    });
  }

  const btnCalendar = document.getElementById('btnCalendarEvent');
  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => {
      btnCalendar.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Added to Calendar';
      btnCalendar.style.background = 'var(--primary-xs)';
      btnCalendar.style.borderColor = 'var(--primary)';
      showToast('Reminder set! Event added to your calendar.', 'success');
    });
  }

});
