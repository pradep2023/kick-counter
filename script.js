document.addEventListener('DOMContentLoaded', () => {
    const recordKickButton = document.getElementById('recordKick');
    const morningCount = document.getElementById('morning');
    const afternoonCount = document.getElementById('afternoon');
    const nightCount = document.getElementById('night');
    const kickLogTable = document.getElementById('kickLog');
    
    let kickData = {}; // Format: { 'YYYY-MM-DD': { morning: 0, afternoon: 0, night: 0, total: 0 } }
    
 // Function to open a tab
window.openTab = function(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active"; // Add 'active' class to the clicked tab
}

// Open the first tab by default
document.getElementsByClassName("tablink")[0].click();

    // FullCalendar initialization
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: ['interaction', 'dayGrid'],
        defaultDate: new Date().toISOString().split('T')[0],
        editable: true,
        eventLimit: true, // allow "more" link when too many events
        events: [],
        dateClick: function(info) {
            // This function gets called when a date is clicked
        }
    });
    calendar.render();

    recordKickButton.addEventListener('click', () => {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date();
        const hour = currentTime.getHours();
        
        if (!kickData[currentDate]) {
            kickData[currentDate] = { morning: 0, afternoon: 0, night: 0, total: 0 };
        }
        
        if (hour >= 5 && hour < 12) {
            incrementCount(morningCount);
            kickData[currentDate].morning++;
        } else if (hour >= 12 && hour < 17) {
            incrementCount(afternoonCount);
            kickData[currentDate].afternoon++;
        } else {
            incrementCount(nightCount);
            kickData[currentDate].night++;
        }
        kickData[currentDate].total++;
        
        addKickLogEntry(currentDate,currentTime.toLocaleTimeString(), kickData[currentDate].total);
        updateCalendarEvent(currentDate);
    });

    function incrementCount(element) {
        let currentCount = parseInt(element.innerText.split(": ")[1]);
        element.innerText = element.innerText.split(": ")[0] + ": " + (currentCount + 1);
    }

    function addKickLogEntry(date,time, total) {
        let row = kickLogTable.insertRow();
        let dateCell = row.insertCell(0);
        let timeCell = row.insertCell(1);
        let countCell = row.insertCell(2);
        dateCell.innerHTML = date;
        timeCell.innerHTML = time;
        countCell.innerHTML = total;
    }

    function updateCalendarEvent(date) {
        let event = calendar.getEventById(date);
        if (event) {
            // Event exists, update it
            event.setProp('title', `Kicks: ${kickData[date].total}`);
        } else {
            // Event doesn't exist, add it
            calendar.addEvent({
                id: date,
                title: `Kicks: ${kickData[date].total}`,
                start: date,
                allDay: true
            });
        }
    }
});
