document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const pages = {
        home: document.getElementById('page-home'),
        calendar: document.getElementById('page-calendar'),
        create: document.getElementById('page-create')
    };
    const navItems = document.querySelectorAll('.nav-item');
    const toastContainer = document.getElementById('toast-container');
    const categoryPills = document.querySelectorAll('.pill');

    // New Interactive Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const homeTabs = document.querySelectorAll('.tab-btn');

    // Form Elements
    const titleInput = document.getElementById('new-task-title');
    const dateInput = document.getElementById('new-task-date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const descInput = document.getElementById('task-desc');
    const createBtn = document.getElementById('create-task-main-btn');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('mobile_tasks')) || [
        {
            id: '1',
            title: 'UI Development',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00',
            category: 'Dev',
            completed: false
        },
        {
            id: '2',
            title: 'Dashboard Design',
            date: new Date().toISOString().split('T')[0],
            startTime: '12:00',
            endTime: '13:00',
            category: 'Design',
            completed: false
        }
    ];

    let selectedCategory = 'Marketing';
    let selectedDate = new Date().toISOString().split('T')[0];
    let currentHomeTab = 'My tasks'; // Default Tab
    let activeSearchQuery = '';

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // --- Home Tab Logic ---
    homeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            homeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentHomeTab = tab.textContent.trim();
            renderHomeTasks();
        });
    });

    // --- Search Logic ---
    document.querySelectorAll('.fa-magnifying-glass').forEach(icon => {
        let target = icon.parentElement;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'DIV') target = icon;
        target.style.cursor = 'pointer';
        target.addEventListener('click', () => {
            const query = prompt("Search tasks by title:", activeSearchQuery);
            if (query !== null) {
                activeSearchQuery = query.toLowerCase();
                renderHomeTasks();
                renderCalendarTasks();
                if (activeSearchQuery) showToast(`Searching for "${activeSearchQuery}"`);
                else showToast("Search cleared");
            }
        });
    });

    // --- Navigation Logic ---
    window.navigateTo = (pageId) => {
        // Toggle Pages
        Object.keys(pages).forEach(key => {
            if (key === pageId) {
                pages[key].classList.add('active');
            } else {
                pages[key].classList.remove('active');
            }
        });

        navItems.forEach((item, index) => {
            item.classList.remove('active');
            if (pageId === 'home' && index === 0) item.classList.add('active');
            if (pageId === 'calendar' && index === 1) item.classList.add('active');
        });

        if (pageId === 'home') renderHomeTasks();
        if (pageId === 'calendar') renderCalendarTasks();
    };

    // --- Categories Pill Logic ---
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedCategory = pill.dataset.cat;
        });
    });

    // --- Core Functions ---

    function saveTasks() {
        localStorage.setItem('mobile_tasks', JSON.stringify(tasks));
        renderHomeTasks();
        renderCalendarTasks();
    }

    function generateId() {
        return Date.now().toString();
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function renderHomeTasks() {
        const list = document.getElementById('home-task-list');
        list.innerHTML = '';

        let filtered = tasks;

        // 1. Search Filter
        if (activeSearchQuery) {
            filtered = filtered.filter(t => t.title.toLowerCase().includes(activeSearchQuery));
        }

        // 2. Tab Filter
        if (currentHomeTab === 'My tasks') {
            // Show all pending? or just all? User said "My Tasks". Let's show All.
            // Or maybe just Pending. Usually dashboard shows pending.
            filtered = filtered.filter(t => !t.completed);
        } else if (currentHomeTab === 'Project') {
            // Show filtered by Project categories
            filtered = filtered.filter(t => t.category === 'Dev' || t.category === 'Design');
        } else if (currentHomeTab === 'Note') {
            // Show filtered by 'Meeting' or 'Marketing' essentially
            filtered = filtered.filter(t => t.category === 'Meeting' || t.category === 'Marketing');
        }

        if (filtered.length === 0) {
            list.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:20px;">No tasks found</li>';
            return;
        }

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-card';
            li.innerHTML = `
                <div class="icon-box">
                    ${getCategoryIcon(task.category)}
                </div>
                <div class="task-details">
                    <h4>${task.title}</h4>
                    <p>${task.date} • ${task.startTime} - ${task.endTime}</p>
                </div>
                <div class="task-options" onclick="deleteTaskHook('${task.id}')">
                    <i class="fa-solid fa-trash"></i>
                </div>
            `;
            list.appendChild(li);
        });
    }

    function renderCalendarTasks() {
        const list = document.getElementById('calendar-task-list');
        list.innerHTML = '';

        let dateTasks = tasks.filter(t => t.date === selectedDate);

        // Apply Search
        if (activeSearchQuery) {
            dateTasks = dateTasks.filter(t => t.title.toLowerCase().includes(activeSearchQuery));
        }

        if (dateTasks.length === 0) {
            list.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:20px;">No tasks for this day</li>';
            return;
        }

        dateTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-card';
            li.innerHTML = `
                <div class="icon-box">
                     ${getCategoryIcon(task.category)}
                </div>
                <div class="task-details">
                    <h4>${task.title}</h4>
                     <p>${task.startTime} - ${task.endTime}</p>
                </div>
                <div class="task-options">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete('${task.id}')">
                </div>
            `;
            list.appendChild(li);
        });
    }

    function getCategoryIcon(cat) {
        const map = {
            'Marketing': '<i class="fa-solid fa-bullhorn"></i>',
            'Meeting': '<i class="fa-solid fa-people-group"></i>',
            'Dev': '<i class="fa-solid fa-code"></i>',
            'Design': '<i class="fa-solid fa-pen-nib"></i>'
        };
        return map[cat] || '<i class="fa-solid fa-clipboard-list"></i>';
    }

    function createTask() {
        const title = titleInput.value;
        const date = dateInput.value;

        if (!title || !date) {
            alert('Please fill in Title and Date');
            return;
        }

        const newTask = {
            id: generateId(),
            title,
            date,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            description: descInput.value,
            category: selectedCategory,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        showToast('Task Created!');

        titleInput.value = '';
        descInput.value = '';
        navigateTo('home');
    }

    function initDateStrip() {
        const strip = document.querySelector('.date-strip');
        strip.innerHTML = '';

        const today = new Date();

        for (let i = 0; i < 4; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);

            const dayNum = d.getDate();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = days[d.getDay()];
            const isoDate = d.toISOString().split('T')[0];

            const el = document.createElement('div');
            el.className = `date-item ${i === 0 ? 'active' : ''}`;
            el.innerHTML = `
                <span class="day-num">${dayNum}</span>
                <span class="day-name">${dayName}</span>
            `;

            el.addEventListener('click', () => {
                document.querySelectorAll('.date-item').forEach(x => x.classList.remove('active'));
                el.classList.add('active');
                selectedDate = isoDate;
                renderCalendarTasks();
            });

            strip.appendChild(el);
        }
    }

    // Global Hooks
    window.deleteTaskHook = (id) => {
        if (confirm('Delete task?')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
        }
    };

    window.toggleComplete = (id) => {
        const t = tasks.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            saveTasks();
            renderHomeTasks();
        }
    };

    createBtn.addEventListener('click', createTask);

    initDateStrip();
    renderHomeTasks();
});
