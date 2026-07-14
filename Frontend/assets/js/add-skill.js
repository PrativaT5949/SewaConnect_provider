/* ============================================================
   SewaConnect — Add Skill Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('provider')) return;

  const form = document.getElementById('add-skill-form');
  const categorySelect = document.getElementById('skill-category');
  const skillSelect = document.getElementById('skill-name');
  const experienceInput = document.getElementById('skill-experience');
  const submitBtn = document.getElementById('skill-submit');
  const submitText = document.getElementById('skill-submit-text');
  const submitSpinner = document.getElementById('skill-submit-spinner');

  let skillsCache = {};

  async function init() {
    await loadCategories();
    categorySelect.addEventListener('change', () => loadSkills(categorySelect.value));
    form.addEventListener('submit', handleSubmit);
  }

  async function loadCategories() {
    const data = await apiFetch('/categories/');
    if (!data || data.error) return;

    const categories = data.results || data.data || data;
    if (!Array.isArray(categories)) return;

    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }

  async function loadSkills(categoryId) {
    skillSelect.innerHTML = '<option value="">Loading skills...</option>';
    skillSelect.disabled = true;

    if (!categoryId) {
      skillSelect.innerHTML = '<option value="">Select a skill</option>';
      return;
    }

    if (skillsCache[categoryId]) {
      renderSkillOptions(skillsCache[categoryId]);
      return;
    }

    const data = await apiFetch(`/skills/?category=${categoryId}`);
    if (!data || data.error) {
      skillSelect.innerHTML = '<option value="">No skills available</option>';
      return;
    }

    const skills = data.results || data.data || data;
    if (!Array.isArray(skills)) {
      skillSelect.innerHTML = '<option value="">No skills available</option>';
      return;
    }

    skillsCache[categoryId] = skills;
    renderSkillOptions(skills);
  }

  function renderSkillOptions(skills) {
    skillSelect.innerHTML = '<option value="">Select a skill</option>';
    skills.forEach((skill) => {
      const option = document.createElement('option');
      option.value = skill.id;
      option.textContent = skill.name || skill.title || 'Skill';
      skillSelect.appendChild(option);
    });
    skillSelect.disabled = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const skillId = skillSelect.value;
    const experience = experienceInput.value;

    if (!skillId) {
      showToast('Please select a skill.', 'error');
      return;
    }

    setLoading(true);

    const payload = {
      skill: Number(skillId),
      years_of_experience: experience ? Number(experience) : 0,
    };

    const data = await apiFetch('/providers/skills/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast('Skill added successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 1000);
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitText.textContent = loading ? 'Adding...' : 'Add Skill';
    submitSpinner.classList.toggle('hidden', !loading);
  }

  init();
})();
