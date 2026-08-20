(function () {
  "use strict";

  const STORAGE_KEY = "todos";
  const CATEGORIES = ["업무", "개인", "공부"];

  const el = {
    addForm: document.getElementById("add-form"),
    input: document.getElementById("todo-input"),
    categorySelect: document.getElementById("category-select"),
    filterTabs: document.getElementById("filter-tabs"),
    list: document.getElementById("todo-list"),
    emptyState: document.getElementById("empty-state"),
    itemTemplate: document.getElementById("todo-item-template"),
    progressBarFill: document.getElementById("progress-bar-fill"),
    progressText: document.getElementById("progress-text"),
    categoryProgress: document.getElementById("category-progress"),
  };

  let todos = loadTodos();
  let currentFilter = "전체";

  // ---- 1단계: localStorage 로드/저장 ----

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load todos from localStorage", e);
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // ---- 2단계: 추가 / 수정 / 삭제 (CRUD) ----

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addTodo(title, category) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    todos.push({
      id: generateId(),
      title: trimmed,
      category: CATEGORIES.includes(category) ? category : "개인",
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
    saveTodos();
    render();
  }

  function updateTodo(id, changes) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    Object.assign(todo, changes, { updatedAt: new Date().toISOString() });
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  // ---- 3단계: 완료 체크 ----

  function toggleComplete(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    updateTodo(id, { isCompleted: !todo.isCompleted });
  }

  function startEdit(node, todo) {
    node.classList.add("editing");
    const titleEl = node.querySelector(".todo-title");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = todo.title;
    input.maxLength = 200;
    titleEl.insertAdjacentElement("beforebegin", input);
    input.focus();
    input.select();

    const categoryEl = node.querySelector(".todo-category");
    const select = document.createElement("select");
    CATEGORIES.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      if (category === todo.category) option.selected = true;
      select.appendChild(option);
    });
    categoryEl.insertAdjacentElement("beforebegin", select);
    categoryEl.hidden = true;

    function commit() {
      const newTitle = input.value.trim();
      if (!newTitle) {
        cancel();
        return;
      }
      updateTodo(todo.id, { title: newTitle, category: select.value });
    }

    function cancel() {
      render();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", () => {
      setTimeout(commit, 0);
    });
  }

  // ---- 4단계: 카테고리 필터 ----

  function getVisibleTodos() {
    return currentFilter === "전체"
      ? todos
      : todos.filter((t) => t.category === currentFilter);
  }

  // ---- 5단계: 진행률 보기 ----

  function computeProgress(list) {
    const total = list.length;
    const done = list.filter((t) => t.isCompleted).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, percent };
  }

  function renderProgress() {
    const overall = computeProgress(todos);
    el.progressBarFill.style.width = overall.percent + "%";
    el.progressText.textContent = `${overall.done}/${overall.total} 완료 (${overall.percent}%)`;

    el.categoryProgress.innerHTML = "";
    CATEGORIES.forEach((category) => {
      const categoryTodos = todos.filter((t) => t.category === category);
      const { total, done } = computeProgress(categoryTodos);
      const span = document.createElement("span");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.category = category;
      dot.style.background = {
        업무: "var(--color-work)",
        개인: "var(--color-personal)",
        공부: "var(--color-study)",
      }[category];
      span.appendChild(dot);
      span.appendChild(document.createTextNode(`${category} ${done}/${total}`));
      el.categoryProgress.appendChild(span);
    });
  }

  // ---- 화면 렌더링 ----

  function renderList() {
    el.list.innerHTML = "";

    const visible = getVisibleTodos();
    el.emptyState.hidden = visible.length !== 0;

    visible
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((todo) => {
        const node = el.itemTemplate.content.firstElementChild.cloneNode(true);
        node.dataset.id = todo.id;
        node.classList.toggle("completed", todo.isCompleted);

        const checkbox = node.querySelector(".todo-checkbox");
        checkbox.checked = todo.isCompleted;
        checkbox.addEventListener("change", () => toggleComplete(todo.id));

        const titleEl = node.querySelector(".todo-title");
        titleEl.textContent = todo.title;

        const categoryEl = node.querySelector(".todo-category");
        categoryEl.textContent = todo.category;
        categoryEl.dataset.category = todo.category;

        node.querySelector(".btn-edit").addEventListener("click", () => {
          startEdit(node, todo);
        });
        node.querySelector(".btn-delete").addEventListener("click", () => {
          if (confirm("이 할 일을 삭제할까요?")) {
            deleteTodo(todo.id);
          }
        });

        el.list.appendChild(node);
      });
  }

  function render() {
    renderProgress();
    renderList();
  }

  el.addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(el.input.value, el.categorySelect.value);
    el.input.value = "";
    el.input.focus();
  });

  el.filterTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-tab");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    Array.from(el.filterTabs.children).forEach((tab) =>
      tab.classList.toggle("active", tab === btn)
    );
    renderList();
  });

  render();
})();
