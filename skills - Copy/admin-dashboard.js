// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA7Z3bImR0ExmGk5xN1JlF9O2xzKoNtJe8",
    authDomain: "vsip-ae225.firebaseapp.com",
    databaseURL: "https://vsip-ae225-default-rtdb.firebaseio.com",
    projectId: "vsip-ae225",
    storageBucket: "vsip-ae225.appspot.com",
    messagingSenderId: "583742741789",
    appId: "1:583742741789:web:96371708ed7f76c45415f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const recordsPerPage = 5;
let currentPage = 1;
let studentData = [];

// Check Admin Authentication
onAuthStateChanged(auth, (user) => {
    if (user && user.email === "admin@example.com") {
        document.getElementById('adminName').textContent = `Welcome, Admin`;
        loadStudentData();
    } else {
        window.location.href = "login.html"; // Redirect to login if not authorized
    }
});

// Load Student Data from Firebase
function loadStudentData() {
    const studentsRef = ref(db, 'users');
    get(studentsRef).then((snapshot) => {
        if (snapshot.exists()) {
            studentData = [];
            const users = snapshot.val();
            for (let userId in users) {
                if (users[userId].certificates) {
                    for (let certificateId in users[userId].certificates) {
                        const certificate = users[userId].certificates[certificateId];
                        studentData.push({
                            studentId: certificate.studentId,
                            studentName: certificate.studentName,
                            studentEmail: certificate.studentEmail,
                            internshipTitle: certificate.internshipTitle,
                            companyName: certificate.companyName,
                            uploadedAt: certificate.uploadedAt,
                            certificateUrl: certificate.certificateUrl,
                            userId: userId,
                            certificateId: certificateId
                        });
                    }
                }
            }
            displayStudents();
            setupPagination();
        } else {
            document.getElementById('studentTable').getElementsByTagName('tbody')[0].innerHTML = '<tr><td colspan="7">No student data available</td></tr>';
        }
    }).catch((error) => {
        console.error("Error loading student data:", error);
    });
}

// Display Students on the Table
function displayStudents() {
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const currentRecords = studentData.slice(start, end);

    const tableBody = document.getElementById('studentTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    currentRecords.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.studentId}</td>
            <td>${student.studentName}</td>
            <td>${student.studentEmail}</td>
            <td>${student.internshipTitle}</td>
            <td>${student.companyName}</td>
            <td>${new Date(student.uploadedAt).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button onclick="editStudent('${student.userId}', '${student.certificateId}')">Edit</button>
                <button onclick="deleteStudent('${student.userId}', '${student.certificateId}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Pagination Setup
function setupPagination() {
    const totalPages = Math.ceil(studentData.length / recordsPerPage);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => {
            currentPage = i;
            displayStudents();
        };
        paginationDiv.appendChild(button);
    }
}

// Delete Student
function deleteStudent(userId, certificateId) {
    if (confirm("Are you sure you want to delete this student?")) {
        const studentRef = ref(db, `users/${userId}/certificates/${certificateId}`);
        remove(studentRef).then(() => {
            alert("Student deleted successfully.");
            loadStudentData();
        }).catch((error) => {
            console.error("Error deleting student:", error);
        });
    }
}

// Edit Student
function editStudent(userId, certificateId) {
    const student = studentData.find(s => s.userId === userId && s.certificateId === certificateId);
    if (!student) return;

    const newName = prompt("Enter new name:", student.studentName);
    const newEmail = prompt("Enter new email:", student.studentEmail);
    const newTitle = prompt("Enter new internship title:", student.internshipTitle);
    const newCompany = prompt("Enter new company:", student.companyName);

    if (newName && newEmail && newTitle && newCompany) {
        const studentRef = ref(db, `users/${userId}/certificates/${certificateId}`);
        update(studentRef, {
            studentName: newName,
            studentEmail: newEmail,
            internshipTitle: newTitle,
            companyName: newCompany
        }).then(() => {
            alert("Student details updated successfully.");
            loadStudentData();
        }).catch((error) => {
            console.error("Error updating student:", error);
        });
    } else {
        alert("Update cancelled.");
    }
}

// Search Filter
function searchStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = studentData.filter(student => {
        return student.studentId.toLowerCase().includes(searchTerm) ||
               student.studentName.toLowerCase().includes(searchTerm) ||
               student.studentEmail.toLowerCase().includes(searchTerm) ||
               student.internshipTitle.toLowerCase().includes(searchTerm) ||
               student.companyName.toLowerCase().includes(searchTerm) ||
               new Date(student.uploadedAt).toLocaleDateString().includes(searchTerm);
    });

    studentData = filteredData;
    currentPage = 1;
    displayStudents();
    setupPagination();
}

// Logout Function
function logout() {
    signOut(auth).then(() => {
        alert("Logged out successfully");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Error logging out:", error);
        alert("Error logging out: " + error.message);
    });
}

// Event Listeners
document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('searchInput').addEventListener('keyup', searchStudents);
