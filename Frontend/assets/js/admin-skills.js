/* ============================================================
   SewaConnect — Admin Skills Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole("admin")) return;

  const form = document.getElementById("skill-form");
  const categorySelect = document.getElementById("skill-category");
  const filterCategorySelect = document.getElementById("skill-filter-category");
  const nameInput = document.getElementById("skill-name");
  const descriptionInput = document.getElementById("skill-description");
  const submitText = document.getElementById("skill-submit-text");
  const cancelEditBtn = document.getElementById("skill-cancel-edit");
  const heading = document.getElementById("add-edit-heading");
  const listEl = document.getElementById("skills-list");
  const emptyEl = document.getElementById("empty-state");

  let categories = [];
  let skills = [];
  let editingId = "";

  async function init() {
    await loadCategories();
    await loadSkills();
    form.addEventListener("submit", handleSubmit);
    cancelEditBtn.addEventListener("click", cancelEdit);
    filterCategorySelect.addEventListener("change", () => {
      loadSkills(filterCategorySelect.value);
    });
  }

  async function loadCategories() {
    const data = await apiFetch("/categories/admin/");
    if (!data || data.error) return;

    categories = data.results || data.data || data || [];
    if (!Array.isArray(categories)) categories = [];

    const options = categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");

    categorySelect.innerHTML = `<option value="">Select a category</option>${options}`;
    filterCategorySelect.innerHTML = `<option value="">All Categories</option>${options}`;
  }

  async function loadSkills(categoryId) {
    showLoading();

    const url = categoryId ? `/skills/?category=${categoryId}` : "/skills/";
    const data = await apiFetch(url);

    if (!data || data.error) {
      skills = [];
      renderSkills();
      return;
    }

    skills = data.results || data.data || data || [];
    if (!Array.isArray(skills)) skills = [];
    renderSkills();
  }

  function renderSkills() {
    if (!skills.length) {
      listEl.innerHTML = "";
      listEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    listEl.classList.remove("hidden");

    listEl.innerHTML = `
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Skill Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        ${skills
          .map(
            (skill) => `
          <tr>
            <td>${skill.name}</td>
            <td>${skill.category_name || "-"}</td>
            <td>${skill.description || "-"}</td>
            <td>${skill.is_active === false ? "❌" : "✅"}</td>
            <td>
                <button
                    class="btn btn-sm btn-primary edit-skill-btn"
                    data-id="${skill.id}">
                    Edit
                </button>

                <button
                    class="btn btn-sm btn-danger delete-skill-btn"
                    data-id="${skill.id}">
                    Delete
                </button>
            </td>
          </tr>
        `,
          )
          .join("")}
        </tbody>
      </table>
    </div>
  `;

    document.querySelectorAll(".edit-skill-btn").forEach((btn) => {
      btn.onclick = () => startEdit(Number(btn.dataset.id));
    });

    document.querySelectorAll(".delete-skill-btn").forEach((btn) => {
      btn.onclick = () => handleDelete(Number(btn.dataset.id));
    });
  }

  function startEdit(id) {
    const skill = skills.find((s) => s.id === id);
    if (!skill) return;

    editingId = skill.id;

    categorySelect.value = skill.category || "";
    nameInput.value = skill.name || "";
    descriptionInput.value = skill.description || "";

    heading.textContent = "Edit Skill";
    submitText.textContent = "Update Skill";

    cancelEditBtn.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    editingId = "";
    form.reset();
    heading.textContent = "Add New Skill";
    submitText.textContent = "Add Skill";
    cancelEditBtn.classList.add("hidden");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!categorySelect.value) {
      showToast("Please select a category.", "error");
      return;
    }
    if (!nameInput.value.trim()) {
      showToast("Please enter a skill name.", "error");
      return;
    }

    const payload = {
      category: Number(categorySelect.value),
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim(),
    };

    let data;

    if (editingId) {
      data = await apiFetch(`/skills/${editingId}/update/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      data = await apiFetch("/skills/create/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    if (data && !data.error) {
      showToast(
        editingId ? "Skill updated successfully." : "Skill added successfully.",
        "success",
      );

      cancelEdit();
      await loadSkills(filterCategorySelect.value);
    }
  }

  async function handleDelete(id) {
    const ok = await showConfirm("Delete this skill?");
    if (!ok) return;

    const data = await apiFetch(`/skills/${id}/delete/`, {
      method: "DELETE",
    });

    if (data && !data.error) {
      showToast("Skill deleted.", "success");
      await loadSkills(filterCategorySelect.value);
    }
  }

  function showLoading() {
    listEl.innerHTML = `
      <div class="skeleton skeleton-card" style="height:60px;margin-bottom:var(--sp-3)"></div>
      <div class="skeleton skeleton-card" style="height:60px;margin-bottom:var(--sp-3)"></div>
      <div class="skeleton skeleton-card" style="height:60px"></div>
    `;
    listEl.classList.remove("hidden");
    emptyEl.classList.add("hidden");
  }

  init();
})();