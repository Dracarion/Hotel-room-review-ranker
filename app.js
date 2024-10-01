let currentUser = null;
let rooms = [];
let users = [];

function loadData() {
    const savedRooms = localStorage.getItem('hotelRooms');
    const savedUsers = localStorage.getItem('hotelUsers');
    if (savedRooms) rooms = JSON.parse(savedRooms);
    if (savedUsers) users = JSON.parse(savedUsers);
}

function saveData() {
    localStorage.setItem('hotelRooms', JSON.stringify(rooms));
    localStorage.setItem('hotelUsers', JSON.stringify(users));
}

function toggleForm(formType) {
    document.getElementById('loginForm').style.display = formType === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = formType === 'signup' ? 'block' : 'none';
}

function showSection(sectionId) {
    document.getElementById('loginSignup').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById(sectionId).style.display = 'block';
}


function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    if (users.some(user => user.username === username)) {
        alert('Username already exists');
        return;
    }
    users.push({ username, password, isAdmin: false });
    saveData();
    alert('Sign up successful. Please log in.');
    toggleForm('login');
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        showSection('mainApp');
        if (user.isAdmin) {
            document.getElementById('adminSection').style.display = 'block';
            updateAdminPanel();
        }
        updateTables();
    } else {
        alert('Invalid credentials');
    }
}

function logout() {
    currentUser = null;
    showSection('loginSignup');
}

function showChangePasswordForm() {
    document.getElementById('changePasswordForm').style.display = 'block';
}

function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        saveData();
        alert('Password changed successfully');
        document.getElementById('changePasswordForm').style.display = 'none';
    }
}


function addEntry() {
    const entry = {
        roomNumber: document.getElementById('roomNumber').value,
        date: document.getElementById('date').value,
        score: parseFloat(document.getElementById('score').value),
        price: parseFloat(document.getElementById('price').value),
        nights: parseInt(document.getElementById('nights').value),
        breakfast: document.getElementById('breakfast').checked,
        id: Date.now(),
        user: currentUser.username
    };
    rooms.push(entry);
    saveData();
    updateTables();
    clearForm();
}

function clearForm() {
    ['roomNumber', 'date', 'score', 'price', 'nights'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('breakfast').checked = false;
}

function updateTables() {
    updateEntriesTable();
    updateSummaryTable();
}

function updateEntriesTable() {
    const tbody = document.getElementById('entriesBody');
    tbody.innerHTML = '';
    rooms.filter(entry => entry.user === currentUser.username).forEach(entry => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${entry.roomNumber}</td>
            <td>${entry.date}</td>
            <td>${entry.score}</td>
            <td>${entry.price}</td>
            <td>${entry.nights}</td>
            <td>${entry.breakfast ? 'Yes' : 'No'}</td>
        `;
    });
}


function updateSummaryTable() {
    const summary = calculateSummary();
    const tbody = document.getElementById('summaryBody');
    tbody.innerHTML = '';
    summary.forEach(room => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${room.roomNumber}</td>
            <td>${room.avgScore.toFixed(2)}</td>
            <td>${room.avgPricePerNight.toFixed(2)}</td>
            <td>${room.breakfastPercentage.toFixed(2)}%</td>
            <td>${room.avgNights.toFixed(2)}</td>
            <td>${room.generalRank}</td>
            <td>${room.breakfastRank || '-'}</td>
            <td>${room.noBreakfastRank || '-'}</td>
        `;
    });
}

function calculateSummary() {
    const userRooms = rooms.filter(entry => entry.user === currentUser.username);
    const roomGroups = userRooms.reduce((acc, entry) => {
        if (!acc[entry.roomNumber]) {
            acc[entry.roomNumber] = [];
        }
        acc[entry.roomNumber].push(entry);
        return acc;
    }, {});

    let summary = Object.entries(roomGroups).map(([roomNumber, entries]) => {
        const totalScore = entries.reduce((sum, entry) => sum + entry.score, 0);
        const totalNights = entries.reduce((sum, entry) => sum + entry.nights, 0);
        const totalPrice = entries.reduce((sum, entry) => sum + entry.price * entry.nights, 0);
        const breakfastNights = entries.reduce((sum, entry) => sum + (entry.breakfast ? entry.nights : 0), 0);

        return {
            roomNumber,
            avgScore: totalScore / entries.length,
            avgPricePerNight: totalPrice / totalNights,
            breakfastPercentage: (breakfastNights / totalNights) * 100,
            avgNights: totalNights / entries.length
        };
    });

    summary.sort((a, b) => b.avgScore - a.avgScore);
    summary.forEach((room, index) => {
        room.generalRank = index + 1;
    });

    const breakfastRooms = summary.filter(room => room.breakfastPercentage > 0);
    breakfastRooms.sort((a, b) => b.avgScore - a.avgScore);
    breakfastRooms.forEach((room, index) => {
        room.breakfastRank = index + 1;
    });

    const noBreakfastRooms = summary.filter(room => room.breakfastPercentage < 100);
    noBreakfastRooms.sort((a, b) => b.avgScore - a.avgScore);
    noBreakfastRooms.forEach((room, index) => {
        room.noBreakfastRank = index + 1;
    });

    return summary;
}


function updateAdminPanel() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.isAdmin ? 'Yes' : 'No'}</td>
            <td>
                <button onclick="toggleAdminStatus('${user.username}')">${user.isAdmin ? 'Remove Admin' : 'Make Admin'}</button>
                <button onclick="deleteUser('${user.username}')">Delete User</button>
            </td>
        `;
    });
}

function toggleAdminStatus(username) {
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        users[userIndex].isAdmin = !users[userIndex].isAdmin;
        saveData();
        updateAdminPanel();
    }
}

function deleteUser(username) {
    users = users.filter(u => u.username !== username);
    rooms = rooms.filter(r => r.user !== username);
    saveData();
    updateAdminPanel();
}

// Initialize the app
loadData();
if (users.length === 0) {
    // Create default admin user if no users exist
    users.push({ username: 'admin', password: 'admin', isAdmin: true });
    saveData();
}
showSection('loginSignup');
