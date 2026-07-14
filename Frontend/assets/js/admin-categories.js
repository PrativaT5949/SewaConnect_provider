/* ============================================================
   SewaConnect — Admin Categories Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole("admin")) return;

  const form = document.getElementById("category-form");
  const nameInput = document.getElementById("cat-name");
  const iconInput = document.getElementById("cat-icon");
  const descriptionInput = document.getElementById("cat-description");
  const submitBtn = document.getElementById("cat-submit");
  const submitText = document.getElementById("cat-submit-text");
  const cancelEditBtn = document.getElementById("cat-cancel-edit");
  const heading = document.getElementById("add-edit-heading");
  const listEl = document.getElementById("categories-list");
  const emptyEl = document.getElementById("empty-state");

  let categories = [];
  let editingSlug = "";

  async function init() {
    await loadCategories();
    form.addEventListener("submit", handleSubmit);
    cancelEditBtn.addEventListener("click", cancelEdit);
  }

  async function loadCategories() {
    showLoading();

    const data = await apiFetch("/categories/admin/");
    if (!data || data.error) {
      categories = [];
      renderCategories();
      return;
    }

    categories = data.results || data.data || data || [];
    if (!Array.isArray(categories)) categories = [];
    renderCategories();
  }

  function renderCategories() {
    if (!categories.length) {
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
            <th>Icon</th>
            <th>Name</th>
            <th>Description</th>
            <th>Skills</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        ${categories
          .map(
            (cat) => `
          <tr>
            <td style="font-size:1.5rem">${cat.icon || "🛠️"}</td>
            <td>${cat.name}</td>
            <td>${cat.description || "-"}</td>
            <td>${cat.services_count || 0}</td>
            <td>${cat.is_active ? "✅" : "❌"}</td>
            <td>
                <button
                    class="btn btn-sm btn-primary edit-cat-btn"
                    data-slug="${cat.slug}">
                    Edit
                </button>

                <button
                    class="btn btn-sm btn-danger delete-cat-btn"
                    data-slug="${cat.slug}">
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

    document.querySelectorAll(".edit-cat-btn").forEach((btn) => {
      btn.onclick = () => startEdit(btn.dataset.slug);
    });

    document.querySelectorAll(".delete-cat-btn").forEach((btn) => {
      btn.onclick = () => handleDelete(btn.dataset.slug);
    });
  }
  function startEdit(slug) {
    const cat = categories.find((c) => c.slug === slug);

    if (!cat) return;

    editingSlug = cat.slug;

    nameInput.value = cat.name || "";
    iconInput.value = cat.icon || "";
    descriptionInput.value = cat.description || "";

    heading.textContent = "Edit Category";
    submitText.textContent = "Update Category";

    cancelEditBtn.classList.remove("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  function cancelEdit() {
    editingSlug = "";
    form.reset();
    heading.textContent = "Add New Category";
    submitText.textContent = "Add Category";
    cancelEditBtn.classList.add("hidden");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: nameInput.value.trim(),
      icon: iconInput.value.trim(),
      description: descriptionInput.value.trim(),
    };

    let data;

    if (editingSlug) {
      data = await apiFetch(`/categories/${editingSlug}/update/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      data = await apiFetch("/categories/create/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    if (data && !data.error) {
      showToast(
        editingSlug
          ? "Category updated successfully."
          : "Category added successfully.",
        "success",
      );

      cancelEdit();
      await loadCategories();
    }
  }

  async function handleDelete(slug) {
    const ok = await showConfirm("Delete this category?");

    if (!ok) return;

    const data = await apiFetch(`/categories/${slug}/delete/`, {
      method: "DELETE",
    });

    if (data && !data.error) {
      showToast("Category deleted.", "success");
      await loadCategories();
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
