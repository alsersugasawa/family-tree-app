// Global state
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let familyMembers = [];
let currentMemberId = null;
let currentZoom = null;
let currentSvg = null;

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

        // Auto-login after successful registration
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!loginResponse.ok) {
            throw new Error('Registration successful but login failed. Please login manually.');
        }

        const loginData = await loginResponse.json();
        authToken = loginData.access_token;
        localStorage.setItem('authToken', authToken);
        await loadUser();
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
        updateFamilySummary();
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

    // Build partner relationships (people who have children together)
    const partnerPairs = new Map(); // Map of person ID to their partners
    familyMembers.forEach(member => {
        if (member.father_id && member.mother_id) {
            const father = familyMembers.find(m => m.id === member.father_id);
            const mother = familyMembers.find(m => m.id === member.mother_id);
            if (father && mother) {
                if (!partnerPairs.has(father.id)) partnerPairs.set(father.id, new Set());
                if (!partnerPairs.has(mother.id)) partnerPairs.set(mother.id, new Set());
                partnerPairs.get(father.id).add(mother.id);
                partnerPairs.get(mother.id).add(father.id);
            }
        }
    });

    // Create a hierarchical structure - find all root members (those without parents)
    const rootMembers = familyMembers.filter(m => !m.father_id && !m.mother_id);

    // If no clear roots, find members who aren't children of anyone
    let actualRoots = rootMembers.length > 0 ? rootMembers : familyMembers;

    // Create a global set to track processed children across all branches
    const globalProcessedChildren = new Set();

    // Create a virtual root to hold all root members
    const treeData = {
        id: 'virtual-root',
        first_name: '',
        last_name: '',
        isVirtual: true,
        children: actualRoots.map(rootMember => buildTreeHierarchy(rootMember, new Set(), globalProcessedChildren))
    };

    const treeLayout = d3.tree().size([width - 100, height - 200]);
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Create a container group for zoom/pan
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])  // Allow zoom from 10% to 300%
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Store zoom and svg for button controls
    currentZoom = zoom;
    currentSvg = svg;

    // Set initial transform to position the tree with parents at top
    const initialTransform = d3.zoomIdentity.translate(50, 80);
    svg.call(zoom.transform, initialTransform);

    const g = container.append('g');

    const allNodes = root.descendants().filter(d => !d.data.isVirtual);

    // Draw links
    g.selectAll('.link')
        .data(root.links().filter(d => !d.source.data.isVirtual))
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));

    // Draw partner/marriage links
    const drawnPartners = new Set();
    allNodes.forEach(node => {
        if (partnerPairs.has(node.data.id)) {
            partnerPairs.get(node.data.id).forEach(partnerId => {
                const pairKey = [node.data.id, partnerId].sort().join('-');
                if (!drawnPartners.has(pairKey)) {
                    drawnPartners.add(pairKey);
                    const partnerNode = allNodes.find(n => n.data.id === partnerId);
                    if (partnerNode) {
                        g.append('line')
                            .attr('class', 'partner-link')
                            .attr('x1', node.x)
                            .attr('y1', node.y)
                            .attr('x2', partnerNode.x)
                            .attr('y2', partnerNode.y)
                            .attr('stroke', '#ff69b4')
                            .attr('stroke-width', 3)
                            .attr('stroke-dasharray', '5,5');
                    }
                }
            });
        }
    });

    // Draw nodes
    const nodes = g.selectAll('.node')
        .data(allNodes)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.data.gender ? d.data.gender.toLowerCase() : ''}`)
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .on('click', (event, d) => {
            event.stopPropagation();
            showMemberDetails(d.data.id);
        });

    nodes.append('circle')
        .attr('r', 25);

    nodes.append('text')
        .attr('dy', 40)
        .attr('text-anchor', 'middle')
        .text(d => `${d.data.first_name} ${d.data.last_name}`);
}

function buildTreeHierarchy(member, processedMembers = new Set(), globalProcessedChildren = new Set()) {
    // Avoid infinite loops
    if (processedMembers.has(member.id)) {
        return { ...member, children: [] };
    }
    processedMembers.add(member.id);

    // Get all children of this member
    const allChildren = familyMembers.filter(m =>
        (m.father_id === member.id || m.mother_id === member.id) &&
        !globalProcessedChildren.has(m.id) // Skip if already processed globally
    );

    // Mark all children as processed and add them all to the tree
    const expandedChildren = [];
    allChildren.forEach(child => {
        globalProcessedChildren.add(child.id);
        const childNode = buildTreeHierarchy(child, new Set(processedMembers), globalProcessedChildren);
        expandedChildren.push(childNode);
    });

    return {
        ...member,
        children: expandedChildren
    };
}

function updateFamilySummary() {
    // Total members
    const totalMembers = familyMembers.length;
    document.getElementById('total-members').textContent = totalMembers;

    // Gender counts
    const maleCount = familyMembers.filter(m => m.gender === 'Male').length;
    const femaleCount = familyMembers.filter(m => m.gender === 'Female').length;
    document.getElementById('male-count').textContent = maleCount;
    document.getElementById('female-count').textContent = femaleCount;

    // Living count (those without death_date)
    const livingCount = familyMembers.filter(m => !m.death_date).length;
    document.getElementById('living-count').textContent = livingCount;

    // Calculate generations (max depth of tree)
    let maxGenerations = 0;
    if (familyMembers.length > 0) {
        const calculateDepth = (memberId, depth = 1) => {
            const children = familyMembers.filter(m => m.father_id === memberId || m.mother_id === memberId);
            if (children.length === 0) return depth;
            return Math.max(...children.map(child => calculateDepth(child.id, depth + 1)));
        };

        // Find root members (those without parents)
        const roots = familyMembers.filter(m => !m.father_id && !m.mother_id);
        if (roots.length > 0) {
            maxGenerations = Math.max(...roots.map(root => calculateDepth(root.id)));
        } else {
            // If no clear root, just count as 1 generation
            maxGenerations = 1;
        }
    }
    document.getElementById('generations-count').textContent = maxGenerations;
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

    // Find siblings (same parents)
    const siblings = familyMembers.filter(m =>
        m.id !== memberId &&
        m.father_id === member.father_id &&
        m.mother_id === member.mother_id &&
        (m.father_id || m.mother_id) // At least one parent in common
    );

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
        ${siblings.length > 0 ? `
        <div class="detail-item">
            <label>Siblings</label>
            <p>${siblings.map(s => `${s.first_name} ${s.last_name}`).join(', ')}</p>
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

// Zoom Control Functions
function zoomIn() {
    if (currentZoom && currentSvg) {
        currentSvg.transition().duration(300).call(currentZoom.scaleBy, 1.3);
    }
}

function zoomOut() {
    if (currentZoom && currentSvg) {
        currentSvg.transition().duration(300).call(currentZoom.scaleBy, 0.7);
    }
}

function resetZoom() {
    if (currentZoom && currentSvg) {
        const initialTransform = d3.zoomIdentity.translate(50, 50);
        currentSvg.transition().duration(500).call(currentZoom.transform, initialTransform);
    }
}

// Account Settings Functions
function showAccountSettings() {
    document.getElementById('account-settings-modal').style.display = 'flex';
    document.getElementById('new-email').value = currentUser.email;

    // Clear error messages
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('delete-error').textContent = '';

    // Clear password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.getElementById('delete-password').value = '';
}

function closeAccountSettings() {
    document.getElementById('account-settings-modal').style.display = 'none';
}

async function updateEmail(event) {
    event.preventDefault();
    const newEmail = document.getElementById('new-email').value;
    const errorDiv = document.getElementById('email-error');
    errorDiv.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/api/auth/update-email?new_email=${encodeURIComponent(newEmail)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update email');
        }

        alert('Email updated successfully!');
        await loadUser();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function updatePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('password-error');
    errorDiv.textContent = '';

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'New passwords do not match';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/update-password?current_password=${encodeURIComponent(currentPassword)}&new_password=${encodeURIComponent(newPassword)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update password');
        }

        alert('Password updated successfully!');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function deleteAccount(event) {
    event.preventDefault();
    const password = document.getElementById('delete-password').value;
    const errorDiv = document.getElementById('delete-error');
    errorDiv.textContent = '';

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your family tree data.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/delete-account?password=${encodeURIComponent(password)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete account');
        }

        alert('Account deleted successfully');
        logout();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}
