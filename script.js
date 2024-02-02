document.addEventListener('DOMContentLoaded', () => {
  const recordKickButton = document.getElementById('recordKick');
  const morningCount = document.getElementById('morning');
  const afternoonCount = document.getElementById('afternoon');
  const nightCount = document.getElementById('night');
  const kickLogTable = document.getElementById('kickLog');
  let kickData = {}; // Format: { 'YYYY-MM-DD': { morning: 0, afternoon: 0, night: 0, total: 0 } }
  let calendar; // Define calendar in global scope to be accessible by all functions

  setupTabs();
  setupCalendar();
  setupRecordKickButton();

  function setupTabs() {
  const tablinks = document.getElementsByClassName("tablink");
  Array.from(tablinks).forEach(link => {
    link.addEventListener('click', function(evt) { openTab(evt, this.getAttribute('data-tab')) });
  });
  // Open the first tab by default
  document.getElementById('Counter').style.display = "block";
  tablinks[0].classList.add("active");
}

function openTab(evt, tabName) {
  var tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  document.getElementById(tabName).style.display = "block";
  if (evt) {
    evt.currentTarget.classList.add("active");
  }

  // Refresh the calendar view if the Calendar tab is opened
  if (tabName === 'Calendar' && calendar) {
    calendar.render();
  }
}

  function setupCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
      plugins: ['interaction', 'dayGrid'],
      initialView: 'dayGridMonth',
      initialDate: new Date().toISOString().split('T')[0],
      editable: true,
      eventLimit: true,
      events: [],
      dateClick: function(info) {
        // handle date click if needed
      }
    });
    calendar.render();
  }

  function setupRecordKickButton() {
    recordKickButton.addEventListener('click', () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date();
      const hour = currentTime.getHours();

      if (!kickData[currentDate]) {
        kickData[currentDate] = { morning: 0, afternoon: 0, night: 0, total: 0 };
      }

      recordKick(currentDate, hour);
      addKickLogEntry(currentDate, currentTime.toLocaleTimeString(), kickData[currentDate].total);
      updateCalendarEvent(currentDate);
    });
  }

  function recordKick(date, hour) {
    const period = hour >= 5 && hour < 12 ? 'morning' :
      hour >= 12 && hour < 17 ? 'afternoon' : 'night';
    incrementCount({ morning: morningCount, afternoon: afternoonCount, night: nightCount }[period]);
    kickData[date][period]++;
    kickData[date].total++;
  }

  function incrementCount(element) {
    const currentCount = parseInt(element.innerText.split(": ")[1]);
    element.innerText = `${element.innerText.split(": ")[0]}: ${currentCount + 1}`;
  }

  function addKickLogEntry(date, time, total) {
    const row = kickLogTable.insertRow();
    const dateCell = row.insertCell(0);
    const timeCell = row.insertCell(1);
    const countCell = row.insertCell(2);
    dateCell.innerHTML = date;
    timeCell.innerHTML = time;
    countCell.innerHTML = total;
  }

  function updateCalendarEvent(date) {
    let event = calendar.getEventById(date);
    if (event) {
      event.setProp('title', `${kickData[date].total}`);
    } else {
      calendar.addEvent({
        id: date,
        title: `Kicks: ${kickData[date].total}`,
        start: date,
        allDay: true
      });
    }
  }
});
