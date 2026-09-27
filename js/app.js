const DATA_URL = "data/data.json";
const GRADE_ORDER = ["A", "B", "C", "D", "F"];
const studentsBody = document.querySelector("#student-rows");
const filtersForm = document.querySelector("#filters");
const searchInput = document.querySelector("#search");
const departmentFilter = document.querySelector("#department-filter");
const gradeFilter = document.querySelector("#grade-filter");
const statusFilter = document.querySelector("#status-filter");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const loadError = document.querySelector("#load-error");
const studentDialog = document.querySelector("#student-dialog");
let students = [];
let appliedFilters = { query: "", department: "", grade: "", status: "" };
let currentSort = { key: "name", direction: "asc" };

async function loadStudents() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Student data request failed (${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Student data has an invalid format");
    students = data;
    document.querySelector("#about-count").textContent = students.length;
    populateFilters();
    renderDashboard();
  } catch {
    resultCount.textContent = "Data unavailable";
    document.querySelector("#section-count").textContent = "Data unavailable";
    loadError.hidden = false;
  }
}

function populateFilters() {
  const departments = [...new Set(students.map(({ department }) => department))].sort();
  const grades = [...new Set(students.map(({ grade }) => grade))].sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));
  addOptions(departmentFilter, departments);
  addOptions(gradeFilter, grades);
}

function addOptions(select, values) {
  const fragment = document.createDocumentFragment();
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    fragment.append(option);
  });
  select.append(fragment);
}

function getVisibleStudents() {
  const visible = students.filter((student) =>
    student.name.toLocaleLowerCase().includes(appliedFilters.query) &&
    (!appliedFilters.department || student.department === appliedFilters.department) &&
    (!appliedFilters.grade || student.grade === appliedFilters.grade) &&
    (!appliedFilters.status || student.status === appliedFilters.status)
  );
  const factor = currentSort.direction === "desc" ? -1 : 1;
  return visible.sort((a, b) => currentSort.key === "name"
    ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) * factor
    : (a[currentSort.key] - b[currentSort.key]) * factor);
}

function renderDashboard() {
  const visible = getVisibleStudents();
  renderStatistics(visible);
  renderTable(visible);
  renderChart(visible);
  renderGradeSnapshot(visible, "grade-snapshot");
  renderTopStudents(visible);
  renderAnalytics(visible);
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? "student" : "students"} displayed`;
  document.querySelector("#section-count").textContent = `${visible.length} ${visible.length === 1 ? "record" : "records"}`;
  emptyState.hidden = visible.length > 0;
  updateSortButtons();
}

function renderStatistics(visible) {
  const average = mean(visible, "marks");
  const passCount = visible.filter((student) => student.status === "Pass").length;
  const top = visible.reduce((best, student) => !best || student.marks > best.marks ? student : best, null);
  document.querySelector("#total-students").textContent = visible.length;
  document.querySelector("#average-score").textContent = visible.length ? `${average.toFixed(1)}%` : "—";
  document.querySelector("#pass-rate").textContent = visible.length ? `${Math.round((passCount / visible.length) * 100)}%` : "—";
  document.querySelector("#top-performer").textContent = top ? top.name : "—";
  document.querySelector("#top-performer-foot").textContent = top ? `${top.marks} points · ${top.department}` : "No students in selection";
}

function renderTable(visible) {
  const fragment = document.createDocumentFragment();
  visible.forEach((student) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const identity = document.createElement("div");
    identity.className = "student-cell";
    const avatar = document.createElement("span");
    avatar.className = `student-avatar tone-${student.id % 5}`;
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = getInitials(student.name);
    const name = document.createElement("span");
    name.textContent = student.name;
    identity.append(avatar, name);
    nameCell.append(identity);
    row.append(nameCell, makeCell(student.department), makeCell(`Semester ${student.semester}`), makeCell(`${student.marks}%`, "score-cell"), makeCell(`${student.attendance}%`));
    const gradeCell = document.createElement("td");
    const gradeBadge = document.createElement("span");
    gradeBadge.className = "grade-badge";
    gradeBadge.textContent = student.grade;
    gradeCell.append(gradeBadge);
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${student.status === "Pass" ? "pass" : "fail"}`;
    statusBadge.textContent = student.status === "Pass" ? "Passing" : "Needs support";
    statusCell.append(statusBadge);
    const actionCell = document.createElement("td");
    const detailsButton = document.createElement("button");
    detailsButton.className = "details-button";
    detailsButton.type = "button";
    detailsButton.dataset.studentId = student.id;
    detailsButton.textContent = "View details";
    detailsButton.setAttribute("aria-label", `View details for ${student.name}`);
    actionCell.append(detailsButton);
    row.append(gradeCell, statusCell, actionCell);
    fragment.append(row);
  });
  studentsBody.replaceChildren(fragment);
}

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function getInitials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

function renderChart(visible) {
  const container = document.querySelector("#chart-container");
  const bins = [0, 0, 0, 0, 0];
  visible.forEach(({ marks }) => { bins[Math.min(4, Math.floor(marks / 20))] += 1; });
  const labels = ["0–19", "20–39", "40–59", "60–79", "80–100"];
  const width = 560;
  const height = 190;
  const left = 35;
  const top = 12;
  const chartHeight = 132;
  const baseY = top + chartHeight;
  const maxValue = Math.max(4, ...bins);
  const barWidth = 48;
  const gap = (width - left - 12 - barWidth * bins.length) / (bins.length - 1);
  const grid = [0, 1, 2, 3].map((step) => {
    const y = top + (chartHeight / 3) * step;
    const value = Math.ceil(maxValue) - Math.round((maxValue / 3) * step);
    return `<line class="chart-gridline" x1="${left}" x2="${width - 8}" y1="${y}" y2="${y}"/><text class="chart-label" x="${left - 9}" y="${y + 3}" text-anchor="end">${value}</text>`;
  }).join("");
  const bars = bins.map((count, index) => {
    const x = left + index * (barWidth + gap);
    const barHeight = count ? Math.max(3, (count / maxValue) * chartHeight) : 0;
    const y = baseY - barHeight;
    return `<g><rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4"><title>${labels[index]} points: ${count} ${count === 1 ? "student" : "students"}</title></rect><text class="chart-label" x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${labels[index]}</text></g>`;
  }).join("");
  const description = labels.map((label, index) => `${label} points: ${bins[index]} students`).join("; ");
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Student score distribution. ${description}">${grid}${bars}</svg>`;
}

function renderGradeSnapshot(visible, targetId) {
  const counts = Object.fromEntries(GRADE_ORDER.map((grade) => [grade, 0]));
  visible.forEach(({ grade }) => { counts[grade] = (counts[grade] || 0) + 1; });
  const container = document.getElementById(targetId);
  const fragment = document.createDocumentFragment();
  GRADE_ORDER.forEach((grade) => {
    const count = counts[grade] || 0;
    const percent = visible.length ? Math.round((count / visible.length) * 100) : 0;
    const row = document.createElement("div");
    row.className = "grade-row";
    const label = document.createElement("span");
    label.className = "grade-label";
    label.textContent = grade;
    const track = document.createElement("div");
    track.className = "grade-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `Grade ${grade}: ${percent}%`);
    const fill = document.createElement("div");
    fill.className = `grade-fill grade-${grade.toLowerCase()}`;
    fill.style.width = `${percent}%`;
    track.append(fill);
    const value = document.createElement("span");
    value.className = "grade-percent";
    value.textContent = `${percent}%`;
    row.append(label, track, value);
    fragment.append(row);
  });
  container.replaceChildren(fragment);
}

function renderTopStudents(visible) {
  const container = document.querySelector("#top-students");
  const fragment = document.createDocumentFragment();
  const leaders = [...visible].sort((a, b) => b.marks - a.marks).slice(0, 3);
  leaders.forEach((student, index) => {
    const card = document.createElement("article");
    card.className = "leader-card";
    const rank = document.createElement("span");
    rank.className = "leader-rank";
    rank.textContent = `0${index + 1}`;
    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = student.name;
    const department = document.createElement("span");
    department.textContent = student.department;
    info.append(name, department);
    const marks = document.createElement("strong");
    marks.className = "leader-marks";
    marks.textContent = `${student.marks}%`;
    const button = document.createElement("button");
    button.className = "details-button";
    button.type = "button";
    button.dataset.studentId = student.id;
    button.setAttribute("aria-label", `View details for ${student.name}`);
    button.textContent = "View details";
    card.append(rank, info, marks, button);
    fragment.append(card);
  });
  if (!leaders.length) {
    const empty = document.createElement("p");
    empty.className = "leader-empty";
    empty.textContent = "Apply filters with matching students to see leading results.";
    fragment.append(empty);
  }
  container.replaceChildren(fragment);
}

function mean(list, key) {
  return list.length ? list.reduce((sum, item) => sum + item[key], 0) / list.length : 0;
}

function renderAnalytics(visible) {
  const high = visible.reduce((best, student) => !best || student.marks > best.marks ? student : best, null);
  const low = visible.reduce((worst, student) => !worst || student.marks < worst.marks ? student : worst, null);
  const passCount = visible.filter((student) => student.status === "Pass").length;
  const passRate = visible.length ? Math.round((passCount / visible.length) * 100) : 0;
  const attendance = mean(visible, "attendance");
  document.querySelector("#analytics-average").textContent = visible.length ? `${mean(visible, "marks").toFixed(1)}%` : "—";
  document.querySelector("#analytics-high").textContent = high ? `${high.marks}%` : "—";
  document.querySelector("#analytics-high-name").textContent = high ? high.name : "No students in selection";
  document.querySelector("#analytics-low").textContent = low ? `${low.marks}%` : "—";
  document.querySelector("#analytics-low-name").textContent = low ? low.name : "No students in selection";
  document.querySelector("#analytics-attendance").textContent = visible.length ? `${attendance.toFixed(1)}%` : "—";
  document.querySelector("#analytics-pass").textContent = visible.length ? `${passRate}%` : "—";
  document.querySelector("#engagement-value").textContent = visible.length ? `${Math.round(attendance)}%` : "—";
  document.querySelector("#engagement-ring").style.setProperty("--ring-value", `${attendance}%`);
  document.querySelector("#engagement-copy").textContent = visible.length ? `Average attendance across ${visible.length} students` : "No students in current selection";
  document.querySelector("#engagement-pass").textContent = visible.length ? `${passRate}%` : "—";
  renderGradeSnapshot(visible, "analytics-grades");

  const departments = [...new Set(visible.map(({ department }) => department))].sort();
  const container = document.querySelector("#department-analytics");
  const maxAverage = Math.max(1, ...departments.map((department) => mean(visible.filter((student) => student.department === department), "marks")));
  const fragment = document.createDocumentFragment();
  departments.forEach((department) => {
    const group = visible.filter((student) => student.department === department);
    const average = mean(group, "marks");
    const row = document.createElement("div");
    row.className = "department-row";
    const name = document.createElement("div");
    name.className = "department-name";
    name.textContent = department;
    const track = document.createElement("div");
    track.className = "department-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `${department} average marks ${average.toFixed(1)} percent`);
    const fill = document.createElement("div");
    fill.className = "department-fill";
    fill.style.width = `${(average / maxAverage) * 100}%`;
    track.append(fill);
    const value = document.createElement("strong");
    value.textContent = `${average.toFixed(1)}%`;
    const count = document.createElement("small");
    count.textContent = `${group.length} students`;
    row.append(name, track, value, count);
    fragment.append(row);
  });
  if (!departments.length) {
    const empty = document.createElement("p");
    empty.className = "leader-empty";
    empty.textContent = "No department results in the current selection.";
    fragment.append(empty);
  }
  container.replaceChildren(fragment);
}

function updateSortButtons() {
  document.querySelectorAll(".sort-button").forEach((button) => {
    const active = button.dataset.sort === currentSort.key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.querySelector("span").textContent = active ? (currentSort.direction === "asc" ? "↑" : "↓") : "↕";
  });
}

function showSection(sectionName) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.hidden = section.id !== `section-${sectionName}`;
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    const active = button.dataset.section === sectionName;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelector(`#section-${sectionName} h1`).focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showStudentDetails(studentId, opener) {
  const student = students.find((item) => item.id === Number(studentId));
  if (!student) return;
  document.querySelector("#dialog-name").textContent = student.name;
  const details = [
    ["Department", student.department], ["Semester", `Semester ${student.semester}`],
    ["Marks", `${student.marks}%`], ["Attendance", `${student.attendance}%`],
    ["Grade", student.grade], ["Status", student.status === "Pass" ? "Passing" : "Needs support"]
  ];
  const list = document.querySelector("#dialog-details");
  const fragment = document.createDocumentFragment();
  details.forEach(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    item.append(term, description);
    fragment.append(item);
  });
  list.replaceChildren(fragment);
  studentDialog.returnValue = "";
  studentDialog.showModal();
  document.querySelector("#dialog-close").focus();
  studentDialog.dataset.opener = opener?.getAttribute("aria-label") || "";
}

document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.go)));
filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appliedFilters = {
    query: searchInput.value.trim().toLocaleLowerCase(),
    department: departmentFilter.value,
    grade: gradeFilter.value,
    status: statusFilter.value
  };
  renderDashboard();
});
filtersForm.addEventListener("reset", () => window.setTimeout(() => {
  appliedFilters = { query: "", department: "", grade: "", status: "" };
  currentSort = { key: "name", direction: "asc" };
  renderDashboard();
}, 0));
document.querySelector("#empty-reset").addEventListener("click", () => filtersForm.reset());
document.querySelector("#dashboard-reset").addEventListener("click", () => filtersForm.reset());
document.querySelectorAll(".sort-button").forEach((button) => button.addEventListener("click", () => {
  if (currentSort.key === button.dataset.sort) currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  else currentSort = { key: button.dataset.sort, direction: button.dataset.sort === "name" ? "asc" : "desc" };
  renderDashboard();
}));
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-student-id]");
  if (button) showStudentDetails(button.dataset.studentId, button);
});
document.querySelector("#dialog-x").addEventListener("click", () => studentDialog.close());
document.querySelector("#dialog-close").addEventListener("click", () => studentDialog.close());
studentDialog.addEventListener("click", (event) => {
  if (event.target === studentDialog) studentDialog.close();
});
loadStudents();
