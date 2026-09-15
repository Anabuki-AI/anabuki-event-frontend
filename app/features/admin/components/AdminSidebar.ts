import { ref } from 'vue'

/**
 * 管理画面の常設サイドバーの開閉(展開/縮小)状態とキーボード操作。
 * テンプレートは各ページ側に置き、このモジュールは状態と振る舞いだけを持つ
 * (waiting系TSモジュールと同じ構成。components配下に.vueを置かない運用)。
 */
export function setupAdminSidebar() {
  const isSidebarExpanded = ref(true)

  function expandSidebar() {
    isSidebarExpanded.value = true
  }

  function collapseSidebar() {
    isSidebarExpanded.value = false
  }

  function toggleSidebar() {
    isSidebarExpanded.value = !isSidebarExpanded.value
  }

  function handleSidebarKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      collapseSidebar()
    }
  }

  return {
    isSidebarExpanded,
    expandSidebar,
    collapseSidebar,
    toggleSidebar,
    handleSidebarKeydown,
  }
}
