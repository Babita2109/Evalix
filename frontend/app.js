const API_BASE = "http://127.0.0.1:8000/api";
let CANDIDATE_ID = localStorage.getItem("evalix_candidate_id") || "CAND_001";

let allSubjects = [];
let allAssessments = [];
let activeAssessment = null;
let selectedAnswers = {};

// --- Auth & Timer State ---
let isLoggedIn = localStorage.getItem("evalix_logged_in") === "true";
let totalPracticeSeconds = parseInt(localStorage.getItem("evalix_practice_seconds") || "0", 10);
let isTimerRunning = false;
let timerIntervalId = null;
let examStartTimestamp = null;

let userProfile = JSON.parse(
    localStorage.getItem("evalix_profile") ||
    JSON.stringify({
        name: "Candidate Profile",
        domain: "Full-Stack / Backend",
        email: "candidate@evalix.in",
        password: "password123",
        visibility: "Public to Recruiters",
        shareAnalytics: true,
        notifyDrives: true,
        notifyReminders: true
    })
);

let growthState = JSON.parse(
    localStorage.getItem("evalix_growth_state") ||
    JSON.stringify({
        testsCompleted: 0,
        overall: 40,
        tracks: {
            "TRK-101": { name: "DSA", progress: 55, timeMins: 25 },
            "TRK-103": { name: "System Design", progress: 50, timeMins: 30 },
            "TRK-201": { name: "C Logic", progress: 45, timeMins: 20 },
            "TRK-202": { name: "C++ STL", progress: 48, timeMins: 20 },
            "TRK-203": { name: "Java", progress: 42, timeMins: 20 },
            "TRK-204": { name: "Python", progress: 60, timeMins: 25 },
            "TRK-105": { name: "Aptitude", progress: 35, timeMins: 15 },
            "TRK-106": { name: "Comm & Pitch", progress: 40, timeMins: 20 }
        }
    })
);

document.addEventListener("DOMContentLoaded", () => {
    injectPortalModals();

    if (isLoggedIn) {
        showDashboardView();
    } else {
        showAuthView();
    }

    document.getElementById("assessmentBtn")?.addEventListener("click", () => openPortalModal("assessments"));

    document.querySelector('a[href="#assessment"]')?.addEventListener("click", (e) => {
        e.preventDefault();
        openPortalModal("assessments");
    });

    document.getElementById("settingsBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        openSettingsModal("account");
    });

    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
    });
});

// ==========================================
// 1. AUTHENTICATION (LOGIN / REGISTER / FORGOT / LOGOUT)
// ==========================================
function switchAuthMode(mode) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotForm = document.getElementById("forgotForm");
    const tabsBar = document.getElementById("authTabsBar");
    const loginBtn = document.getElementById("loginTabBtn");
    const regBtn = document.getElementById("registerTabBtn");

    loginForm.style.display = "none";
    registerForm.style.display = "none";
    forgotForm.style.display = "none";

    if (mode === "login") {
        tabsBar.style.display = "flex";
        loginForm.style.display = "block";
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
    } else if (mode === "register") {
        tabsBar.style.display = "flex";
        registerForm.style.display = "block";
        regBtn.classList.add("active");
        loginBtn.classList.remove("active");
    } else if (mode === "forgot") {
        tabsBar.style.display = "none";
        forgotForm.style.display = "block";
    }
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) return;

    if (userProfile.email === email && userProfile.password && password !== userProfile.password) {
        alert("Incorrect password! Use 'Forgot Password?' if you need to reset it.");
        return;
    }

    if (userProfile.email !== email) {
        const displayName = email.split("@")[0];
        userProfile.name = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        userProfile.email = email;
        userProfile.password = password;
    }

    CANDIDATE_ID = userProfile.email;
    localStorage.setItem("evalix_candidate_id", CANDIDATE_ID);
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    localStorage.setItem("evalix_logged_in", "true");
    isLoggedIn = true;
    showDashboardView();
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const domain = document.getElementById("regDomain").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    userProfile = {
        ...userProfile,
        name: name || "Candidate",
        domain: domain || "Full-Stack / Backend",
        email: email,
        password: password
    };
    CANDIDATE_ID = email;

    localStorage.setItem("evalix_candidate_id", CANDIDATE_ID);
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    localStorage.setItem("evalix_logged_in", "true");
    isLoggedIn = true;
    showDashboardView();
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const newPass = document.getElementById("forgotNewPassword").value;
    const confirmPass = document.getElementById("forgotConfirmPassword").value;

    if (newPass !== confirmPass) {
        alert("Passwords do not match. Please try again.");
        return;
    }

    userProfile.email = email;
    userProfile.password = newPass;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));

    alert("Password updated successfully! Please sign in with your new password.");
    document.getElementById("loginEmail").value = email;
    switchAuthMode("login");
}

function quickDemoLogin() {
    userProfile = {
        ...userProfile,
        name: "Babita Sharma",
        domain: "Full-Stack & Backend",
        email: "babita@evalix.in"
    };
    CANDIDATE_ID = "CAND_001";
    localStorage.setItem("evalix_candidate_id", CANDIDATE_ID);
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    localStorage.setItem("evalix_logged_in", "true");
    isLoggedIn = true;
    showDashboardView();
}

function showAuthView() {
    document.getElementById("authView").style.display = "flex";
    document.getElementById("appView").style.display = "none";
    isTimerRunning = false;
}

function showDashboardView() {
    document.getElementById("authView").style.display = "none";
    document.getElementById("appView").style.display = "flex";
    applyUserProfile();
    isTimerRunning = true;
    startPracticeTimerLoop();
    renderGrowthProgress();
    loadDashboardData();
}

function handleLogout() {
    if (!confirm("Do you want to log out from EVALIX — Skill Track?")) return;
    localStorage.setItem("evalix_logged_in", "false");
    isLoggedIn = false;
    isTimerRunning = false;
    showAuthView();
}

// ==========================================
// 2. PROFILE, TIMER & GROWTH BAR GRAPH
// ==========================================
function applyUserProfile() {
    const nameEl = document.getElementById("studentName");
    const topDomainEl = document.getElementById("topbarDomainTag");
    const welcomeEl = document.getElementById("welcomeHeading");
    const domainEl = document.getElementById("profileDomain");
    const visEl = document.getElementById("profileVisibilityStatus");
    const avatarEl = document.getElementById("avatarInitials");

    if (nameEl) nameEl.textContent = userProfile.name;
    if (topDomainEl) topDomainEl.textContent = userProfile.domain;
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${userProfile.name}! 👋`;
    if (domainEl) domainEl.textContent = userProfile.domain;
    if (visEl) visEl.textContent = userProfile.visibility || "Public to Recruiters";

    if (avatarEl && userProfile.name) {
        const parts = userProfile.name.trim().split(" ");
        avatarEl.textContent = parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : userProfile.name.slice(0, 2).toUpperCase();
    }
}

function formatDuration(sec) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remSec = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${remSec}s`;
    return `${String(mins).padStart(2, "0")}m ${String(remSec).padStart(2, "0")}s`;
}

function startPracticeTimerLoop() {
    updateTimerDisplay();
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(() => {
        if (!isTimerRunning) return;
        totalPracticeSeconds += 1;
        localStorage.setItem("evalix_practice_seconds", String(totalPracticeSeconds));
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const formatted = formatDuration(totalPracticeSeconds);
    const topEl = document.getElementById("practiceTime");
    const cardEl = document.getElementById("practiceCardTime");
    if (topEl) topEl.textContent = formatted;
    if (cardEl) cardEl.textContent = formatted;
}

function togglePracticeTimer() {
    isTimerRunning = !isTimerRunning;
    const btn = document.getElementById("toggleTimerBtn");
    if (btn) btn.textContent = isTimerRunning ? "Pause" : "Resume";
}

function renderGrowthProgress() {
    const overall = Math.min(100, growthState.overall);
    document.getElementById("overallGrowth").textContent = `${overall}%`;
    document.getElementById("overallGrowthLabel").textContent = `${overall}%`;
    document.getElementById("overallGrowthBar").style.width = `${overall}%`;
    document.getElementById("testsCompleted").textContent = growthState.testsCompleted;

    const badgeEl = document.getElementById("growthLevelBadge");
    if (badgeEl) {
        if (overall >= 80) badgeEl.textContent = "Stage: Hiring Ready";
        else if (overall >= 55) badgeEl.textContent = "Stage: Interview Contender";
        else badgeEl.textContent = "Stage: Rising Builder";
    }

    const trackList = Object.values(growthState.tracks);

    const chartArea = document.getElementById("growthBarChart");
    const labelsArea = document.getElementById("growthBarLabels");
    if (chartArea && labelsArea) {
        chartArea.innerHTML = trackList
            .map(
                (t) => `
            <div class="bar-col">
                <span class="bar-value">${t.progress}%</span>
                <div class="bar-stick" style="height: ${Math.max(10, t.progress)}%;" title="${t.name}: ${t.progress}%"></div>
            </div>`
            )
            .join("");

        labelsArea.innerHTML = trackList
            .map((t) => `<span>${t.name}</span>`)
            .join("");
    }

    const grid = document.getElementById("trackGrowthGrid");
    if (grid) {
        grid.innerHTML = trackList
            .map(
                (t) => `
            <div class="growth-box">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
                    <strong>${t.name}</strong>
                    <strong style="color:#2563eb;">${t.progress}%</strong>
                </div>
                <div class="progress" style="height:8px; margin-bottom:6px;">
                    <div class="progress-fill" style="width:${t.progress}%;"></div>
                </div>
                <small style="color:#64748b;">⏱ Practiced: ${t.timeMins} mins</small>
            </div>`
            )
            .join("");
    }
}

// ==========================================
// 3. BACKEND API INTEGRATION
// ==========================================
async function loadDashboardData() {
    try {
        const [subjects, assessments, plans, drives, applications] = await Promise.all([
            fetch(`${API_BASE}/subjects`).then((r) => r.json()),
            fetch(`${API_BASE}/assessments`).then((r) => r.json()),
            fetch(`${API_BASE}/improvement-plan?candidate_id=CAND_001`).then((r) => r.json()),
            fetch(`${API_BASE}/drives`).then((r) => r.json()),
            fetch(`${API_BASE}/applications?candidate_id=${CANDIDATE_ID}`).then((r) => r.json()),
        ]);

        allSubjects = Array.isArray(subjects) ? subjects : [];
        allAssessments = Array.isArray(assessments) ? assessments : [];

        renderImprovementPlan(plans);
        renderDrivesAndEligibility(drives, applications);
        renderApplications(applications);
    } catch (err) {
        console.error("Backend connection error:", err);
    }
}

function renderImprovementPlan(plans) {
    const section = document.getElementById("analysis");
    if (!section || !Array.isArray(plans) || plans.length === 0) return;

    const header = section.querySelector(".card-header").outerHTML;
    const itemsHtml = plans
        .map((p) => {
            const badgeClass = p.priority.toLowerCase().includes("high") ? "high" : "medium";
            return `
            <div class="gap-item">
                <div>
                    <strong>${p.skill_name}</strong>
                    <p>${p.action_text}</p>
                </div>
                <span class="priority ${badgeClass}">${p.priority}</span>
            </div>`;
        })
        .join("");

    section.innerHTML = header + itemsHtml;
}

function renderDrivesAndEligibility(drives, applications) {
    const companiesCard = document.getElementById("companies");
    const drivesCard = document.getElementById("drives");
    const eligibleCountEl = document.getElementById("eligibleCount");

    if (!Array.isArray(drives) || drives.length === 0) return;
    if (eligibleCountEl) eligibleCountEl.textContent = drives.length;

    const appliedIds = new Set((applications || []).map((a) => a.job_id));

    if (companiesCard) {
        const header = companiesCard.querySelector(".card-header").outerHTML;
        const listHtml = drives
            .map(
                (d) => `
            <div class="company-item">
                <div>
                    <strong>${d.company_name} — ${d.role_title}</strong>
                    <small>Required Skills: ${d.required_skills}</small>
                </div>
                <span class="eligible">${d.package_lpa}</span>
            </div>`
            )
            .join("");
        companiesCard.innerHTML = header + listHtml;
    }

    if (drivesCard) {
        const header = drivesCard.querySelector(".card-header").outerHTML;
        const drivesHtml = drives
            .map((d) => {
                const isApplied = appliedIds.has(d.id);
                return `
                <div class="company-item" style="margin-top: 12px;">
                    <div>
                        <strong>${d.company_name} (${d.role_title})</strong>
                        <small>Package: ${d.package_lpa} • Drive Date: ${d.drive_date}</small>
                    </div>
                    <button 
                        class="primary-btn" 
                        style="padding: 8px 14px; font-size: 13px; ${isApplied ? "background:#16a34a !important;cursor:default;" : ""}"
                        ${isApplied ? "disabled" : `onclick="applyForDrive('${d.id}')"`}
                    >
                        ${isApplied ? "✓ Applied" : "Apply Now"}
                    </button>
                </div>`;
            })
            .join("");
        drivesCard.innerHTML = header + drivesHtml;
    }
}

async function applyForDrive(jobId) {
    try {
        const res = await fetch(`${API_BASE}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                candidate_id: CANDIDATE_ID,
                candidate_name: userProfile.name,
                job_id: jobId,
            }),
        });
        const data = await res.json();
        if (data.success) loadDashboardData();
    } catch (err) {
        alert("Failed to submit application. Check backend connection.");
    }
}

function renderApplications(applications) {
    const appCard = document.getElementById("applications");
    const appCountEl = document.getElementById("applicationCount");
    if (!Array.isArray(applications)) return;

    if (appCountEl) appCountEl.textContent = applications.length;
    if (!appCard) return;

    const header = appCard.querySelector(".card-header").outerHTML;
    if (applications.length === 0) {
        appCard.innerHTML = header + `<p>You have not applied to any company yet.</p>`;
        return;
    }

    const appsHtml = applications
        .map(
            (a) => `
        <div class="company-item" style="margin-top: 10px;">
            <div>
                <strong>${a.company_name} — ${a.role_title}</strong>
                <small>Package: ${a.package_lpa}</small>
            </div>
            <span class="eligible">${a.application_status}</span>
        </div>`
        )
        .join("");
    appCard.innerHTML = header + appsHtml;
}

// ==========================================
// 4. SETTINGS & PRIVACY CENTER + ASSESSMENTS MODAL
// ==========================================
function injectPortalModals() {
    if (!document.getElementById("skilltrackModal")) {
        document.body.insertAdjacentHTML(
            "beforeend",
            `
        <div id="skilltrackModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.72); z-index:9999; align-items:center; justify-content:center; padding:20px;">
            <div style="background:#ffffff; width:100%; max-width:860px; max-height:88vh; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.25);">
                <div style="padding:16px 24px; background:linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #881337 100%); color:#fff; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; font-size:18px;">EVALIX — Skill Track</h3>
                        <small style="color:#e2e8f0;">Learn • Practice • Grow | Technical, Logic Building & Interview Prep</small>
                    </div>
                    <button onclick="closePortalModal()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
                </div>

                <div style="display:flex; gap:10px; padding:12px 24px; background:#f8fafc; border-bottom:1px solid #e2e8f0; flex-wrap:wrap;">
                    <button id="tabAssessments" onclick="switchModalTab('assessments')" class="primary-btn" style="padding:8px 14px; font-size:13px;">📝 Assessments & MCQs</button>
                    <button id="tabSyllabus" onclick="switchModalTab('syllabus')" class="primary-btn" style="padding:8px 14px; font-size:13px; opacity:0.75;">📚 All Subjects & Languages Syllabus</button>
                    <button id="tabIntro" onclick="switchModalTab('intro')" class="primary-btn" style="padding:8px 14px; font-size:13px; opacity:0.75;">🎤 Self-Introduction Guide</button>
                </div>

                <div id="modalBody" style="padding:24px; overflow-y:auto; flex:1; line-height:1.6; color:#1e293b;"></div>
            </div>
        </div>`
        );
    }

    if (!document.getElementById("settingsModal")) {
        document.body.insertAdjacentHTML(
            "beforeend",
            `
        <div id="settingsModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.75); z-index:9999; align-items:center; justify-content:center; padding:20px;">
            <div style="background:#ffffff; width:100%; max-width:780px; max-height:86vh; border-radius:16px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.3);">
                <div style="padding:16px 24px; background:linear-gradient(135deg, #0b1120 0%, #2563eb 55%, #f43f5e 100%); color:#fff; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; font-size:18px;">⚙ Settings & Privacy</h3>
                        <small style="color:#e2e8f0;">Manage your EVALIX account, security, visibility & preferences</small>
                    </div>
                    <button onclick="closeSettingsModal()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns:220px 1fr; flex:1; overflow:hidden;">
                    <div style="background:#f8fafc; border-right:1px solid #e2e8f0; padding:16px 12px; display:flex; flex-direction:column; gap:6px; overflow-y:auto;">
                        <button class="sp-nav-btn active" id="sp_tab_account" onclick="switchSettingsTab('account')">👤 Account Preferences</button>
                        <button class="sp-nav-btn" id="sp_tab_security" onclick="switchSettingsTab('security')">🔒 Sign In & Security</button>
                        <button class="sp-nav-btn" id="sp_tab_visibility" onclick="switchSettingsTab('visibility')">👁 Visibility</button>
                        <button class="sp-nav-btn" id="sp_tab_privacy" onclick="switchSettingsTab('privacy')">🛡 Data Privacy</button>
                        <button class="sp-nav-btn" id="sp_tab_notifications" onclick="switchSettingsTab('notifications')">🔔 Notifications</button>
                        <button class="sp-nav-btn" id="sp_tab_help" onclick="switchSettingsTab('help')">❓ Help Center</button>
                    </div>

                    <div id="settingsBody" style="padding:24px; overflow-y:auto; color:#1e293b; line-height:1.6;"></div>
                </div>
            </div>
        </div>`
        );
    }
}

function openSettingsModal(defaultTab = "account") {
    document.getElementById("settingsModal").style.display = "flex";
    switchSettingsTab(defaultTab);
}

function closeSettingsModal() {
    document.getElementById("settingsModal").style.display = "none";
}

function switchSettingsTab(tab) {
    ["account", "security", "visibility", "privacy", "notifications", "help"].forEach((t) => {
        document.getElementById(`sp_tab_${t}`)?.classList.remove("active");
    });
    document.getElementById(`sp_tab_${tab}`)?.classList.add("active");

    const body = document.getElementById("settingsBody");

    if (tab === "account") {
        body.innerHTML = `
            <h3 style="margin-top:0;">Account Preferences</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Update your display name and primary skill domain.</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <label style="font-size:13px; font-weight:600;">Full Name
                    <input id="sp_name" type="text" value="${userProfile.name}" style="width:100%; padding:9px; margin-top:4px; border:1px solid #cbd5e1; border-radius:6px;" />
                </label>
                <label style="font-size:13px; font-weight:600;">Primary Skill Domain
                    <input id="sp_domain" type="text" value="${userProfile.domain}" style="width:100%; padding:9px; margin-top:4px; border:1px solid #cbd5e1; border-radius:6px;" />
                </label>
                <button onclick="saveAccountPrefs()" class="primary-btn" style="padding:10px; margin-top:6px;">Save Account Preferences</button>
            </div>`;
    } else if (tab === "security") {
        body.innerHTML = `
            <h3 style="margin-top:0;">Sign In & Security</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Manage your login credentials and password.</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <label style="font-size:13px; font-weight:600;">Registered Email
                    <input id="sp_email" type="email" value="${userProfile.email}" style="width:100%; padding:9px; margin-top:4px; border:1px solid #cbd5e1; border-radius:6px;" />
                </label>
                <label style="font-size:13px; font-weight:600;">New Password
                    <input id="sp_newpass" type="password" placeholder="Leave blank to keep current password" style="width:100%; padding:9px; margin-top:4px; border:1px solid #cbd5e1; border-radius:6px;" />
                </label>
                <button onclick="saveSecurityPrefs()" class="primary-btn" style="padding:10px; margin-top:6px;">Update Sign In & Security</button>
            </div>`;
    } else if (tab === "visibility") {
        body.innerHTML = `
            <h3 style="margin-top:0;">Profile Visibility</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Control who can view your Skill Track readiness score and applications.</p>
            <label style="font-size:13px; font-weight:600; display:block; margin-bottom:12px;">Profile Discoverability
                <select id="sp_visibility" style="width:100%; padding:10px; margin-top:6px; border:1px solid #cbd5e1; border-radius:6px; background:#fff;">
                    <option value="Public to Recruiters" ${userProfile.visibility === "Public to Recruiters" ? "selected" : ""}>Public to Recruiters & Hiring Drives</option>
                    <option value="Applied Companies Only" ${userProfile.visibility === "Applied Companies Only" ? "selected" : ""}>Visible Only to Companies I Apply To</option>
                    <option value="Private Practice Mode" ${userProfile.visibility === "Private Practice Mode" ? "selected" : ""}>Private (Self-Practice Mode Only)</option>
                </select>
            </label>
            <button onclick="saveVisibilityPrefs()" class="primary-btn" style="padding:10px 18px;">Save Visibility Settings</button>`;
    } else if (tab === "privacy") {
        body.innerHTML = `
            <h3 style="margin-top:0;">Data Privacy</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Manage how your practice timer and assessment history are stored.</p>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; margin-bottom:16px; cursor:pointer;">
                <input id="sp_analytics" type="checkbox" ${userProfile.shareAnalytics ? "checked" : ""} />
                <span>Use my assessment scores to personalize my Skill Improvement Plan</span>
            </label>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button onclick="savePrivacyPrefs()" class="primary-btn" style="padding:10px 16px;">Save Privacy Preferences</button>
                <button onclick="resetPracticeStats()" style="background:#fee2e2; color:#b91c1c; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer;">Reset Practice Timer</button>
            </div>`;
    } else if (tab === "notifications") {
        body.innerHTML = `
            <h3 style="margin-top:0;">Notifications</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Choose which alerts you receive on EVALIX.</p>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; margin-bottom:12px; cursor:pointer;">
                <input id="sp_notif_drives" type="checkbox" ${userProfile.notifyDrives ? "checked" : ""} />
                <span>New Hiring & Placement Drive Alerts</span>
            </label>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; margin-bottom:18px; cursor:pointer;">
                <input id="sp_notif_rem" type="checkbox" ${userProfile.notifyReminders ? "checked" : ""} />
                <span>Daily Practice & Assessment Reminders</span>
            </label>
            <button onclick="saveNotifPrefs()" class="primary-btn" style="padding:10px 18px;">Save Notification Settings</button>`;
    } else if (tab === "help") {
        body.innerHTML = `
            <h3 style="margin-top:0;">EVALIX Help Center</h3>
            <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:12px; border-radius:6px; margin-bottom:12px;">
                <strong>1. How does Growth & Graph tracking work?</strong>
                <p style="margin:4px 0 0 0; font-size:13px; color:#475569;">Every second you practice and every assessment you complete automatically updates your Growth Velocity bar chart and readiness score.</p>
            </div>
            <div style="background:#f8fafc; border-left:4px solid #f43f5e; padding:12px; border-radius:6px; margin-bottom:12px;">
                <strong>2. How do I apply to companies?</strong>
                <p style="margin:4px 0 0 0; font-size:13px; color:#475569;">Scroll down to Upcoming Hiring & Placement Drives and click Apply Now on any open drive.</p>
            </div>
            <p style="font-size:13px; color:#64748b;">Need technical assistance? Contact: <strong>support@evalix-skilltrack.in</strong></p>`;
    }
}

function saveAccountPrefs() {
    userProfile.name = document.getElementById("sp_name").value.trim() || userProfile.name;
    userProfile.domain = document.getElementById("sp_domain").value.trim() || userProfile.domain;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    applyUserProfile();
    alert("Account preferences saved!");
}

function saveSecurityPrefs() {
    const newEmail = document.getElementById("sp_email").value.trim();
    const newPass = document.getElementById("sp_newpass").value;
    if (newEmail) userProfile.email = newEmail;
    if (newPass) userProfile.password = newPass;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    alert("Sign In & Security settings updated!");
}

function saveVisibilityPrefs() {
    userProfile.visibility = document.getElementById("sp_visibility").value;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    applyUserProfile();
    alert("Visibility updated!");
}

function savePrivacyPrefs() {
    userProfile.shareAnalytics = document.getElementById("sp_analytics").checked;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    alert("Data Privacy preferences saved!");
}

function saveNotifPrefs() {
    userProfile.notifyDrives = document.getElementById("sp_notif_drives").checked;
    userProfile.notifyReminders = document.getElementById("sp_notif_rem").checked;
    localStorage.setItem("evalix_profile", JSON.stringify(userProfile));
    alert("Notification preferences saved!");
}

function resetPracticeStats() {
    totalPracticeSeconds = 0;
    localStorage.setItem("evalix_practice_seconds", "0");
    updateTimerDisplay();
    alert("Practice timer reset to 00m 00s.");
}

function openPortalModal(defaultTab = "assessments") {
    const modal = document.getElementById("skilltrackModal");
    if (!modal) return;
    modal.style.display = "flex";
    switchModalTab(defaultTab);
}

function closePortalModal() {
    const modal = document.getElementById("skilltrackModal");
    if (modal) modal.style.display = "none";
    activeAssessment = null;
}

function switchModalTab(tab) {
    ["tabAssessments", "tabSyllabus", "tabIntro"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = "0.65";
    });

    if (tab === "assessments") {
        document.getElementById("tabAssessments").style.opacity = "1";
        renderAssessmentList();
    } else if (tab === "syllabus") {
        document.getElementById("tabSyllabus").style.opacity = "1";
        renderSyllabusList();
    } else if (tab === "intro") {
        document.getElementById("tabIntro").style.opacity = "1";
        renderSelfIntroGuide();
    }
}

function renderAssessmentList() {
    const body = document.getElementById("modalBody");
    if (!allAssessments.length) {
        body.innerHTML = `<p>No assessments loaded. Please run <code>POST /api/seed</code> on backend first.</p>`;
        return;
    }

    body.innerHTML = allAssessments
        .map(
            (a) => `
        <div style="border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
            <div>
                <h4 style="margin:0 0 4px 0;">${a.title}</h4>
                <small style="color:#64748b;">Track: ${a.subject_code} • Duration: ${a.duration_minutes} mins • Marks: ${a.total_marks}</small>
            </div>
            <button onclick="startExam('${a.id}')" class="primary-btn" style="padding:8px 16px; font-size:13px; white-space:nowrap;">Start Test</button>
        </div>`
        )
        .join("");
}

function startExam(assessmentId) {
    activeAssessment = allAssessments.find((a) => a.id === assessmentId);
    selectedAnswers = {};
    examStartTimestamp = Date.now();
    if (!activeAssessment) return;

    const body = document.getElementById("modalBody");
    const questionsHtml = activeAssessment.questions
        .map((q, idx) => {
            if (q.question_type === "MCQ") {
                const opts = q.options
                    .map(
                        (opt) => `
                    <label style="display:block; padding:8px 12px; margin:6px 0; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;">
                        <input type="radio" name="q_${q.q_id}" value="${opt}" onchange="recordAnswer('${q.q_id}', '${opt.replace(/'/g, "\\'")}')" />
                        <span style="margin-left:8px;">${opt}</span>
                    </label>`
                    )
                    .join("");
                return `
                <div style="margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid #e2e8f0;">
                    <p style="font-weight:600; margin-bottom:8px;">Q${idx + 1}. ${q.question_text} <span style="color:#64748b; font-size:12px;">(${q.marks} Marks)</span></p>
                    ${opts}
                </div>`;
            } else {
                return `
                <div style="margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid #e2e8f0;">
                    <p style="font-weight:600; margin-bottom:8px;">Q${idx + 1}. ${q.question_text} <span style="color:#64748b; font-size:12px;">(Interview / Descriptive • ${q.marks} Marks)</span></p>
                    <textarea rows="3" placeholder="Write your solution or explanation here..." oninput="recordAnswer('${q.q_id}', this.value)" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;"></textarea>
                </div>`;
            }
        })
        .join("");

    body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0;">${activeAssessment.title}</h3>
            <button onclick="renderAssessmentList()" style="background:#e2e8f0; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">← Back</button>
        </div>
        ${questionsHtml}
        <button onclick="submitActiveExam()" class="primary-btn" style="width:100%; padding:12px; font-size:15px;">Submit Assessment</button>
    `;
}

function recordAnswer(qId, value) {
    selectedAnswers[String(qId)] = value;
}

async function submitActiveExam() {
    if (!activeAssessment) return;
    const elapsedSec = examStartTimestamp ? Math.max(1, Math.round((Date.now() - examStartTimestamp) / 1000)) : 60;
    const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));

    try {
        const res = await fetch(`${API_BASE}/assessments/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                candidate_id: CANDIDATE_ID,
                assessment_id: activeAssessment.id,
                answers: selectedAnswers,
            }),
        });
        const result = await res.json();
        const percentage = Math.round((result.score / result.total_marks) * 100);

        const readinessEl = document.getElementById("readiness");
        if (readinessEl) readinessEl.textContent = `${percentage}%`;

        growthState.testsCompleted += 1;
        growthState.overall = Math.min(100, growthState.overall + Math.max(5, Math.round(percentage * 0.15)));
        const trackObj = growthState.tracks[activeAssessment.subject_code];
        if (trackObj) {
            trackObj.progress = Math.min(100, Math.max(trackObj.progress + 12, percentage));
            trackObj.timeMins += elapsedMins;
        }
        localStorage.setItem("evalix_growth_state", JSON.stringify(growthState));
        renderGrowthProgress();

        document.getElementById("modalBody").innerHTML = `
            <div style="text-align:center; padding:30px 10px;">
                <h2 style="color:#2563eb; margin-bottom:8px;">Assessment Completed!</h2>
                <p style="font-size:18px; font-weight:600;">Score: ${result.score} / ${result.total_marks} (${percentage}%)</p>
                <p style="color:#f43f5e; font-weight:600;">⏱ Time Taken: ${formatDuration(elapsedSec)} (Graph & Growth Updated!)</p>
                <button onclick="renderAssessmentList()" class="primary-btn" style="margin-top:16px;">Take Another Assessment</button>
            </div>`;
    } catch (err) {
        alert("Error submitting exam. Ensure FastAPI server is running.");
    }
}

function renderSyllabusList() {
    const body = document.getElementById("modalBody");
    if (!allSubjects.length) {
        body.innerHTML = `<p>No syllabus found. Run <code>POST /api/seed</code> first.</p>`;
        return;
    }

    body.innerHTML = allSubjects
        .map((sub) => {
            const topicsHtml = (sub.topics || [])
                .map(
                    (t) => `
                <li style="margin-bottom:8px;">
                    <strong>${t.title}:</strong> <span style="color:#475569;">${t.syllabus_details}</span>
                </li>`
                )
                .join("");

            return `
            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <h4 style="margin:0; color:#1e293b;">${sub.subject_code} — ${sub.name}</h4>
                    <span style="background:rgba(37,99,235,0.1); color:#2563eb; padding:2px 10px; border-radius:12px; font-size:12px; white-space:nowrap;">${sub.category || "Core"}</span>
                </div>
                <p style="color:#64748b; font-size:13px; margin:6px 0 12px 0;">${sub.description}</p>
                <ul style="padding-left:18px; margin:0;">${topicsHtml}</ul>
            </div>`;
        })
        .join("");
}

function renderSelfIntroGuide() {
    const body = document.getElementById("modalBody");
    const commSubject = allSubjects.find((s) => s.subject_code === "TRK-106");
    const introTopic = commSubject?.topics?.[0];

    if (!introTopic) {
        body.innerHTML = `<p>Communication module not loaded yet. Run <code>POST /api/seed</code> on backend.</p>`;
        return;
    }

    const tipsHtml = (introTopic.best_practices || [])
        .map((tip) => `<li style="margin-bottom:6px;">${tip}</li>`)
        .join("");

    body.innerHTML = `
        <h3 style="margin-top:0; color:#1e293b;">${introTopic.title}</h3>
        <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:14px; border-radius:6px; margin-bottom:16px;">
            <strong>Framework:</strong>
            <p style="margin:6px 0 0 0; color:#334155;">${introTopic.syllabus_details}</p>
        </div>

        <div style="background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.25); padding:14px; border-radius:8px; margin-bottom:16px;">
            <strong style="color:#1e40af;">Sample Pitch — Template 1 (XYZ):</strong>
            <p style="margin:6px 0 0 0; color:#1e293b; font-style:italic;">"${introTopic.sample_fresher_intro}"</p>
        </div>

        <div style="background:rgba(244,63,94,0.06); border:1px solid rgba(244,63,94,0.25); padding:14px; border-radius:8px; margin-bottom:16px;">
            <strong style="color:#be123c;">Sample Pitch — Template 2 (XYZ):</strong>
            <p style="margin:6px 0 0 0; color:#1e293b; font-style:italic;">"${introTopic.sample_experienced_intro}"</p>
        </div>

        <h4>Key Delivery Best Practices:</h4>
        <ul style="padding-left:20px; color:#334155;">${tipsHtml}</ul>
    `;
}