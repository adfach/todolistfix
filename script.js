document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('new-task-input');
    const dateTimeInput = document.getElementById('task-datetime');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');
    const dateDisplay = document.getElementById('date');
    const timeDisplay = document.getElementById('time');
    const noteModal = document.getElementById('note-modal');
    const noteTextarea = document.getElementById('note-text');
    const saveNoteButton = document.getElementById('save-note-button');
    const closeModalButton = document.querySelector('.close-button');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];  // Load tasks from local storage
    let currentTaskIndex = null;
    let alarmTimeout = null;

    // Fungsi untuk menampilkan waktu dan tanggal
    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('id-ID', options); // Format Indonesia
        timeDisplay.textContent = now.toLocaleTimeString('id-ID');  // Format Indonesia
    }

    // Update waktu dan tanggal setiap detik
    setInterval(updateDateTime, 1000);

    // Fungsi untuk menambahkan tugas baru
    function addTask() {
        const taskText = taskInput.value.trim();
        const taskDateTime = dateTimeInput.value;

        if (taskText === '') {
            alert('Tugas tidak boleh kosong!');
            return;
        }

        const task = {
            id: Date.now(),  // Unique ID for each task
            text: taskText,
            dateTime: taskDateTime,
            completed: false,
            note: ''
        };

        tasks.push(task);
        saveTasks(); // Save to local storage
        renderTasks();
        setAlarm(task);  // Set alarm for the new task
        taskInput.value = '';
        dateTimeInput.value = '';
    }

    // Fungsi untuk menampilkan tugas-tugas
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('data-task-id', task.id);  // Store task ID on the list item
            listItem.classList.add('task-item'); // Add task-item class
            listItem.innerHTML = `
                <div class="task-content">
                    <span class="${task.completed ? 'completed' : ''}">${task.text}</span>
                    ${task.dateTime ? `<small>${formatDateTime(task.dateTime)}</small>` : ''}
                </div>
                <div class="task-actions">
                    <button class="complete-button" data-id="${task.id}"><i class="fas fa-check ${task.completed ? 'checked' : ''}"></i></button>
                    <button class="note-button" data-id="${task.id}"><i class="fas fa-sticky-note"></i></button>
                    <button class="delete-button" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            taskList.appendChild(listItem);
        });
    }

    // Fungsi untuk memformat tanggal dan waktu
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return date.toLocaleDateString('id-ID', options); // Format Indonesia
    }

    // Fungsi untuk menandai tugas selesai
    function completeTask(taskId) {
        tasks = tasks.map(task => {
            if (task.id == taskId) {
                task.completed = !task.completed;
            }
            return task;
        });
        saveTasks(); // Save to local storage
        renderTasks();
    }

    // Fungsi untuk menghapus tugas
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id != taskId);
        saveTasks();  // Save to local storage
        renderTasks();
    }

    // Fungsi untuk menampilkan modal catatan
    function showNoteModal(taskId) {
        const task = tasks.find(task => task.id == taskId);
        if (task) {
            currentTaskIndex = tasks.findIndex(task => task.id == taskId);
            noteTextarea.value = task.note;
            noteModal.style.display = 'flex';
        }
    }

    // Fungsi untuk menyimpan catatan
    function saveNote() {
        if (currentTaskIndex !== null) {
            tasks[currentTaskIndex].note = noteTextarea.value;
            saveTasks(); // Save to local storage
            noteModal.style.display = 'none';
            renderTasks(); // Re-render to update UI if needed
        }
    }

    // Function to save tasks to local storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Function to set an alarm for a task
    function setAlarm(task) {
        if (task.dateTime) {
            const alarmTime = new Date(task.dateTime).getTime();
            const now = new Date().getTime();
            const timeDiff = alarmTime - now;

            if (timeDiff > 0) {
                alarmTimeout = setTimeout(() => {
                    alert(`Pengingat: ${task.text}`);
                }, timeDiff);
            }
        }
    }

    // Function to clear existing alarm
    function clearAlarm() {
        if (alarmTimeout) {
            clearTimeout(alarmTimeout);
        }
    }

    // Initialize drag and drop
    $( "#task-list" ).sortable({
        update: function( event, ui ) {
            // Get the new order of tasks from the DOM
            const newOrder = $(this).sortable('toArray', {attribute: 'data-task-id'});

            // Reorder the tasks array
            const reorderedTasks = [];
            newOrder.forEach(taskId => {
                const task = tasks.find(task => task.id == taskId);
                if (task) {
                    reorderedTasks.push(task);
                }
            });

            // Update the tasks array
            tasks = reorderedTasks;
            saveTasks();  // Save new order to local storage
        }
    });
    $( "#task-list" ).disableSelection();

    // Event listeners
    addTaskButton.addEventListener('click', addTask);

    taskList.addEventListener('click', function(event) {
        const taskId = event.target.closest('button')?.dataset.id;  // Use closest to get data-id from the button
        if (!taskId) return;  // Exit if no task ID is found

        if (event.target.classList.contains('complete-button') || event.target.parentNode.classList.contains('complete-button')) { // Handle click on icon or button
            completeTask(taskId);
        } else if (event.target.classList.contains('delete-button') || event.target.parentNode.classList.contains('delete-button')) {
            deleteTask(taskId);
        } else if (event.target.classList.contains('note-button') || event.target.parentNode.classList.contains('note-button')) {
            showNoteModal(taskId);
        }
    });

    saveNoteButton.addEventListener('click', saveNote);

    closeModalButton.addEventListener('click', function() {
        noteModal.style.display = 'none';
    });

    // Tutup modal jika di klik di luar modal
    window.addEventListener('click', function(event) {
        if (event.target === noteModal) {
            noteModal.style.display = 'none';
        }
    });

    // Inisialisasi
    renderTasks();
    updateDateTime();
    tasks.forEach(setAlarm);  // Set alarms for existing tasks
});