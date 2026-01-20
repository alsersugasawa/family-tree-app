// Global state
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let familyMembers = [];
let currentMemberId = null;
let currentZoom = null;
let currentSvg = null;
let currentTreeId = null;
let familyTrees = [];

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
        await loadFamilyTrees();
        await loadTreeViews();
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
        const url = currentTreeId
            ? `${API_BASE}/api/family/tree?tree_id=${currentTreeId}`
            : `${API_BASE}/api/family/tree`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load family tree');
        }

        familyMembers = await response.json();
        console.log('Loaded family members:', familyMembers);
        console.log('Photo URLs:', familyMembers.map(m => ({ name: `${m.first_name} ${m.last_name}`, photo_url: m.photo_url })));
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

    // Calculate generation levels for each member
    // Generation 0 = Grandparents/Great-grandparents (oldest, at top)
    // Generation 1 = Parents
    // Generation 2 = Children
    // Generation 3 = Grandchildren (youngest, at bottom)
    const generationLevels = new Map();
    const processed = new Set();

    function calculateGeneration(member, level = 0) {
        if (processed.has(member.id)) return;
        processed.add(member.id);

        const currentLevel = generationLevels.get(member.id) || 0;
        generationLevels.set(member.id, Math.max(currentLevel, level));

        // Process children (they go one level deeper/lower)
        familyMembers.forEach(child => {
            if (child.father_id === member.id || child.mother_id === member.id) {
                calculateGeneration(child, level + 1);
            }
        });
    }

    // Start from root members (those without parents - these are the oldest generation at the top)
    const rootMembers = familyMembers.filter(m => !m.father_id && !m.mother_id);
    if (rootMembers.length > 0) {
        rootMembers.forEach(root => calculateGeneration(root, 0));
    } else {
        // If no clear roots, find the oldest generation and start from there
        familyMembers.forEach(member => {
            if (!generationLevels.has(member.id)) {
                calculateGeneration(member, 0);
            }
        });
    }

    // Calculate dynamic height based on number of generations
    const generationGap = 180; // Vertical gap between generations (increased for better spacing)
    const maxGeneration = Math.max(...Array.from(generationLevels.values()), 0);
    const height = Math.max(600, (maxGeneration + 2) * generationGap + 150);

    // Update SVG height dynamically
    svg.attr('height', height);

    // Create a hierarchical structure
    let actualRoots = rootMembers.length > 0 ? rootMembers : familyMembers;
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

    // Get all nodes (exclude virtual root)
    const allNodes = root.descendants().filter(d => !d.data.isVirtual);

    // Group nodes by generation level and apply generation-based layout
    const generations = new Map();

    allNodes.forEach(node => {
        const generation = generationLevels.get(node.data.id) || 0;
        if (!generations.has(generation)) {
            generations.set(generation, []);
        }
        generations.get(generation).push(node);
        node.generation = generation;
    });

    // Apply saved node positions if available, otherwise use generation-based layout
    const hasAnySavedPositions = allNodes.some(node => currentNodePositions[node.data.id]);

    if (!hasAnySavedPositions) {
        // Apply clean generation-based layout for initial view using bottom-up approach
        const sortedGenerations = Array.from(generations.keys()).sort((a, b) => a - b);
        const nodeSpacing = 250; // Minimum horizontal spacing between family groups (increased)
        const siblingSpacing = 200; // Spacing between siblings (increased)
        const partnerSpacing = 150; // Spacing between partners (increased)

        // Process generations from bottom to top (children first, then parents)
        const reversedGenerations = [...sortedGenerations].reverse();

        reversedGenerations.forEach(gen => {
            const nodesInGen = generations.get(gen);
            const positioned = new Set();

            // Group nodes by their parent pairs
            const familyGroups = new Map(); // key: parent pair string, value: array of nodes

            nodesInGen.forEach(node => {
                const fatherId = node.data.father_id || 'none';
                const motherId = node.data.mother_id || 'none';
                const parentKey = [fatherId, motherId].sort().join('-');

                if (!familyGroups.has(parentKey)) {
                    familyGroups.set(parentKey, []);
                }
                familyGroups.get(parentKey).push(node);
            });

            // Calculate positions for each family group
            let currentX = 200; // Start position (increased margin)

            Array.from(familyGroups.values()).forEach(familyGroup => {
                // Check if these nodes are parents (have children)
                const haveChildren = familyGroup.some(node =>
                    allNodes.some(n => n.data.father_id === node.data.id || n.data.mother_id === node.data.id)
                );

                if (haveChildren) {
                    // These are parents - position them above their children
                    familyGroup.forEach(node => {
                        // Find their children
                        const children = allNodes.filter(n =>
                            n.data.father_id === node.data.id || n.data.mother_id === node.data.id
                        );

                        if (children.length > 0 && children[0].x !== undefined) {
                            // Position above children's center
                            const childXPositions = children.map(c => c.x).filter(x => x !== undefined);
                            const childCenterX = childXPositions.reduce((a, b) => a + b, 0) / childXPositions.length;

                            // Check if this person has a partner
                            if (partnerPairs.has(node.data.id)) {
                                const partners = Array.from(partnerPairs.get(node.data.id));
                                const partnerInGroup = familyGroup.find(n =>
                                    partners.includes(n.data.id) && !positioned.has(n.data.id)
                                );

                                if (partnerInGroup) {
                                    // Position partners on either side of children's center
                                    node.x = childCenterX - partnerSpacing / 2;
                                    partnerInGroup.x = childCenterX + partnerSpacing / 2;
                                    positioned.add(partnerInGroup.data.id);
                                } else {
                                    node.x = childCenterX;
                                }
                            } else {
                                node.x = childCenterX;
                            }
                        } else {
                            // No positioned children yet, use sequential positioning
                            node.x = currentX;
                            currentX += siblingSpacing;
                        }

                        node.y = 80 + (gen * generationGap);
                        positioned.add(node.data.id);
                    });
                } else {
                    // These are leaf nodes (no children) - position them sequentially
                    familyGroup.forEach((node) => {
                        if (!positioned.has(node.data.id)) {
                            // Check if this person has a partner in the same family group
                            if (partnerPairs.has(node.data.id)) {
                                const partners = Array.from(partnerPairs.get(node.data.id));
                                const partnerInGroup = familyGroup.find(n =>
                                    partners.includes(n.data.id) && !positioned.has(n.data.id)
                                );

                                if (partnerInGroup) {
                                    // Position partners together
                                    node.x = currentX;
                                    partnerInGroup.x = currentX + partnerSpacing;
                                    currentX += partnerSpacing + siblingSpacing;
                                    positioned.add(partnerInGroup.data.id);
                                } else {
                                    node.x = currentX;
                                    currentX += siblingSpacing;
                                }
                            } else {
                                node.x = currentX;
                                currentX += siblingSpacing;
                            }

                            node.y = 80 + (gen * generationGap);
                            positioned.add(node.data.id);
                        }
                    });
                }

                // Add spacing before next family group
                currentX += nodeSpacing;
            });
        });

        // Adjust positions to center the entire tree
        if (allNodes.length > 0) {
            const minX = Math.min(...allNodes.map(n => n.x));
            const maxX = Math.max(...allNodes.map(n => n.x));
            const treeWidth = maxX - minX;
            const offset = (width - treeWidth) / 2 - minX;

            allNodes.forEach(node => {
                node.x += offset;
            });
        }
    } else {
        // Apply saved positions, but still align to generation Y coordinates
        allNodes.forEach(node => {
            const savedPos = currentNodePositions[node.data.id];
            if (savedPos) {
                node.x = savedPos.x;
                node.y = savedPos.y;
            } else {
                // For unsaved positions, align to generation level
                const generation = generationLevels.get(node.data.id) || 0;
                node.y = 80 + (generation * generationGap);
            }
        });
    }

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

    // Draw links - custom link generator to handle parent pairs
    const linkData = root.links().filter(d => !d.source.data.isVirtual);

    // Function to generate link path
    function generateLinkPath(d) {
        const child = d.target;
        const childData = child.data;

        // Check if child has both parents
        if (childData.father_id && childData.mother_id) {
            const fatherNode = allNodes.find(n => n.data.id === childData.father_id);
            const motherNode = allNodes.find(n => n.data.id === childData.mother_id);

            if (fatherNode && motherNode) {
                // Calculate midpoint between parents
                const midX = (fatherNode.x + motherNode.x) / 2;
                const midY = (fatherNode.y + motherNode.y) / 2;

                // Draw line from midpoint to child
                return d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y)({
                        source: { x: midX, y: midY },
                        target: { x: child.x, y: child.y }
                    });
            }
        }

        // Default: draw from single parent to child
        return d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)(d);
    }

    const links = g.selectAll('.link')
        .data(linkData)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', generateLinkPath);

    // Draw partner/marriage links
    const drawnPartners = new Set();
    const partnerLinks = [];
    allNodes.forEach(node => {
        if (partnerPairs.has(node.data.id)) {
            partnerPairs.get(node.data.id).forEach(partnerId => {
                const pairKey = [node.data.id, partnerId].sort().join('-');
                if (!drawnPartners.has(pairKey)) {
                    drawnPartners.add(pairKey);
                    const partnerNode = allNodes.find(n => n.data.id === partnerId);
                    if (partnerNode) {
                        const link = g.append('line')
                            .attr('class', 'partner-link')
                            .attr('x1', node.x)
                            .attr('y1', node.y)
                            .attr('x2', partnerNode.x)
                            .attr('y2', partnerNode.y)
                            .attr('stroke', '#ff69b4')
                            .attr('stroke-width', 3)
                            .attr('stroke-dasharray', '5,5');
                        partnerLinks.push({link, source: node, target: partnerNode});
                    }
                }
            });
        }
    });

    // Function to update link positions
    function updateLinks() {
        links.attr('d', generateLinkPath);

        partnerLinks.forEach(({link, source, target}) => {
            link.attr('x1', source.x)
                .attr('y1', source.y)
                .attr('x2', target.x)
                .attr('y2', target.y);
        });
    }

    // Drag behavior
    const drag = d3.drag()
        .on('start', function(event, d) {
            d3.select(this).raise();
            d.dragStartX = d.x;
            d.dragStartY = d.y;
        })
        .on('drag', function(event, d) {
            d.x = event.x;
            d.y = event.y;
            d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
            updateLinks();
        })
        .on('end', function(event, d) {
            // Save node position
            if (!currentNodePositions[d.data.id]) {
                currentNodePositions[d.data.id] = {};
            }
            currentNodePositions[d.data.id].x = d.x;
            currentNodePositions[d.data.id].y = d.y;
        });

    // Draw nodes
    const nodes = g.selectAll('.node')
        .data(allNodes)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.data.gender ? d.data.gender.toLowerCase() : ''}`)
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('cursor', 'move')
        .call(drag)
        .on('click', (event, d) => {
            // Only show details if not dragging
            if (Math.abs(d.x - d.dragStartX) < 5 && Math.abs(d.y - d.dragStartY) < 5) {
                event.stopPropagation();
                showMemberDetails(d.data.id);
            }
        });

    // Add profile pictures or default circles
    nodes.each(function(d) {
        const node = d3.select(this);

        // Determine border color based on gender
        let borderColor = '#764ba2'; // Purple for 'Other' or undefined
        if (d.data.gender === 'Male') {
            borderColor = '#3498db'; // Blue
        } else if (d.data.gender === 'Female') {
            borderColor = '#e91e63'; // Pink
        }

        if (d.data.photo_url) {
            console.log(`Rendering photo for ${d.data.first_name} ${d.data.last_name}: ${d.data.photo_url}`);

            // Add white background circle
            node.append('circle')
                .attr('class', 'background-circle')
                .attr('r', 25)
                .style('fill', 'white');  // Inline style to override CSS

            // Add circular clip path for the image
            const clipId = `clip-${d.data.id}`;
            node.append('defs')
                .append('clipPath')
                .attr('id', clipId)
                .append('circle')
                .attr('r', 25);

            // Add profile picture
            node.append('image')
                .attr('class', 'profile-image')
                .attr('href', d.data.photo_url)
                .attr('xlink:href', d.data.photo_url)  // Fallback for older browsers
                .attr('x', -25)
                .attr('y', -25)
                .attr('width', 50)
                .attr('height', 50)
                .attr('clip-path', `url(#${clipId})`)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .on('error', function() {
                    console.error(`Failed to load image: ${d.data.photo_url}`);
                });

            // Add border circle over the image (with important inline styles)
            node.append('circle')
                .attr('class', 'border-circle')
                .attr('r', 25)
                .style('fill', 'none')  // Inline style to override CSS
                .style('stroke', borderColor)
                .style('stroke-width', '3px');
        } else {
            // Add default circle with gender-specific color
            node.append('circle')
                .attr('r', 25)
                .attr('stroke', borderColor)
                .attr('stroke-width', 3);
        }
    });

    nodes.append('text')
        .attr('dy', 40)
        .attr('text-anchor', 'middle')
        .text(d => `${d.data.first_name} ${d.data.last_name}`);

    // Attach hover tooltip listeners to all nodes
    attachNodeHoverListeners();
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

    console.log('Member details:', member);
    console.log('Photo URL:', member.photo_url);

    detailsDiv.innerHTML = `
        ${member.photo_url ? `
        <div class="detail-item" style="text-align: center;">
            <img src="${member.photo_url}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid ${member.gender === 'Male' ? '#3498db' : member.gender === 'Female' ? '#e91e63' : '#764ba2'};" alt="Profile Picture">
        </div>` : ''}
        <div class="detail-item">
            <label>Name</label>
            <p>${member.first_name}${member.middle_name ? ' ' + member.middle_name : ''} ${member.last_name}${member.nickname ? ' "' + member.nickname + '"' : ''}</p>
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
        ${member.location ? `
        <div class="detail-item">
            <label>Current Location</label>
            <p>${member.location}${member.country ? ', ' + member.country : ''}</p>
        </div>` : member.country ? `
        <div class="detail-item">
            <label>Country</label>
            <p>${member.country}</p>
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
        ${member.previous_partners ? `
        <div class="detail-item">
            <label>Previous Partners</label>
            <p>${member.previous_partners}</p>
        </div>` : ''}
        ${member.social_media && Object.keys(member.social_media).length > 0 ? `
        <div class="detail-item">
            <label>Social Media</label>
            <p>
                ${member.social_media.facebook ? `<a href="${member.social_media.facebook}" target="_blank">Facebook</a><br>` : ''}
                ${member.social_media.instagram ? `<a href="${member.social_media.instagram}" target="_blank">Instagram</a><br>` : ''}
                ${member.social_media.twitter ? `<a href="${member.social_media.twitter}" target="_blank">Twitter/X</a><br>` : ''}
                ${member.social_media.linkedin ? `<a href="${member.social_media.linkedin}" target="_blank">LinkedIn</a>` : ''}
            </p>
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
    document.getElementById('middle-name').value = member.middle_name || '';
    document.getElementById('last-name').value = member.last_name;
    document.getElementById('nickname').value = member.nickname || '';
    document.getElementById('gender').value = member.gender || '';
    document.getElementById('birth-date').value = member.birth_date || '';
    document.getElementById('death-date').value = member.death_date || '';
    document.getElementById('birth-place').value = member.birth_place || '';
    document.getElementById('location').value = member.location || '';
    document.getElementById('country').value = member.country || '';
    document.getElementById('occupation').value = member.occupation || '';
    document.getElementById('bio').value = member.bio || '';
    document.getElementById('previous-partners').value = member.previous_partners || '';

    // Populate social media fields
    const socialMedia = member.social_media || {};
    document.getElementById('social-facebook').value = socialMedia.facebook || '';
    document.getElementById('social-instagram').value = socialMedia.instagram || '';
    document.getElementById('social-twitter').value = socialMedia.twitter || '';
    document.getElementById('social-linkedin').value = socialMedia.linkedin || '';

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

    // Collect social media URLs
    const socialMedia = {};
    const facebook = document.getElementById('social-facebook').value;
    const instagram = document.getElementById('social-instagram').value;
    const twitter = document.getElementById('social-twitter').value;
    const linkedin = document.getElementById('social-linkedin').value;

    if (facebook) socialMedia.facebook = facebook;
    if (instagram) socialMedia.instagram = instagram;
    if (twitter) socialMedia.twitter = twitter;
    if (linkedin) socialMedia.linkedin = linkedin;

    const memberData = {
        first_name: document.getElementById('first-name').value,
        middle_name: document.getElementById('middle-name').value || null,
        last_name: document.getElementById('last-name').value,
        nickname: document.getElementById('nickname').value || null,
        gender: document.getElementById('gender').value || null,
        birth_date: document.getElementById('birth-date').value || null,
        death_date: document.getElementById('death-date').value || null,
        birth_place: document.getElementById('birth-place').value || null,
        location: document.getElementById('location').value || null,
        country: document.getElementById('country').value || null,
        occupation: document.getElementById('occupation').value || null,
        bio: document.getElementById('bio').value || null,
        social_media: Object.keys(socialMedia).length > 0 ? socialMedia : null,
        previous_partners: document.getElementById('previous-partners').value || null,
        father_id: parseInt(document.getElementById('father-id').value) || null,
        mother_id: parseInt(document.getElementById('mother-id').value) || null,
        tree_id: currentTreeId,
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

        const savedMember = await response.json();

        // Handle profile picture upload if file is selected
        const fileInput = document.getElementById('profile-picture');
        if (fileInput.files && fileInput.files[0]) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const uploadResponse = await fetch(`${API_BASE}/api/family/members/${savedMember.id}/upload-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                console.error('Failed to upload photo:', error.detail);
                alert('Member saved but photo upload failed: ' + error.detail);
            }
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

// CSV Export/Import Functions
function exportToCSV() {
    if (familyMembers.length === 0) {
        alert('No family members to export');
        return;
    }

    // CSV headers
    const headers = ['id', 'first_name', 'middle_name', 'last_name', 'nickname', 'gender', 'birth_date', 'death_date', 'birth_place', 'location', 'country', 'occupation', 'bio', 'previous_partners', 'social_media', 'father_id', 'mother_id'];

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    familyMembers.forEach(member => {
        const row = headers.map(header => {
            let value = member[header] || '';

            // Special handling for social_media object
            if (header === 'social_media' && value && typeof value === 'object') {
                value = JSON.stringify(value);
            }

            // Escape quotes and wrap in quotes if contains comma or newline
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `family_tree_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Family tree exported successfully!');
}

function showImportCSVModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'import-csv-modal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Import Family Tree from CSV</h3>
                <button onclick="closeImportCSVModal()" class="btn-close">&times;</button>
            </div>
            <div style="padding: 20px;">
                <p style="margin-bottom: 15px; color: #666;">
                    Select a CSV file to import family members. The file should contain columns:
                    id, first_name, middle_name, last_name, nickname, gender, birth_date, death_date, birth_place, location, country, occupation, bio, previous_partners, social_media, father_id, mother_id
                </p>
                <input type="file" id="csv-file-input" accept=".csv" style="margin-bottom: 15px; width: 100%;">
                <div id="import-error" class="error-message"></div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button onclick="closeImportCSVModal()" class="btn-secondary">Cancel</button>
                    <button onclick="importFromCSV()" class="btn-primary">Import</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeImportCSVModal() {
    const modal = document.getElementById('import-csv-modal');
    if (modal) {
        modal.remove();
    }
}

async function importFromCSV() {
    const fileInput = document.getElementById('csv-file-input');
    const errorDiv = document.getElementById('import-error');
    errorDiv.textContent = '';

    if (!fileInput.files || fileInput.files.length === 0) {
        errorDiv.textContent = 'Please select a CSV file';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const csvText = e.target.result;
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                throw new Error('CSV file is empty or invalid');
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = ['first_name', 'last_name'];

            // Check required headers
            const hasRequired = requiredHeaders.every(h => headers.includes(h));
            if (!hasRequired) {
                throw new Error('CSV must contain at least first_name and last_name columns');
            }

            // Parse CSV rows
            const members = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length === 0) continue;

                const member = {};
                headers.forEach((header, index) => {
                    const value = values[index] ? values[index].trim() : '';
                    if (value) {
                        // Convert numeric strings for IDs
                        if (header.includes('_id') && value) {
                            member[header] = parseInt(value) || null;
                        } else if (header === 'social_media') {
                            // Parse JSON for social_media field
                            try {
                                member[header] = JSON.parse(value);
                            } catch (e) {
                                // If parsing fails, skip this field
                                console.warn('Failed to parse social_media JSON:', value);
                            }
                        } else {
                            member[header] = value;
                        }
                    }
                });

                // Remove id field as server will generate new IDs
                delete member.id;

                if (member.first_name && member.last_name) {
                    members.push(member);
                }
            }

            if (members.length === 0) {
                throw new Error('No valid family members found in CSV');
            }

            // Import members one by one
            let successCount = 0;
            let failCount = 0;

            for (const memberData of members) {
                try {
                    const response = await fetch(`${API_BASE}/api/family-tree/members`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(memberData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    failCount++;
                }
            }

            closeImportCSVModal();
            alert(`Import complete!\nSuccessfully imported: ${successCount}\nFailed: ${failCount}`);
            await loadFamilyTree();

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    };

    reader.onerror = function() {
        errorDiv.textContent = 'Failed to read file';
    };

    reader.readAsText(file);
}

function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentValue += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    values.push(currentValue);
    return values;
}

// Tree View Management Functions
let currentTreeView = null;
let treeViews = [];
let currentNodePositions = {};

async function loadTreeViews() {
    try {
        const response = await fetch(`${API_BASE}/api/tree-views/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            treeViews = await response.json();
            populateViewSelector();

            // Load default view if exists
            const defaultView = treeViews.find(v => v.is_default);
            if (defaultView) {
                currentTreeView = defaultView;
                document.getElementById('tree-view-select').value = defaultView.id;
            }
        }
    } catch (error) {
        console.error('Error loading tree views:', error);
    }
}

function populateViewSelector() {
    const select = document.getElementById('tree-view-select');
    select.innerHTML = '<option value="">Default View</option>';

    treeViews.forEach(view => {
        const option = document.createElement('option');
        option.value = view.id;
        option.textContent = view.name + (view.is_default ? ' (Default)' : '');
        select.appendChild(option);
    });
}

async function switchTreeView(viewId) {
    if (!viewId) {
        currentTreeView = null;
        currentNodePositions = {};
    } else {
        try {
            const response = await fetch(`${API_BASE}/api/tree-views/${viewId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                currentTreeView = await response.json();
                currentNodePositions = currentTreeView.node_positions || {};
            }
        } catch (error) {
            console.error('Error loading tree view:', error);
            alert('Failed to load view');
            return;
        }
    }

    renderFamilyTree();
}

function showManageViewsModal() {
    document.getElementById('manage-views-modal').style.display = 'flex';
    loadViewsList();
}

function closeManageViewsModal() {
    document.getElementById('manage-views-modal').style.display = 'none';
    document.getElementById('create-view-form').style.display = 'none';
}

function showCreateViewForm() {
    document.getElementById('create-view-form').style.display = 'block';
    document.getElementById('new-view-name').value = '';
    document.getElementById('new-view-description').value = '';
    document.getElementById('new-view-default').checked = false;
    document.getElementById('create-view-error').textContent = '';
}

function cancelCreateView() {
    document.getElementById('create-view-form').style.display = 'none';
}

// Function to generate thumbnail of current tree view
async function generateThumbnail() {
    return new Promise((resolve) => {
        try {
            const svg = document.getElementById('tree-svg');
            if (!svg || familyMembers.length === 0) {
                resolve(null);
                return;
            }

            // Clone the SVG
            const svgClone = svg.cloneNode(true);

            // Embed styles
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = `
                .node circle { fill: #667eea; stroke: #5568d3; stroke-width: 2px; }
                .node.male circle { fill: #3498db; }
                .node.female circle { fill: #e91e63; }
                .node text { font-size: 12px; fill: #333; font-family: 'Segoe UI', sans-serif; }
                .link { fill: none; stroke: #999; stroke-width: 2px; }
                .partner-link { stroke: #ff69b4; stroke-width: 3px; stroke-dasharray: 5,5; opacity: 0.8; }
            `;
            svgClone.insertBefore(style, svgClone.firstChild);

            // Get SVG dimensions
            const bbox = svg.getBBox();
            const svgWidth = Math.max(bbox.width + bbox.x + 100, 800);
            const svgHeight = Math.max(bbox.height + bbox.y + 100, 600);

            svgClone.setAttribute('width', svgWidth);
            svgClone.setAttribute('height', svgHeight);
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Convert to string
            const svgString = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create canvas for thumbnail
            const canvas = document.createElement('canvas');
            const thumbnailWidth = 300;
            const thumbnailHeight = 200;
            canvas.width = thumbnailWidth;
            canvas.height = thumbnailHeight;
            const ctx = canvas.getContext('2d');

            // Draw white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

            // Load and draw SVG
            const img = new Image();
            img.onload = () => {
                // Calculate scaling to fit thumbnail
                const scale = Math.min(thumbnailWidth / svgWidth, thumbnailHeight / svgHeight) * 0.9;
                const scaledWidth = svgWidth * scale;
                const scaledHeight = svgHeight * scale;
                const x = (thumbnailWidth - scaledWidth) / 2;
                const y = (thumbnailHeight - scaledHeight) / 2;

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                // Convert to base64 PNG
                const thumbnail = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(thumbnail);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };

            img.src = url;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            resolve(null);
        }
    });
}

async function createView() {
    const name = document.getElementById('new-view-name').value.trim();
    const description = document.getElementById('new-view-description').value.trim();
    const isDefault = document.getElementById('new-view-default').checked;
    const errorDiv = document.getElementById('create-view-error');

    errorDiv.textContent = '';

    if (!name) {
        errorDiv.textContent = 'Please enter a view name';
        return;
    }

    try {
        // Generate thumbnail
        const thumbnail = await generateThumbnail();

        const response = await fetch(`${API_BASE}/api/tree-views/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                description: description || null,
                is_default: isDefault,
                node_positions: currentNodePositions,
                filter_settings: {},
                thumbnail
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create view');
        }

        await loadTreeViews();
        loadViewsList();
        cancelCreateView();
        alert('View created successfully!');
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function saveCurrentView() {
    if (!currentTreeView) {
        alert('Please select a view to save or create a new one');
        return;
    }

    try {
        // Generate thumbnail
        const thumbnail = await generateThumbnail();

        const response = await fetch(`${API_BASE}/api/tree-views/${currentTreeView.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                node_positions: currentNodePositions,
                thumbnail
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save view');
        }

        // Update local view with new thumbnail
        await loadTreeViews();
        loadViewsList();

        alert('View saved successfully!');
    } catch (error) {
        alert('Error saving view: ' + error.message);
    }
}

function loadViewsList() {
    const listDiv = document.getElementById('views-list');

    if (treeViews.length === 0) {
        listDiv.innerHTML = '<p style="color: #999; text-align: center;">No saved views yet</p>';
        return;
    }

    listDiv.innerHTML = treeViews.map(view => `
        <div style="padding: 15px; margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 5px; background: ${view.is_default ? '#f0f7ff' : 'white'};">
            <div style="display: flex; gap: 15px; align-items: start;">
                ${view.thumbnail ? `
                    <div style="flex-shrink: 0;">
                        <img src="${view.thumbnail}" alt="${view.name} thumbnail"
                             style="width: 120px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;">
                    </div>
                ` : ''}
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0;">${view.name} ${view.is_default ? '<span style="color: #667eea; font-size: 12px;">(Default)</span>' : ''}</h4>
                    ${view.description ? `<p style="margin: 0; color: #666; font-size: 13px;">${view.description}</p>` : ''}
                </div>
                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                    <button onclick="setDefaultView(${view.id})" class="btn-icon" title="Set as Default">⭐</button>
                    <button onclick="deleteView(${view.id})" class="btn-icon" title="Delete" style="color: #e74c3c;">🗑</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function setDefaultView(viewId) {
    try {
        const response = await fetch(`${API_BASE}/api/tree-views/${viewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                is_default: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to set default view');
        }

        await loadTreeViews();
        loadViewsList();
        alert('Default view updated!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteView(viewId) {
    if (!confirm('Are you sure you want to delete this view?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/tree-views/${viewId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete view');
        }

        await loadTreeViews();
        loadViewsList();

        // Reset to default view if current view was deleted
        if (currentTreeView && currentTreeView.id === viewId) {
            currentTreeView = null;
            currentNodePositions = {};
            document.getElementById('tree-view-select').value = '';
            renderFamilyTree();
        }

        alert('View deleted successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// PDF and JPEG Export Functions
function prepareSVGForExport() {
    // Clone the SVG
    const svg = document.getElementById('tree-svg');
    const svgClone = svg.cloneNode(true);

    // Get SVG dimensions
    const bounds = svg.getBoundingClientRect();
    svgClone.setAttribute('width', bounds.width);
    svgClone.setAttribute('height', bounds.height);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Create a style element with all the necessary CSS
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
        * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .node circle {
            fill: #667eea;
            stroke: #5568d3;
            stroke-width: 2px;
        }
        .node.male circle {
            fill: #3498db;
        }
        .node.female circle {
            fill: #e91e63;
        }
        .node text {
            font-size: 12px;
            fill: #333;
            text-anchor: middle;
        }
        .link {
            fill: none;
            stroke: #999;
            stroke-width: 2px;
        }
        .partner-link {
            stroke: #ff69b4;
            stroke-width: 3px;
            stroke-dasharray: 5, 5;
            opacity: 0.8;
        }
    `;
    svgClone.insertBefore(style, svgClone.firstChild);

    // Ensure all text elements have proper attributes
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach(text => {
        if (!text.getAttribute('text-anchor')) {
            text.setAttribute('text-anchor', 'middle');
        }
    });

    // Serialize the SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);

    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;

    return { svgString, width: bounds.width, height: bounds.height };
}

async function exportToPDF() {
    if (familyMembers.length === 0) {
        alert('No family tree to export');
        return;
    }

    try {
        // Get button element
        const button = document.querySelector('button[onclick="exportToPDF()"]');
        if (!button) return;

        // Show loading message
        const originalText = button.textContent;
        button.textContent = 'Generating PDF...';
        button.disabled = true;

        // Prepare SVG with embedded styles
        const { svgString, width, height } = prepareSVGForExport();

        // Create a canvas to render the SVG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Higher quality scaling
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;

        // Create an image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            // Draw white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale the context for high quality
            ctx.scale(scale, scale);

            // Draw SVG image
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');

            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);

            // Generate filename
            const viewName = currentTreeView ? currentTreeView.name : 'Family_Tree';
            const fileName = `${viewName}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Save the PDF
            pdf.save(fileName);

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        };

        img.onerror = function() {
            URL.revokeObjectURL(url);
            alert('Failed to generate PDF. Please try again.');
            button.textContent = originalText;
            button.disabled = false;
        };

        img.src = url;

    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Failed to export PDF: ' + error.message);
        const button = document.querySelector('button[onclick="exportToPDF()"]');
        if (button) {
            button.textContent = 'Export PDF';
            button.disabled = false;
        }
    }
}

async function exportToJPEG() {
    if (familyMembers.length === 0) {
        alert('No family tree to export');
        return;
    }

    try {
        // Get button element
        const button = document.querySelector('button[onclick="exportToJPEG()"]');
        if (!button) return;

        // Show loading message
        const originalText = button.textContent;
        button.textContent = 'Generating JPEG...';
        button.disabled = true;

        // Prepare SVG with embedded styles
        const { svgString, width, height } = prepareSVGForExport();

        // Create a canvas to render the SVG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Higher quality for JPEG
        const scale = 3;
        canvas.width = width * scale;
        canvas.height = height * scale;

        // Create an image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            // Draw white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale the context for high quality
            ctx.scale(scale, scale);

            // Draw SVG image
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Convert canvas to JPEG data (quality: 0.95)
            canvas.toBlob(function(blob) {
                // Create download link
                const link = document.createElement('a');
                const downloadUrl = URL.createObjectURL(blob);

                // Generate filename
                const viewName = currentTreeView ? currentTreeView.name : 'Family_Tree';
                const fileName = `${viewName}_${new Date().toISOString().split('T')[0]}.jpg`;

                link.href = downloadUrl;
                link.download = fileName;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(downloadUrl);

                // Reset button
                button.textContent = originalText;
                button.disabled = false;
            }, 'image/jpeg', 0.95);
        };

        img.onerror = function() {
            URL.revokeObjectURL(url);
            alert('Failed to generate JPEG. Please try again.');
            button.textContent = originalText;
            button.disabled = false;
        };

        img.src = url;

    } catch (error) {
        console.error('Error exporting JPEG:', error);
        alert('Failed to export JPEG: ' + error.message);
        const button = document.querySelector('button[onclick="exportToJPEG()"]');
        if (button) {
            button.textContent = 'Export JPEG';
            button.disabled = false;
        }
    }
}

// Highlight Descendants Feature
let highlightMode = false;
let highlightedPerson = null;
let highlightedDescendants = new Set();

function toggleHighlightMode(enabled) {
    highlightMode = enabled;
    const personSelect = document.getElementById('highlight-person-select');
    const exportPdfBtn = document.getElementById('export-highlight-pdf');
    const exportJpegBtn = document.getElementById('export-highlight-jpeg');

    if (enabled) {
        // Enable controls
        personSelect.disabled = false;

        // Populate person select with all family members
        personSelect.innerHTML = '<option value="">Select person...</option>';
        familyMembers
            .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
            .forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = `${member.first_name} ${member.last_name}`;
                personSelect.appendChild(option);
            });
    } else {
        // Disable controls and clear highlighting
        personSelect.disabled = true;
        exportPdfBtn.disabled = true;
        exportJpegBtn.disabled = true;
        highlightedPerson = null;
        highlightedDescendants.clear();
        personSelect.value = '';

        // Reset all nodes and links to normal state
        resetHighlighting();
    }
}

function highlightDescendants(personId) {
    if (!personId) {
        resetHighlighting();
        highlightedPerson = null;
        highlightedDescendants.clear();
        document.getElementById('export-highlight-pdf').disabled = true;
        document.getElementById('export-highlight-jpeg').disabled = true;
        return;
    }

    highlightedPerson = parseInt(personId);
    highlightedDescendants = new Set();

    // Find all descendants recursively
    function findDescendants(memberId) {
        highlightedDescendants.add(memberId);
        familyMembers.forEach(member => {
            if ((member.father_id === memberId || member.mother_id === memberId) &&
                !highlightedDescendants.has(member.id)) {
                findDescendants(member.id);
            }
        });
    }

    findDescendants(highlightedPerson);

    // Apply highlighting to the tree
    applyHighlighting();

    // Enable export buttons
    document.getElementById('export-highlight-pdf').disabled = false;
    document.getElementById('export-highlight-jpeg').disabled = false;
}

function applyHighlighting() {
    const svg = d3.select('#tree-svg');

    // Dim all nodes first
    svg.selectAll('.node')
        .style('opacity', d => highlightedDescendants.has(d.data.id) ? 1 : 0.2);

    // Dim all links
    svg.selectAll('.link')
        .style('opacity', d => {
            return highlightedDescendants.has(d.target.data.id) ? 1 : 0.1;
        })
        .style('stroke', d => {
            return highlightedDescendants.has(d.target.data.id) ? '#ff6b6b' : '#999';
        })
        .style('stroke-width', d => {
            return highlightedDescendants.has(d.target.data.id) ? '3px' : '2px';
        });

    // Dim partner links
    svg.selectAll('.partner-link')
        .style('opacity', 0.1);

    // Highlight the selected person with a special border
    svg.selectAll('.node')
        .filter(d => d.data.id === highlightedPerson)
        .select('circle')
        .style('stroke', '#ffd700')
        .style('stroke-width', '4px')
        .style('filter', 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))');
}

function resetHighlighting() {
    const svg = d3.select('#tree-svg');

    // Reset all nodes
    svg.selectAll('.node')
        .style('opacity', 1)
        .select('circle')
        .style('stroke', null)
        .style('stroke-width', null)
        .style('filter', null);

    // Reset all links
    svg.selectAll('.link')
        .style('opacity', 1)
        .style('stroke', '#999')
        .style('stroke-width', '2px');

    // Reset partner links
    svg.selectAll('.partner-link')
        .style('opacity', 0.8);
}

async function exportHighlightedPDF() {
    if (!highlightedPerson || highlightedDescendants.size === 0) {
        alert('Please select a person to highlight first');
        return;
    }

    try {
        const button = document.getElementById('export-highlight-pdf');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        button.disabled = true;

        // Get prepared SVG with embedded styles
        const { svgString, width, height } = prepareSVGForExport();

        // Create canvas
        const canvas = document.createElement('canvas');
        const scale = 2; // Higher resolution
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Create blob and load image
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();

        img.onload = function() {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height]
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);

            // Get person name for filename
            const person = familyMembers.find(m => m.id === highlightedPerson);
            const personName = person ? `${person.first_name}_${person.last_name}` : 'person';
            pdf.save(`family_tree_${personName}_descendants.pdf`);

            button.innerHTML = originalText;
            button.disabled = false;
        };

        img.onerror = function() {
            URL.revokeObjectURL(url);
            alert('Failed to generate PDF. Please try again.');
            button.innerHTML = originalText;
            button.disabled = false;
        };

        img.src = url;

    } catch (error) {
        console.error('Error exporting highlighted PDF:', error);
        alert('Failed to export PDF: ' + error.message);
        const button = document.getElementById('export-highlight-pdf');
        if (button) {
            button.innerHTML = '<i class="bi bi-file-pdf"></i>';
            button.disabled = false;
        }
    }
}

async function exportHighlightedJPEG() {
    if (!highlightedPerson || highlightedDescendants.size === 0) {
        alert('Please select a person to highlight first');
        return;
    }

    try {
        const button = document.getElementById('export-highlight-jpeg');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        button.disabled = true;

        // Get prepared SVG with embedded styles
        const { svgString, width, height } = prepareSVGForExport();

        // Create canvas
        const canvas = document.createElement('canvas');
        const scale = 2; // Higher resolution
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Create blob and load image
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();

        img.onload = function() {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Convert to JPEG
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                const person = familyMembers.find(m => m.id === highlightedPerson);
                const personName = person ? `${person.first_name}_${person.last_name}` : 'person';
                link.download = `family_tree_${personName}_descendants.jpg`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);

                button.innerHTML = originalText;
                button.disabled = false;
            }, 'image/jpeg', 0.95);
        };

        img.onerror = function() {
            URL.revokeObjectURL(url);
            alert('Failed to generate JPEG. Please try again.');
            button.innerHTML = originalText;
            button.disabled = false;
        };

        img.src = url;

    } catch (error) {
        console.error('Error exporting highlighted JPEG:', error);
        alert('Failed to export JPEG: ' + error.message);
        const button = document.getElementById('export-highlight-jpeg');
        if (button) {
            button.innerHTML = '<i class="bi bi-file-image"></i>';
            button.disabled = false;
        }
    }
}

// ==========================================
// HOVER TOOLTIP FUNCTIONALITY
// ==========================================

let tooltipElement = null;

/**
 * Initialize tooltip element reference
 */
function initializeTooltip() {
    tooltipElement = document.getElementById('node-tooltip');
}

/**
 * Format tooltip content for a family member
 * @param {Object} member - Family member data
 * @returns {string} HTML content for tooltip
 */
function formatTooltipContent(member) {
    let content = `<div class="tooltip-name">${member.first_name}`;
    
    if (member.middle_name) {
        content += ` ${member.middle_name}`;
    }
    
    content += ` ${member.last_name}`;
    
    if (member.nickname) {
        content += ` "${member.nickname}"`;
    }
    
    content += '</div>';
    
    // Gender
    if (member.gender) {
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Gender:</span>
            <span class="tooltip-value">${member.gender}</span>
        </div>`;
    }
    
    // Birth Date
    if (member.birth_date) {
        const birthDate = new Date(member.birth_date);
        const formattedDate = birthDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Born:</span>
            <span class="tooltip-value">${formattedDate}</span>
        </div>`;
    }
    
    // Birth Place
    if (member.birth_place) {
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Birth Place:</span>
            <span class="tooltip-value">${member.birth_place}</span>
        </div>`;
    }
    
    // Death Date
    if (member.death_date) {
        const deathDate = new Date(member.death_date);
        const formattedDate = deathDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Died:</span>
            <span class="tooltip-value">${formattedDate}</span>
        </div>`;
    } else {
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Status:</span>
            <span class="tooltip-value">Living</span>
        </div>`;
    }
    
    // Occupation
    if (member.occupation) {
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Occupation:</span>
            <span class="tooltip-value">${member.occupation}</span>
        </div>`;
    }
    
    // Location
    if (member.location) {
        let locationText = member.location;
        if (member.country) {
            locationText += ', ' + member.country;
        }
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Location:</span>
            <span class="tooltip-value">${locationText}</span>
        </div>`;
    }
    
    // Parents
    const father = familyMembers.find(m => m.id === member.father_id);
    const mother = familyMembers.find(m => m.id === member.mother_id);
    
    if (father || mother) {
        let parentsText = '';
        if (father) parentsText += `${father.first_name} ${father.last_name}`;
        if (father && mother) parentsText += ' & ';
        if (mother) parentsText += `${mother.first_name} ${mother.last_name}`;
        
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Parents:</span>
            <span class="tooltip-value">${parentsText}</span>
        </div>`;
    }
    
    // Children count
    const children = familyMembers.filter(m => 
        m.father_id === member.id || m.mother_id === member.id
    );
    
    if (children.length > 0) {
        content += `<div class="tooltip-field">
            <span class="tooltip-label">Children:</span>
            <span class="tooltip-value">${children.length}</span>
        </div>`;
    }
    
    return content;
}

/**
 * Show tooltip on mouse hover
 * @param {Event} event - Mouse event
 * @param {Object} member - Family member data
 */
function showTooltip(event, member) {
    if (!tooltipElement) {
        initializeTooltip();
    }
    
    if (!tooltipElement) return;
    
    // Set tooltip content
    tooltipElement.innerHTML = formatTooltipContent(member);
    
    // Position tooltip near the cursor
    const containerRect = document.getElementById('tree-container').getBoundingClientRect();
    const tooltipX = event.clientX - containerRect.left + 15;
    const tooltipY = event.clientY - containerRect.top + 15;
    
    tooltipElement.style.left = tooltipX + 'px';
    tooltipElement.style.top = tooltipY + 'px';
    
    // Show tooltip with fade-in effect
    tooltipElement.classList.add('visible');
}

/**
 * Hide tooltip on mouse leave
 */
function hideTooltip() {
    if (!tooltipElement) return;
    
    // Hide tooltip with fade-out effect
    tooltipElement.classList.remove('visible');
}

/**
 * Update tooltip position as mouse moves
 * @param {Event} event - Mouse event
 */
function moveTooltip(event) {
    if (!tooltipElement || !tooltipElement.classList.contains('visible')) return;
    
    const containerRect = document.getElementById('tree-container').getBoundingClientRect();
    const tooltipX = event.clientX - containerRect.left + 15;
    const tooltipY = event.clientY - containerRect.top + 15;
    
    tooltipElement.style.left = tooltipX + 'px';
    tooltipElement.style.top = tooltipY + 'px';
}

/**
 * Attach hover event listeners to nodes
 * Called after nodes are rendered in the tree
 */
function attachNodeHoverListeners() {
    const nodes = d3.selectAll('.node');
    
    nodes
        .on('mouseenter', function(event, d) {
            showTooltip(event, d.data);
        })
        .on('mousemove', function(event) {
            moveTooltip(event);
        })
        .on('mouseleave', function() {
            hideTooltip();
        });
}

// Initialize tooltip on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeTooltip();
});

// Profile picture preview
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('profile-picture');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size exceeds 5MB limit');
                    e.target.value = '';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    const previewDiv = document.getElementById('photo-preview');
                    const previewImg = document.getElementById('photo-preview-img');
                    previewImg.src = event.target.result;
                    previewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// ============================================================================
// Multi-Tree Management Functions
// ============================================================================

/**
 * Load all family trees for the current user
 */
async function loadFamilyTrees() {
    try {
        const response = await fetch(`${API_BASE}/api/trees/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load family trees');
        }

        familyTrees = await response.json();

        // Set current tree to default or first tree
        if (!currentTreeId && familyTrees.length > 0) {
            const defaultTree = familyTrees.find(t => t.is_default) || familyTrees[0];
            currentTreeId = defaultTree.id;
        }

        updateTreeSelector();
        await loadPendingSharesCount();
    } catch (error) {
        console.error('Error loading family trees:', error);
    }
}

/**
 * Update the tree selector dropdown with available trees
 */
function updateTreeSelector() {
    const selector = document.getElementById('family-tree-select');
    if (!selector) return;

    selector.innerHTML = '';

    if (familyTrees.length === 0) {
        selector.innerHTML = '<option value="">No trees available</option>';
        return;
    }

    familyTrees.forEach(tree => {
        const option = document.createElement('option');
        option.value = tree.id;
        option.textContent = `${tree.name} (${tree.member_count} members)`;
        if (tree.id === currentTreeId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

/**
 * Switch to a different family tree
 */
async function switchFamilyTree(treeId) {
    currentTreeId = parseInt(treeId);
    await loadFamilyTree();
}

/**
 * Show the tree management modal
 */
function showTreeManagementModal() {
    document.getElementById('tree-management-modal').style.display = 'flex';
    loadTreesList();
}

/**
 * Close the tree management modal
 */
function closeTreeManagementModal() {
    document.getElementById('tree-management-modal').style.display = 'none';
    document.getElementById('create-tree-form').style.display = 'none';
}

/**
 * Show the create tree form
 */
function showCreateTreeForm() {
    document.getElementById('create-tree-form').style.display = 'block';
}

/**
 * Cancel tree creation
 */
function cancelCreateTree() {
    document.getElementById('create-tree-form').style.display = 'none';
    document.getElementById('new-tree-name').value = '';
    document.getElementById('new-tree-description').value = '';
    document.getElementById('new-tree-default').checked = false;
}

/**
 * Create a new family tree
 */
async function createTree() {
    const name = document.getElementById('new-tree-name').value.trim();
    const description = document.getElementById('new-tree-description').value.trim();
    const isDefault = document.getElementById('new-tree-default').checked;
    const errorDiv = document.getElementById('create-tree-error');

    errorDiv.textContent = '';

    if (!name) {
        errorDiv.textContent = 'Please enter a tree name';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/trees/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                description: description || null,
                is_default: isDefault,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create tree');
        }

        const newTree = await response.json();

        cancelCreateTree();
        await loadFamilyTrees();
        loadTreesList();

        // Switch to the new tree
        currentTreeId = newTree.id;
        await loadFamilyTree();
        updateTreeSelector();

        alert('Tree created successfully!');
    } catch (error) {
        console.error('Error creating tree:', error);
        errorDiv.textContent = 'Error: ' + error.message;
    }
}

/**
 * Load and display the list of trees in the management modal
 */
async function loadTreesList() {
    const container = document.getElementById('trees-list');
    if (!container) return;

    container.innerHTML = '<p>Loading trees...</p>';

    try {
        await loadFamilyTrees();

        // Update the "Save Current as New Tree" button state
        const saveCurrentBtn = document.getElementById('save-current-tree-btn');
        if (saveCurrentBtn) {
            const currentTree = familyTrees.find(t => t.id === currentTreeId);
            if (!currentTreeId || !currentTree || currentTree.member_count === 0) {
                saveCurrentBtn.disabled = true;
                saveCurrentBtn.style.opacity = '0.5';
                saveCurrentBtn.title = 'No members in current tree to save';
            } else {
                saveCurrentBtn.disabled = false;
                saveCurrentBtn.style.opacity = '1';
                saveCurrentBtn.title = `Save a copy of "${currentTree.name}" with all ${currentTree.member_count} members`;
            }
        }

        if (familyTrees.length === 0) {
            container.innerHTML = '<p>No family trees yet. Create your first tree!</p>';
            return;
        }

        container.innerHTML = '';

        familyTrees.forEach(tree => {
            const treeCard = document.createElement('div');
            treeCard.className = 'tree-card';

            const ownerText = tree.user_id === currentUser.id ? 'Owner' : 'Shared';
            const defaultBadge = tree.is_default ? '<span class="badge bg-primary ms-2">Default</span>' : '';

            treeCard.innerHTML = `
                <div class="tree-card-header">
                    <h5>${tree.name} ${defaultBadge}</h5>
                    <span class="text-muted">${ownerText}</span>
                </div>
                <p class="tree-card-description">${tree.description || 'No description'}</p>
                <div class="tree-card-stats">
                    <span><i class="bi bi-people"></i> ${tree.member_count} members</span>
                    <span><i class="bi bi-calendar"></i> ${new Date(tree.created_at).toLocaleDateString()}</span>
                </div>
                <div class="tree-card-actions">
                    ${tree.user_id === currentUser.id ? `
                        <button onclick="showRenameModal(${tree.id})" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-pencil"></i> Rename
                        </button>
                        <button onclick="copyTree(${tree.id})" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-files"></i> Copy
                        </button>
                        <button onclick="showShareModal(${tree.id})" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-share"></i> Share
                        </button>
                        <button onclick="deleteTree(${tree.id})" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            `;

            container.appendChild(treeCard);
        });
    } catch (error) {
        container.innerHTML = '<p class="text-danger">Error loading trees</p>';
    }
}

/**
 * Save current tree as a new tree (copy current tree)
 */
async function saveCurrentTreeAs() {
    if (!currentTreeId) {
        alert('No tree is currently selected');
        return;
    }

    const currentTree = familyTrees.find(t => t.id === currentTreeId);
    if (!currentTree) {
        alert('Current tree not found');
        return;
    }

    const newName = prompt(`Enter a name for the new tree (current: "${currentTree.name}"):`, `${currentTree.name} (Copy)`);
    if (!newName || !newName.trim()) return;

    try {
        const response = await fetch(`${API_BASE}/api/trees/${currentTreeId}/copy?new_name=${encodeURIComponent(newName.trim())}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save tree');
        }

        const newTree = await response.json();

        await loadFamilyTrees();
        loadTreesList();

        // Switch to the new tree
        currentTreeId = newTree.id;
        await loadFamilyTree();
        updateTreeSelector();

        alert('Tree saved successfully!');
    } catch (error) {
        alert('Error saving tree: ' + error.message);
    }
}

/**
 * Copy a family tree
 */
async function copyTree(treeId) {
    const tree = familyTrees.find(t => t.id === treeId);
    if (!tree) return;

    const newName = prompt(`Enter a name for the copy of "${tree.name}":`, `${tree.name} (Copy)`);
    if (!newName || !newName.trim()) return;

    try {
        const response = await fetch(`${API_BASE}/api/trees/${treeId}/copy?new_name=${encodeURIComponent(newName.trim())}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to copy tree');
        }

        await loadFamilyTrees();
        loadTreesList();
        alert('Tree copied successfully!');
    } catch (error) {
        alert('Error copying tree: ' + error.message);
    }
}

/**
 * Delete a family tree
 */
async function deleteTree(treeId) {
    const tree = familyTrees.find(t => t.id === treeId);
    if (!tree) return;

    const confirmMessage = `Are you sure you want to delete "${tree.name}"?\n\nThis will permanently delete the tree and all ${tree.member_count} members. This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch(`${API_BASE}/api/trees/${treeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete tree');
        }

        // If we deleted the current tree, switch to another one
        if (currentTreeId === treeId) {
            currentTreeId = null;
        }

        await loadFamilyTrees();
        loadTreesList();

        // Reload the family tree display
        if (currentTreeId) {
            await loadFamilyTree();
        }

        alert('Tree deleted successfully');
    } catch (error) {
        alert('Error deleting tree: ' + error.message);
    }
}

/**
 * Show the share tree modal
 */
function showShareModal(treeId) {
    document.getElementById('share-tree-modal').style.display = 'flex';
    document.getElementById('share-tree-modal').dataset.treeId = treeId;
    document.getElementById('share-username').value = '';
    document.getElementById('share-permission').value = 'view';
}

/**
 * Close the share tree modal
 */
function closeShareTreeModal() {
    document.getElementById('share-tree-modal').style.display = 'none';
    delete document.getElementById('share-tree-modal').dataset.treeId;
}

/**
 * Share a tree with another user
 */
async function shareTree(event) {
    event.preventDefault();

    const treeId = document.getElementById('share-tree-modal').dataset.treeId;
    const username = document.getElementById('share-username').value.trim();
    const permission = document.getElementById('share-permission').value;

    if (!username) {
        alert('Please enter a username');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/trees/${treeId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tree_id: parseInt(treeId),
                shared_with_username: username,
                permission_level: permission,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to share tree');
        }

        closeShareTreeModal();
        alert(`Tree shared successfully with ${username}!`);
    } catch (error) {
        alert('Error sharing tree: ' + error.message);
    }
}

/**
 * Load pending share invitations count
 */
async function loadPendingSharesCount() {
    try {
        const response = await fetch(`${API_BASE}/api/trees/shares/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const shares = await response.json();
        const badge = document.getElementById('pending-shares-badge');

        if (shares.length > 0) {
            badge.textContent = shares.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading pending shares count:', error);
    }
}

/**
 * Show pending share invitations modal
 */
async function showPendingShares() {
    document.getElementById('pending-shares-modal').style.display = 'flex';
    await loadPendingSharesList();
}

/**
 * Close pending shares modal
 */
function closePendingSharesModal() {
    document.getElementById('pending-shares-modal').style.display = 'none';
}

/**
 * Load and display pending share invitations
 */
async function loadPendingSharesList() {
    const container = document.getElementById('pending-shares-list');
    if (!container) return;

    container.innerHTML = '<p>Loading pending shares...</p>';

    try {
        const response = await fetch(`${API_BASE}/api/trees/shares/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load pending shares');
        }

        const shares = await response.json();

        if (shares.length === 0) {
            container.innerHTML = '<p>No pending share invitations</p>';
            return;
        }

        container.innerHTML = '';

        shares.forEach(share => {
            const shareCard = document.createElement('div');
            shareCard.className = 'share-card';

            shareCard.innerHTML = `
                <div class="share-card-header">
                    <h5>${share.tree_name}</h5>
                    <span class="badge bg-info">${share.permission_level}</span>
                </div>
                <p class="share-card-info">
                    Shared by <strong>${share.shared_by_username}</strong>
                    <br>
                    <small class="text-muted">${new Date(share.created_at).toLocaleString()}</small>
                </p>
                <div class="share-card-actions">
                    <button onclick="acceptShare(${share.id})" class="btn btn-sm btn-success">
                        <i class="bi bi-check-circle"></i> Accept
                    </button>
                    <button onclick="declineShare(${share.id})" class="btn btn-sm btn-danger">
                        <i class="bi bi-x-circle"></i> Decline
                    </button>
                </div>
            `;

            container.appendChild(shareCard);
        });
    } catch (error) {
        container.innerHTML = '<p class="text-danger">Error loading pending shares</p>';
    }
}

/**
 * Accept a share invitation
 */
async function acceptShare(shareId) {
    try {
        const response = await fetch(`${API_BASE}/api/trees/shares/${shareId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to accept share');
        }

        await loadFamilyTrees();
        await loadPendingSharesList();
        await loadPendingSharesCount();
        alert('Share accepted! The tree is now available in your tree list.');
    } catch (error) {
        alert('Error accepting share: ' + error.message);
    }
}

/**
 * Decline a share invitation
 */
async function declineShare(shareId) {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/trees/shares/${shareId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to decline share');
        }

        await loadPendingSharesList();
        await loadPendingSharesCount();
        alert('Share invitation declined');
    } catch (error) {
        alert('Error declining share: ' + error.message);
    }
}

// ============================================================================
// Tree Rename/Edit Functions
// ============================================================================

/**
 * Show the rename tree modal
 */
function showRenameModal(treeId) {
    const tree = familyTrees.find(t => t.id === treeId);
    if (!tree) return;

    const modal = document.getElementById('rename-tree-modal');
    modal.style.display = 'flex';
    modal.dataset.treeId = treeId;

    document.getElementById('rename-tree-name').value = tree.name;
    document.getElementById('rename-tree-description').value = tree.description || '';
    document.getElementById('rename-error').textContent = '';
}

/**
 * Close the rename tree modal
 */
function closeRenameTreeModal() {
    const modal = document.getElementById('rename-tree-modal');
    modal.style.display = 'none';
    delete modal.dataset.treeId;
    document.getElementById('rename-tree-name').value = '';
    document.getElementById('rename-tree-description').value = '';
    document.getElementById('rename-error').textContent = '';
}

/**
 * Rename/update a tree
 */
async function renameTree(event) {
    event.preventDefault();

    const modal = document.getElementById('rename-tree-modal');
    const treeId = modal.dataset.treeId;
    const name = document.getElementById('rename-tree-name').value.trim();
    const description = document.getElementById('rename-tree-description').value.trim();
    const errorDiv = document.getElementById('rename-error');

    errorDiv.textContent = '';

    if (!name) {
        errorDiv.textContent = 'Please enter a tree name';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/trees/${treeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                description: description || null,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update tree');
        }

        closeRenameTreeModal();
        await loadFamilyTrees();
        loadTreesList();
        updateTreeSelector();

        alert('Tree updated successfully!');
    } catch (error) {
        console.error('Error updating tree:', error);
        errorDiv.textContent = 'Error: ' + error.message;
    }
}
