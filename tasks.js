async function loadTasks() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
        }
    } catch (error) {
        console.error('خطأ في جلب المهام:', error);
    }
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">لا توجد مهام حالياً</p>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <h3>${task.title}</h3>
                <p>${task.description || 'لا يوجد وصف'}</p>
            </div>
        </div>
    `).join('');
}

async function addTask() {
    const title = document.getElementById('newTaskTitle').value;
    const description = document.getElementById('newTaskDesc').value;
    
    if (!title) {
        alert('الرجاء إدخال عنوان المهمة');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });
        
        if (response.ok) {
            document.getElementById('newTaskTitle').value = '';
            document.getElementById('newTaskDesc').value = '';
            loadTasks();
        }
    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(sectionId)?.classList.add('active-section');
    
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');
    
    if (sectionId === 'my-tasks') loadTasks();
}

window.addEventListener('load', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        loadTasks();
    }
});