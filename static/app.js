// Global state
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let familyMembers = [];
let currentMemberId = null;

// API base URL
const API_BASE = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        loadUser();
    } else {
        showAuthContainer();
    }
});

// Authentication Functions
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        await loadUser();
    } catch (error) {
        document.getElementById('login-error').textContent = error.message;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        // Auto-login after registration
        await handleLogin(new Event('submit'));
    } catch (error) {
        document.getElementById('register-error').textContent = error.message;
    }
}

async function loadUser() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load user');
        }

        currentUser = await response.json();
        document.getElementById('username-display').textContent = currentUser.username;
        showAppContainer();
        await loadFamilyTree();
    } catch (error) {
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showAuthContainer();
}

function showAuthContainer() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showAppContainer() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
}

// Family Tree Functions
async function loadFamilyTree() {
    try {
        const response = await fetch(`${API_BASE}/api/family/tree`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load family tree');
        }

        familyMembers = await response.json();
        renderFamilyTree();
    } catch (error) {
        console.error('Error loading family tree:', error);
    }
}

function renderFamilyTree() {
    const svg = d3.select('#tree-svg');
    svg.selectAll('*').remove();

    if (familyMembers.length === 0) {
        svg.append('text')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .attr('fill', '#999')
            .text('No family members yet. Click "Add Family Member" to get started!');
        return;
    }

    const width = document.getElementById('tree-svg').clientWidth;
    const height = 600;

    // Create a hierarchical structure
    const rootMembers = familyMembers.filter(m => !m.father_id && !m.mother_id);

    if (rootMembers.length === 0) {
        // If no root, just use the first member
        rootMembers.push(familyMembers[0]);
    }

    // Build tree data
    const treeData = buildTreeHierarchy(rootMembers[0]);

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    const g = svg.append('g')
        .attr('transform', 'translate(50, 50)');

    // Draw links
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));

    // Draw nodes
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', d => `node ${d.data.gender ? d.data.gender.toLowerCase() : ''}`)
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .on('click', (event, d) => showMemberDetails(d.data.id));

    nodes.append('circle')
        .attr('r', 25);

    nodes.append('text')
        .attr('dy', 40)
        .attr('text-anchor', 'middle')
        .text(d => `${d.data.first_name} ${d.data.last_name}`);
}

function buildTreeHierarchy(member) {
    const children = familyMembers.filter(m => m.father_id === member.id || m.mother_id === member.id);

    return {
        ...member,
        children: children.map(child => buildTreeHierarchy(child))
    };
}

function resetTreeView() {
    renderFamilyTree();
}

// Member Details
async function showMemberDetails(memberId) {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    const panel = document.getElementById('details-panel');
    const detailsDiv = document.getElementById('member-details');

    const father = member.father_id ? familyMembers.find(m => m.id === member.father_id) : null;
    const mother = member.mother_id ? familyMembers.find(m => m.id === member.mother_id) : null;
    const children = familyMembers.filter(m => m.father_id === memberId || m.mother_id === memberId);

    detailsDiv.innerHTML = `
        <div class="detail-item">
            <label>Name</label>
            <p>${member.first_name} ${member.last_name}</p>
        </div>
        ${member.gender ? `
        <div class="detail-item">
            <label>Gender</label>
            <p>${member.gender}</p>
        </div>` : ''}
        ${member.birth_date ? `
        <div class="detail-item">
            <label>Birth Date</label>
            <p>${member.birth_date}</p>
        </div>` : ''}
        ${member.death_date ? `
        <div class="detail-item">
            <label>Death Date</label>
            <p>${member.death_date}</p>
        </div>` : ''}
        ${member.birth_place ? `
        <div class="detail-item">
            <label>Birth Place</label>
            <p>${member.birth_place}</p>
        </div>` : ''}
        ${member.occupation ? `
        <div class="detail-item">
            <label>Occupation</label>
            <p>${member.occupation}</p>
        </div>` : ''}
        ${member.bio ? `
        <div class="detail-item">
            <label>Biography</label>
            <p>${member.bio}</p>
        </div>` : ''}
        ${father ? `
        <div class="detail-item">
            <label>Father</label>
            <p>${father.first_name} ${father.last_name}</p>
        </div>` : ''}
        ${mother ? `
        <div class="detail-item">
            <label>Mother</label>
            <p>${mother.first_name} ${mother.last_name}</p>
        </div>` : ''}
        ${children.length > 0 ? `
        <div class="detail-item">
            <label>Children</label>
            <p>${children.map(c => `${c.first_name} ${c.last_name}`).join(', ')}</p>
        </div>` : ''}
        <div class="detail-actions">
            <button class="btn-edit" onclick="editMember(${memberId})">Edit</button>
            <button class="btn-delete" onclick="deleteMember(${memberId})">Delete</button>
        </div>
    `;

    panel.style.display = 'block';
}

function closeDetailsPanel() {
    document.getElementById('details-panel').style.display = 'none';
}

// Member Modal
function showAddMemberForm() {
    currentMemberId = null;
    document.getElementById('modal-title').textContent = 'Add Family Member';
    document.getElementById('member-form').reset();
    populateParentSelects();
    document.getElementById('member-modal').style.display = 'flex';
}

function editMember(memberId) {
    currentMemberId = memberId;
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('modal-title').textContent = 'Edit Family Member';
    document.getElementById('first-name').value = member.first_name;
    document.getElementById('last-name').value = member.last_name;
    document.getElementById('gender').value = member.gender || '';
    document.getElementById('birth-date').value = member.birth_date || '';
    document.getElementById('death-date').value = member.death_date || '';
    document.getElementById('birth-place').value = member.birth_place || '';
    document.getElementById('occupation').value = member.occupation || '';
    document.getElementById('bio').value = member.bio || '';

    populateParentSelects(memberId);
    document.getElementById('father-id').value = member.father_id || '';
    document.getElementById('mother-id').value = member.mother_id || '';

    closeDetailsPanel();
    document.getElementById('member-modal').style.display = 'flex';
}

function closeMemberModal() {
    document.getElementById('member-modal').style.display = 'none';
    currentMemberId = null;
}

function populateParentSelects(excludeId = null) {
    const fatherSelect = document.getElementById('father-id');
    const motherSelect = document.getElementById('mother-id');

    fatherSelect.innerHTML = '<option value="">None</option>';
    motherSelect.innerHTML = '<option value="">None</option>';

    familyMembers.forEach(member => {
        if (member.id === excludeId) return;

        if (!member.gender || member.gender === 'Male') {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.first_name} ${member.last_name}`;
            fatherSelect.appendChild(option);
        }

        if (!member.gender || member.gender === 'Female') {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.first_name} ${member.last_name}`;
            motherSelect.appendChild(option);
        }
    });
}

async function handleMemberSubmit(event) {
    event.preventDefault();

    const memberData = {
        first_name: document.getElementById('first-name').value,
        last_name: document.getElementById('last-name').value,
        gender: document.getElementById('gender').value || null,
        birth_date: document.getElementById('birth-date').value || null,
        death_date: document.getElementById('death-date').value || null,
        birth_place: document.getElementById('birth-place').value || null,
        occupation: document.getElementById('occupation').value || null,
        bio: document.getElementById('bio').value || null,
        father_id: parseInt(document.getElementById('father-id').value) || null,
        mother_id: parseInt(document.getElementById('mother-id').value) || null,
    };

    try {
        const url = currentMemberId
            ? `${API_BASE}/api/family/members/${currentMemberId}`
            : `${API_BASE}/api/family/members`;

        const method = currentMemberId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(memberData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save member');
        }

        closeMemberModal();
        await loadFamilyTree();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this family member?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/family/members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete member');
        }

        closeDetailsPanel();
        await loadFamilyTree();
    } catch (error) {
        alert(error.message);
    }
}
