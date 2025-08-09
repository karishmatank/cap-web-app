let calendar;
let currentSchedule = null;
const csrf = window.CSRF_TOKEN;
let ts;

// Make sure date data has time zone offset so that it displays on the correct day
function ensureOffset(isoStr) {
    if (!isoStr) return isoStr;

    // 1. Already has Z or +/-HH:MM
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(isoStr)) return isoStr;

    // 2. Date-only means add clock + offset
    if (!isoStr.includes('T')) isoStr += "T00:00:00";

    const offsetMin = -new Date().getTimezoneOffset(); // minutes east of UTC
    const sign = offsetMin >= 0 ? "+" : "-";
    const pad = n => String(Math.abs(n)).padStart(2, '0');
    const hh = pad(Math.floor(Math.abs(offsetMin) / 60));
    const mm = pad(Math.abs(offsetMin) % 60);

    return `${isoStr}${sign}${hh}:${mm}`;
}

function refreshCalendar(calendar) {
    // Load events from API
    if (!ts) return;
    fetch('/calendar/api/events/calendar-data/')
    .then((response) => response.json())
    .then((events) => {
        calendar.clear();
        const formatted = events.map(ev => {
            // Ability for TomSelect to know about users that have already been selected so that it can show them on edit
            if (Array.isArray(ev.participants)) {
                ev.participants.forEach(u => {
                    if (!ts.options[u.id]) {
                        ts.addOption({ id: u.id, full_name: u.full_name });
                    }
                });
            }
            
            return {
                id: ev.id,
                calendarId: ev.calendarId,
                title: ev.name,
                category: ev.category,
                isAllday: ev.isAllday,
                isReadOnly: ev.isReadOnly,
                start: ensureOffset(ev.start),
                end: ev.end ? ensureOffset(ev.end) : ensureOffset(ev.start),
                raw: {
                    application: ev.application || null,
                    participants: ev.participants?.map(u => u.id) || null,
                    description: ev.description || null,
                    creator: ev.creator || null,
                }
            };
        });
        ts.refreshOptions(false);
        calendar.createEvents(formatted);
    });
}

// Load calendar
document.addEventListener("DOMContentLoaded", () => {
    currentSchedule = null;

    // Initialize ts to later search for users to add as participants
    ts = new TomSelect("#event-participants", {
        valueField: "id",
        labelField: "full_name",
        searchField: "full_name",
        load: (query, callback) => {
            if (!query.length) return callback();
    
            fetch(`/users/api/search/?q=${encodeURIComponent(query)}`)
                .then((response) => response.json())
                .then((data) => {
                    const users = data.map((user) => ({
                        id: user.id,
                        full_name: `${user.first_name} ${user.last_name}`,
                    }));
                    callback(users);
                })
                .catch(() => callback());
        },
        maxOptions: 10,
        create: false
    });

    calendar = new tui.Calendar('#calendar', {
        defaultView: 'month',
        scheduleView: ['time'],
        useCreationPopup: false,
        useDetailPopup: false,
        isReadOnly: false,
        usageStatistics: false,
        calendars: [
            {
                id: 'session',
                name: 'CAP Session',
                backgroundColor: '#f28e2b'
            },
            {
                id: 'general',
                name: 'General',
                backgroundColor: '#76b7b2'
            },
            {
                id: 'todo',
                name: 'Application To Do',
                backgroundColor: '#e15759'
            }
        ],
        selectable: true,
    });
    calendar.setOptions({
        week: {
            taskView: false
        }
    });

    // Register select event for creating new events
    calendar.on('selectDateTime', ({ start, end, isAllDay, event }) => {
        document.getElementById('addEventModalLabel').innerText = "Add New Event";
        document.getElementById('event-submit-button').innerText = "Add Event";

        // Format date and time
        const toDateInput = d => new Date(d).toLocaleDateString('en-CA'); // yyyy-MM-dd
        const toTimeInput = d => new Date(d).toTimeString().slice(0, 5);

        const startDateStr = toDateInput(start);
        const startTimeStr = toTimeInput(start);
        const endDateStr = toDateInput(end);
        const endTimeStr = toTimeInput(end);

        // Prefill form fields
        document.getElementById('event-date').value = startDateStr;
        document.getElementById('all-day-checkbox').checked = false;

        if (document.getElementById('all-day-checkbox').checked === false) {
            document.getElementById('event-start-time').value = startTimeStr;
            document.getElementById('event-end').value = endDateStr;
            document.getElementById('event-end-time').value = endTimeStr;
        }

        const modal = new bootstrap.Modal(document.getElementById("addEventModal"));
        modal.show();
        calendar.clearGridSelections();
    });

    // Edit event already on the calendar
    calendar.on('clickEvent', ({ event }) => {

        console.log(event);

        const readOnly = event.isReadOnly;
        
        // For milestones only, which are set as read only but we want to open the modal still 
        currentSchedule = readOnly ? null : event;
        
        document.getElementById('addEventModalLabel').innerText = "Edit Event";
        document.getElementById('event-submit-button').innerText = "Edit Event";
        if (readOnly & event.calendarId != 'todo') {
            document.getElementById('readonly-message').innerText = `Only ${event.raw.creator} has edit permission for this event.`;
        } else if (readOnly & event.calendarId == 'todo') {
            document.getElementById('readonly-message').innerText = "Please edit to-do details within the Applications tab.";
        } else {
            document.getElementById('readonly-message').innerText = '';
        }

        document.getElementById('event-category').value = event.calendarId;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-description').value = event.raw?.description || ''; // Custom events in raw
        document.getElementById('all-day-checkbox').checked = event.isAllday;

        const hasOtherParticipants = Array.isArray(event.raw?.participants) && event.raw.participants.length > 1;
        document.getElementById('invite-checkbox').checked = hasOtherParticipants;
        document.getElementById('participants-group').style.display = hasOtherParticipants ? "block" : "none";
        
        if (ts) {
            ts.clear(true);
            if (hasOtherParticipants) {
                ts.setValue(event.raw.participants);
            }
            readOnly ? ts.disable() : ts.enable();
        }

        // Format date and time
        const toDateInput = d => new Date(d).toLocaleDateString('en-CA'); // yyyy-MM-dd
        const toTimeInput = d => new Date(d).toTimeString().slice(0, 5);

        const startDateStr = toDateInput(event.start);
        const startTimeStr = toTimeInput(event.start);
        const endDateStr = toDateInput(event.end);
        const endTimeStr = toTimeInput(event.end);

        // Prefill form fields
        document.getElementById('event-date').value = startDateStr;

        if (!event.isAllDay) {
            document.getElementById('event-start-time').value = startTimeStr;
            document.getElementById('event-end').value = endDateStr;
            document.getElementById('event-end-time').value = endTimeStr;
        }

        // Disable event submit button
        const submitBtn = document.getElementById('event-submit-button');
        submitBtn.classList.toggle('d-none', readOnly); // Hide if view only
        submitBtn.textContent = readOnly ? '' : "Edit Event";

        // Disable delete button
        const deleteBtn = document.getElementById('event-delete-button');
        deleteBtn.classList.toggle('d-none', readOnly); // Hide if view only
        deleteBtn.classList.toggle('d-block', !readOnly); // Default in HTML is d-none. I want to show if it is read only
        deleteBtn.textContent = readOnly ? '' : "Delete Event";

        // Disable other inputs and selects
        document
            .querySelectorAll('#add-event-form input, #add-event-form textarea, #add-event-form select')
            .forEach(el => el.disabled = readOnly);

        // Don't show the all day fields unless the box is checked
        setAllDayMode(event.isAllday);

        const modal = new bootstrap.Modal(document.getElementById("addEventModal"));
        modal.show();
        calendar.clearGridSelections();

    });

    calendar.on('beforeUpdateEvent', async ({ event, changes }) => {
        if (event.isReadOnly) return false;

        let startISO;
        let endISO;
        
        if (!event.isAllday) {
            startISO = changes.start ? ensureOffset(changes.start.toDate().toISOString()) : null;
            endISO = changes.end ? ensureOffset(changes.end.toDate().toISOString()) : null;
        } else {
            // We'll get a start that has a time of 00:00 and an end that has a time of 23:59. I just need the date
            startISO = changes.start ? ensureOffset(changes.start.toDate().toLocaleDateString('en-CA')) : null;
            endISO = null;
        }

        // Check to make sure end is > start
        if (end && (end < start)) {
            document.getElementById('error-message').innerText = 'End must be after start!';
            return false;
        }
        
        // Get updates
        const body = {};
        if (startISO) body.start = startISO;
        if (endISO) body.end = endISO;

        try {
            const res = await fetch(`/calendar/api/events/${event.id.split("-")[1]}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(await res.text());
        } catch (err) {
            console.error("Update failed:", err);
            return false;
        }

        refreshCalendar(calendar);

    });

    window.tuiCalendarInstance = calendar;
    refreshCalendar(calendar);
    calendar.render();
    // Show current view's date on load
    updateDateDisplay(calendar);
});

// Submitting form to add a new event
document.getElementById("add-event-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const category = document.getElementById("event-category").value;
    const name = document.getElementById("event-title").value;
    const description = document.getElementById("event-description").value;
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-start-time").value;
    const isAllDay = document.getElementById("all-day-checkbox").checked;
    const endDate = document.getElementById("event-end").value;
    const endTime = document.getElementById("event-end-time").value;
    const inviteOthers = document.getElementById("invite-checkbox").checked;
    const participantsSelect = document.getElementById("event-participants");

    // If time provided, combine with date
    const start = time ? ensureOffset(`${date}T${time}`) : ensureOffset(date);
    const end = !isAllDay && endDate ? (endTime ? ensureOffset(`${endDate}T${endTime}`): ensureOffset(endDate)) : null;

    // Check to make sure end is > start
    if (end && (end < start)) {
        document.getElementById('error-message').innerText = 'End must be after start!';
        return false;
    }

    const participants = inviteOthers && participantsSelect
        ? Array.from(participantsSelect.selectedOptions).map(opt => parseInt(opt.value))
        : [];
    
    const body = { 
        name: name, 
        start: start,
        description: description,
        end: end,
        category: category,
        isAllDay: isAllDay,
        participants: participants,
        raw : {
            participants: participants,
            description: description,
        }
    };

    if (currentSchedule) {
        fetch(`/calendar/api/events/${currentSchedule.id.split("-")[1]}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
            body: JSON.stringify(body)
        })
        .then((response) => {
            if (!response.ok) throw new Error("Failed to edit event");
            return response.json()
        })
        .then((savedEvent) => {
            currentSchedule = null;
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
            modal.hide();
            refreshCalendar(window.tuiCalendarInstance);
            calendar.clearGridSelections();
        });
    } else {
        fetch("/calendar/api/events/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
            body: JSON.stringify(body)
        })
        .then((response) => {
            if (!response.ok) throw new Error("Failed to create event");
            return response.json();
        })
        .then((savedEvent) => {
            currentSchedule = null;
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
            modal.hide();
            refreshCalendar(window.tuiCalendarInstance);
            calendar.clearGridSelections();
        });
    }
});

// Delete event
document.getElementById("event-delete-button").addEventListener("click", (event) => {
    event.preventDefault();

    // currentSchedule should have the event details
    if (currentSchedule) {
        fetch(`/calendar/api/events/${currentSchedule.id.split("-")[1]}/`, {
            method: "DELETE",
            headers: {
                "X-CSRFToken": csrf
            }
        })
        .then((response) => {
            if (!response.ok) throw new Error("Delete failed");
            currentSchedule = null;
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
            modal.hide();
            refreshCalendar(window.tuiCalendarInstance);
            calendar.clearGridSelections();
        });
    }
});

// Show relevant elements only if user selects checkbox
function setAllDayMode(isAllDay) {
    const endGroup = document.getElementById("end-date-group");
    endGroup.style.display = isAllDay ? "none" : "block";

    const startTimeInput = document.getElementById('event-start-time');
    const endInput = document.getElementById('event-end');
    const endTimeInput = document.getElementById('event-end-time');

    if (isAllDay) {
        startTimeInput.value = '';
        endInput.value = '';
        endTimeInput.value = '';
    }
}

document.getElementById("all-day-checkbox").addEventListener("change", (event) => {
    setAllDayMode(event.target.checked);
});

document.getElementById("invite-checkbox").addEventListener("change", (event) => {
    const participantsGroup = document.getElementById("participants-group");
    participantsGroup.style.display = event.target.checked ? "block" : "none";
});

// Functionality for buttons that toggle across months / weeks, etc
function updateDateDisplay(calendar) {
    const viewName = calendar.getViewName(); // "month", "week", or "day"
    let dateText = "";

    const formatter = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const formatter_month = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
    });

    const formatter_week_mobile = new Intl.DateTimeFormat("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
    });

    if (viewName === "month") {
        const current = calendar.getDate().toDate();
        dateText = formatter_month.format(current);
    } else if (viewName === "day") {
        dateText = formatter.format(calendar.getDate().toDate());
    } else {
        const start = calendar.getDateRangeStart().toDate();
        const end = calendar.getDateRangeEnd().toDate();
        if (window.innerWidth < 600) {
            dateText = `W/E ${formatter_week_mobile.format(end)}`;
        } else {
            dateText = `${formatter.format(start)} - ${formatter.format(end)}`;
        }
        
    }

    document.getElementById("calendar-date-display").textContent = dateText;
}

// Navigation buttons
document.getElementById("prevBtn").addEventListener("click", () => {
    calendar.prev();
    refreshCalendar(calendar);
    updateDateDisplay(calendar);
});

document.getElementById("todayBtn").addEventListener("click", () => {
    calendar.today();
    refreshCalendar(calendar);
    updateDateDisplay(calendar);
});

document.getElementById("nextBtn").addEventListener("click", () => {
    calendar.next();
    refreshCalendar(calendar);
    updateDateDisplay(calendar);
});

// View toggle (month vs week vs day)
document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
        // For all buttons, have to remove active
        document.querySelectorAll("[data-view]").forEach((btn) => btn.classList.remove("active"));

        // For current button, add back
        btn.classList.add("active");

        const view = btn.getAttribute("data-view");
        calendar.changeView(view);
        refreshCalendar(calendar);
        updateDateDisplay(calendar);
    });
});

// Reset modal on close
document.getElementById("addEventModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById('add-event-form').reset();
    currentSchedule = null;
    document.getElementById('addEventModalLabel').innerText = "Add New Event";
    document.getElementById('event-submit-button').innerText = "Add Event";
    document.getElementById('readonly-message').innerText = '';
    document.getElementById('error-message').innerText = '';
    document.getElementById('participants-group').style.display = "none";
    document.getElementById('end-date-group').style.display = "block";

    // Enable event submit button
    const submitBtn = document.getElementById('event-submit-button');
    submitBtn.style.display = "block";
    submitBtn.textContent = '';

    // Enable event delete button
    const deleteBtn = document.getElementById('event-delete-button');
    deleteBtn.classList.remove('d-block');
    deleteBtn.classList.add('d-none');
    deleteBtn.textContent = '';

    // Enable other inputs and selects
    document
        .querySelectorAll('#add-event-form input, #add-event-form textarea, #add-event-form select')
        .forEach(el => el.disabled = false);
    
    TomSelect?.instances?.['event-participants']?.enable();

    calendar.clearGridSelections();
});