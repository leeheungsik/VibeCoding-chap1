(function () {
  "use strict";

  const STORAGE_KEY = "todos";

  // 1단계: localStorage 로드/저장 함수만 구현.
  // 화면 렌더링, 추가/수정/삭제, 필터링 등은 다음 단계에서 구현한다.

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

  function saveTodos(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // 동작 확인용: 저장된 할 일 개수를 콘솔에 출력한다.
  const todos = loadTodos();
  console.log(`loadTodos: ${todos.length}개의 할 일을 불러왔습니다.`);
})();
