// TechShack Ops PWA — Core Engine
(function () {
  'use strict';

  // --- Date & Day Calculation ---
  // Anchor: Monday 2026-09-28 is Day 1 of the Forever Cycle
  const ANCHOR_DATE = new Date('2026-09-28T00:00:00');
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SHORT_WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const DAY_SCHEDULES = {
    1: { // Monday
      title: 'Monday',
      theme: 'Batch, Film & Schedule',
      focus: 'Pick 3 units, film moments, run batch day, schedule Tue + Thu in Meta Business Suite',
      tasks: [
        { id: 'mon_1', time: '10:00 AM', text: 'Select 3 Bench Units + 1 Backup', desc: 'Pick interesting repair cases (~50-100 tickets/month bench volume).' },
        { id: 'mon_2', time: '10:15 AM', text: 'Film 3 Repairs (5 min each)', desc: 'Phone propped: Problem moment → Fix moment → Reveal.' },
        { id: 'mon_3', time: '11:00 AM', text: "Run 'batch day' in Antigravity", desc: 'Send unit list → receive drafts → red-pen Bislish → reply approved.', trigger: 'batch day' },
        { id: 'mon_4', time: '12:00 PM', text: 'Native Schedule in Meta Business Suite', desc: 'Schedule Reel A (Tue 11:30 AM) & Reel B (Thu 5:30 PM). TikTok + Shorts in their schedulers. Saturday is held as FLEX.' },
        { id: 'mon_5', time: '5:00 PM', text: 'Confirm Scheduled Status in Meta', desc: 'Verify both posts show as Scheduled in Meta Business Suite calendar.' }
      ]
    },
    2: { // Tuesday
      title: 'Tuesday',
      theme: 'Reel A Auto-Posts',
      focus: 'Reel A publishes automatically at 11:30 AM via Meta, reply comments 12-2 PM',
      tasks: [
        { id: 'tue_1', time: '11:30 AM', text: 'Reel A Goes LIVE (Auto-Scheduled)', desc: 'Published automatically by Meta Business Suite to FB Reel + Story. Verify live link.' },
        { id: 'tue_2', time: '12:00–2:00 PM', text: 'Reply to EVERY Comment', desc: 'First 2 hours decide the algorithmic reach. Answer all customer inquiries.' }
      ]
    },
    3: { // Wednesday
      title: 'Wednesday',
      theme: 'Engage & Double-Down Check',
      focus: "Run 'comments', engage audience, check if any post hit 20k views or 10+ DMs",
      tasks: [
        { id: 'wed_1', time: '9:00 AM', text: "Run 'comments' in Antigravity", desc: 'Personally reply to customer repair questions for 30 minutes.', trigger: 'comments' },
        { id: 'wed_2', time: 'All Day', text: 'Double-Down Check (Saturday Slot)', desc: 'Any post >20k views or 10+ DMs in 48h → Film Part 2 TODAY (takes Saturday 1:00 PM slot).' }
      ]
    },
    4: { // Thursday
      title: 'Thursday',
      theme: 'Reel B Auto-Posts & Sat Lock',
      focus: 'Reel B publishes at 5:30 PM, golden-hour comments, lock Saturday 1:00 PM slot',
      tasks: [
        { id: 'thu_1', time: '5:30 PM', text: 'Reel B Goes LIVE (Auto-Scheduled)', desc: 'Published automatically by Meta Business Suite. Verify live link.' },
        { id: 'thu_2', time: '5:30–7:30 PM', text: 'Golden-Hour Comment Replies', desc: 'Reply to comments during evening peak commuting hours.' },
        { id: 'thu_3', time: '8:00 PM', text: 'Schedule Saturday 1:00 PM Slot', desc: 'If double-down fired on Wed → schedule Part 2; else schedule planned Reel #3 in Meta.' }
      ]
    },
    5: { // Friday
      title: 'Friday',
      theme: 'Buffer & Rest',
      focus: 'Film backup unit (1 reel in bank), rest if buffer is full',
      tasks: [
        { id: 'fri_1', time: 'Morning', text: 'Film Backup Unit', desc: 'Rule: Always keep 1 approved Reel in the bank.' },
        { id: 'fri_2', time: 'Afternoon', text: 'Buffer Check or Rest', desc: 'If backup is locked in bank, rest. Consistency beats heroics.' }
      ]
    },
    6: { // Saturday
      title: 'Saturday',
      theme: 'Reel C / Part 2 Auto-Posts',
      focus: 'Weekend Reel publishes at 1:00 PM via Meta, golden-hour comment replies',
      tasks: [
        { id: 'sat_1', time: '1:00 PM', text: 'Weekend Reel Goes LIVE (Auto-Scheduled)', desc: 'Reel C or Double-Down Part 2 published automatically by Meta Business Suite.' },
        { id: 'sat_2', time: '1:00–3:00 PM', text: 'Weekend Traffic Engagement', desc: 'Reply to comments during weekend afternoon leisure browsing.' }
      ]
    },
    0: { // Sunday
      title: 'Sunday',
      theme: 'Review & Strategy',
      focus: "Run 'sunday report' at 6:00 PM, confirm next week's units",
      tasks: [
        { id: 'sun_1', time: '6:00 PM', text: "Run 'sunday report' in Antigravity", desc: 'Read 1-page report: Views vs median, follower delta, top/flop.', trigger: 'sunday report' },
        { id: 'sun_2', time: '6:30 PM', text: "Confirm Next Week's 3 Units", desc: 'Confirm repair candidates for Monday 10:00 AM batch filming.' }
      ]
    }
  };

  const GENERAL_TASKS = [
    { id: 'gen_morning', time: '9:00 AM', text: "Run 'morning job' in Antigravity", desc: 'Pulls 14-day video metrics and updates metrics.csv.', trigger: 'morning job' },
    { id: 'gen_dm_log', time: '9:05 AM', text: 'Record Yesterday DM Count', desc: "Reply to morning job's prompt with the exact number of new DMs." },
    { id: 'gen_dm_all_day', time: 'All Day', text: 'Answer All DMs Within 1 Hour', desc: 'Every DM answered within the hour when possible. This is revenue.' }
  ];

  // Current selected state
  let currentDate = new Date();
  let selectedDayIndex = currentDate.getDay();

  function calculateDayNumber(date) {
    const diffTime = date.getTime() - ANCHOR_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : diffDays;
  }

  function getDateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function getCompletedTasks(dateKey) {
    try {
      const stored = localStorage.getItem(`techshack_tasks_${dateKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCompletedTask(dateKey, taskId, isDone) {
    const tasks = getCompletedTasks(dateKey);
    if (isDone) {
      tasks[taskId] = true;
    } else {
      delete tasks[taskId];
    }
    localStorage.setItem(`techshack_tasks_${dateKey}`, JSON.stringify(tasks));
  }

  function calculateStreak() {
    let streak = 0;
    let checkDate = new Date();
    // Check backwards from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    
    for (let i = 0; i < 365; i++) {
      const key = getDateKey(checkDate);
      const completed = getCompletedTasks(key);
      const dayIdx = checkDate.getDay();
      const totalDayTasks = GENERAL_TASKS.length + DAY_SCHEDULES[dayIdx].tasks.length;
      const count = Object.keys(completed).length;

      if (count >= totalDayTasks && totalDayTasks > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Check if today is already fully completed
    const todayCompleted = Object.keys(getCompletedTasks(getDateKey(new Date()))).length;
    const todayTotal = GENERAL_TASKS.length + DAY_SCHEDULES[new Date().getDay()].tasks.length;
    if (todayCompleted >= todayTotal && todayTotal > 0) {
      streak++;
    }

    return Math.max(streak, 1); // Baseline 1 for kickoff
  }

  // --- UI Rendering ---
  function renderTodayTab() {
    const todayDayIdx = currentDate.getDay();
    const dayNumber = calculateDayNumber(currentDate);
    const dayNumLabel = dayNumber > 0 ? `DAY ${dayNumber}` : `DAY 0 (PREP)`;
    const schedule = DAY_SCHEDULES[selectedDayIndex];
    const dateKey = getDateKey(currentDate);
    const completedTasks = getCompletedTasks(dateKey);

    // Header info
    document.getElementById('display-day-number').textContent = dayNumLabel;
    document.getElementById('display-day-title').textContent = `${schedule.title} — ${schedule.theme}`;
    document.getElementById('display-day-focus').textContent = schedule.focus;
    document.getElementById('streak-count').textContent = `🔥 ${calculateStreak()}d Streak`;

    // Weekday bar pills
    const weekdayBar = document.getElementById('weekday-bar');
    weekdayBar.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const btn = document.createElement('button');
      btn.className = `weekday-btn ${i === selectedDayIndex ? 'active' : ''} ${i === todayDayIdx ? 'today-marker' : ''}`;
      btn.textContent = SHORT_WEEKDAYS[i];
      btn.title = WEEKDAYS[i];
      btn.onclick = () => {
        selectedDayIndex = i;
        renderTodayTab();
      };
      weekdayBar.appendChild(btn);
    }

    // Task lists
    const generalListEl = document.getElementById('general-task-list');
    const specificListEl = document.getElementById('specific-task-list');
    generalListEl.innerHTML = '';
    specificListEl.innerHTML = '';

    let totalTasks = GENERAL_TASKS.length + schedule.tasks.length;
    let completedCount = 0;

    function createTaskEl(t) {
      const isCompleted = !!completedTasks[t.id];
      if (isCompleted) completedCount++;

      const item = document.createElement('div');
      item.className = `task-item ${isCompleted ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="custom-checkbox">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="task-body">
          <div class="task-time">${t.time}</div>
          <div class="task-text">${t.text}</div>
          <div class="task-desc">${t.desc}</div>
          ${t.trigger ? `<span class="trigger-tag">trigger: ${t.trigger}</span>` : ''}
        </div>
      `;
      item.onclick = () => {
        const nextState = !item.classList.contains('completed');
        saveCompletedTask(dateKey, t.id, nextState);
        renderTodayTab();
      };
      return item;
    }

    GENERAL_TASKS.forEach((t) => generalListEl.appendChild(createTaskEl(t)));
    schedule.tasks.forEach((t) => specificListEl.appendChild(createTaskEl(t)));

    // Update progress bar
    const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    document.getElementById('progress-text').textContent = `${completedCount} of ${totalTasks} completed (${percent}%)`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
  }

  // --- Tab Routing ---
  function switchTab(targetTab) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach((n) => {
      n.classList.toggle('active', n.getAttribute('data-tab') === targetTab);
    });
    tabContents.forEach((t) => {
      t.classList.toggle('active', t.id === `tab-${targetTab}`);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');
        switchTab(targetTab);
        if (history.replaceState) {
          history.replaceState(null, '', `#${targetTab}`);
        }
      });
    });

    const initialHash = window.location.hash.replace('#', '');
    if (['today', 'week', 'ladder', 'rules'].includes(initialHash)) {
      switchTab(initialHash);
    }
  }

  // --- Service Worker ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration note:', err.message);
        });
      });
    }
  }

  // --- Initialization ---
  function init() {
    try {
      initNavigation();
      renderTodayTab();
      registerServiceWorker();
    } catch (err) {
      console.error('[TS-Ops] App init error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
