document.addEventListener('DOMContentLoaded', () => {
    const recordKickButton = document.getElementById('recordKick');
    const morningCount = document.getElementById('morning');
    const afternoonCount = document.getElementById('afternoon');
    const nightCount = document.getElementById('night');
    const kickLogTable = document.getElementById('kickLog');
	
	// Fetch and display the initial data, then update period counts for the current date
    refreshData().then(() => {
        console.log('Data refreshed and UI should be updated.');
    }).catch(error => {
        console.error('Error refreshing data: ', error);
    });
    
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
    // Firebase functions
    
	function recordKick(date, period) {
		const kicksRef = db.collection('kicks').doc(date);
		const eventRef = kicksRef.collection('events').doc(); // Auto-generated ID for each event

		// Start a batch to perform both operations together
		const batch = db.batch();

		// Increment the period count and the total count
		batch.set(kicksRef, {
			[period]: firebase.firestore.FieldValue.increment(1),
			total: firebase.firestore.FieldValue.increment(1)
		}, { merge: true });

		// Add a new document for the individual kick with the current time
		batch.set(eventRef, {
			time: new Date().toLocaleTimeString(),
			period: period
		});

		// Commit the batch
		return batch.commit();
	}


	   function getKicksByDate(date) {
		const kicksRef = db.collection('kicks').doc(date);
		const eventsRef = kicksRef.collection('events');

		return eventsRef.get()
			.then((querySnapshot) => {
				const events = [];
				querySnapshot.forEach((doc) => {
					events.push(doc.data());
				});
				return events;
			})
			.catch((error) => {
				console.log("Error getting documents:", error);
			});
	}


	recordKickButton.addEventListener('click', () => {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date();
        const hour = currentTime.getHours();
        let period;

        // Determine the period based on the current hour
        if (hour >= 5 && hour < 12) {
            period = 'morning';
        } else if (hour >= 12 && hour < 17) {
            period = 'afternoon';
        } else {
            period = 'night';
        }

        // Increment the count on the page
        incrementCount(period === 'morning' ? morningCount : period === 'afternoon' ? afternoonCount : nightCount);

        // Update kickData for the current date and period
        if (!kickData[currentDate]) {
            kickData[currentDate] = { morning: 0, afternoon: 0, night: 0, total: 0 };
        }
        kickData[currentDate][period] = (kickData[currentDate][period] || 0) + 1;
        kickData[currentDate].total++;

        // Add a new entry to the kick log table
        addKickLogEntry(currentDate, currentTime.toLocaleTimeString(), kickData[currentDate][period]);

        // Update the calendar with the new total
        updateCalendarEvent(currentDate);

        // Record the kick in Firebase
		recordKick(currentDate, period, 1).then(() => {
			console.log('Kick recorded successfully');
			// Fetch the latest total kicks to ensure synchronization
			return db.collection('kicks').doc(currentDate).get();
		}).then(doc => {
			if (doc.exists) {
				const data = doc.data();
				updateCalendarEvent(currentDate, data.total); // Pass the total kicks to the calendar
				updatePeriodCounts(currentDate); // Update the period counts on the page
			} else {
				console.error('Document does not exist:', currentDate);
			}
		}).catch(error => {
			console.error('Error writing document: ', error);
		});
    });


    function incrementCount(element) {
        let currentCount = parseInt(element.innerText.split(": ")[1]);
        element.innerText = element.innerText.split(": ")[0] + ": " + (currentCount + 1);
    }

	function addKickLogEntry(date, time, count) {
        let row = kickLogTable.insertRow();
        let dateCell = row.insertCell(0);
        let timeCell = row.insertCell(1);
        let countCell = row.insertCell(2);

        dateCell.innerText = date;
        timeCell.innerText = time;
        countCell.innerText = count;
    }

	function updateCalendarEvent(date, totalKicks) {
		let event = calendar.getEventById(date);
		if (event) {
			// Event exists, update it
			event.setProp('title', `Kicks: ${totalKicks}`);
		} else {
			// Event doesn't exist, add it
			calendar.addEvent({
				id: date,
				title: `Kicks: ${totalKicks}`,
				start: date,
				allDay: true
			});
		}
	}
	
	function refreshData() {
		const currentDate = new Date().toISOString().split('T')[0];
		return db.collection('kicks').get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				const date = doc.id;
				kickData[date] = data; // Store the data for later use

				if (date === currentDate) {
					// Update the period counts for today
					updatePeriodCounts(currentDate);
				}

				// Now we fetch individual kick events for the date
				return doc.ref.collection('events').get().then((eventsSnapshot) => {
					const events = [];
					eventsSnapshot.forEach(eventDoc => {
						events.push(eventDoc.data());
					});
					// Update the kick log table with the events for this date
					updateKickLogTable(date, events);
					// Use the stored total to update the calendar
					updateCalendarEvent(date, data.total);
				});
			});
		}).catch(error => {
			console.error('Error fetching documents: ', error);
		});
	}


	function updateKickLogTable(date, events) {
		// Clear the existing table contents
		kickLogTable.innerHTML = "";

		// Re-add the header row
		let header = kickLogTable.createTHead();
		let headerRow = header.insertRow(0);
		let dateHeader = headerRow.insertCell(0);
		let timeHeader = headerRow.insertCell(1);
		let periodHeader = headerRow.insertCell(2);
		dateHeader.innerText = 'Date';
		timeHeader.innerText = 'Time';
		periodHeader.innerText = 'Period';

		// Add new rows for each kick event
		events.forEach(event => {
			let row = kickLogTable.insertRow();
			let dateCell = row.insertCell(0);
			let timeCell = row.insertCell(1);
			let periodCell = row.insertCell(2);
			dateCell.innerText = date;
			timeCell.innerText = event.time;
			periodCell.innerText = event.period;
		});
	}


	function updatePeriodCounts(date) {
		const kicksRef = db.collection('kicks').doc(date);

		kicksRef.get().then(doc => {
			if (doc.exists) {
				const data = doc.data();
				morningCount.innerText = `Morning: ${data.morning || 0}`;
				afternoonCount.innerText = `Afternoon: ${data.afternoon || 0}`;
				nightCount.innerText = `Night: ${data.night || 0}`;
			} else {
				// Handle the case where there is no document for the date
				morningCount.innerText = "Morning: 0";
				afternoonCount.innerText = "Afternoon: 0";
				nightCount.innerText = "Night: 0";
			}
		}).catch(error => {
			console.error("Error getting document:", error);
		});
	}

});
