import { ref } from 'vue'

/**
 * ハンバーガーメニュー(ドロワー)の開閉状態とキーボード操作。
 * テンプレートは各ページ側に置き、このモジュールは状態と振る舞いだけを持つ
 * (waiting系TSモジュールと同じ構成。components配下に.vueを置かない運用)。
 */
export function setupAdminDrawer() {
  const isDrawerOpen = ref(false)

  function openDrawer() {
    isDrawerOpen.value = true
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function handleDrawerKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDrawer()
    }
  }

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    handleDrawerKeydown,
  }
}
