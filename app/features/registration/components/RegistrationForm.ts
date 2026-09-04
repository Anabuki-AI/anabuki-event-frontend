import type { RegistrationRequest } from '../types'
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import {
  DEBOUNCE_MS,
  DEPARTMENT_REQUIRED_VALUE,
  SCHOOL_OTHER_VALUE,
  USERNAME_MAX,
  USERNAME_MIN,
} from '../definitions'
import {
  validateDepartmentSelection,
  validateRequiredOption,
  validateTermsAgreement,
  validateUserName,
} from '../validation'
import { checkUserName } from '../api/check-user-name'
import { createRegistration } from '../api/create-registration'
import { toApiError } from '~/lib/api/error'

export type UserNameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'unavailable'

/**
 * ユーザー登録フォームの状態と送信処理。
 * テンプレートはRegistrationForm.vue、選択肢定数はdefinitions.tsを参照。
 */
export function setupRegistrationForm() {
  const form = reactive<RegistrationRequest>({
    userName: '',
    gender: '',
    ageGroup: '',
    studentType: '',
    school: '',
    department: '',
    agreedTerms: false,
  })

  // --- ユーザーネーム重複チェック(デバウンス+競合ガード) ---
  const userNameStatus = ref<UserNameStatus>('idle')
  const checkedUserName = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let requestId = 0

  watch(() => form.userName, (value) => {
    clearTimeout(debounceTimer)
    requestId++
    checkedUserName.value = ''

    // ローカル違反(文字数・NG語)はAPIを叩かず即表示
    const localError = validateUserName(value)
    if (localError !== '') {
      userNameStatus.value = 'invalid'
      return
    }

    const currentId = requestId
    userNameStatus.value = 'checking'
    debounceTimer = setTimeout(async () => {
      try {
        const result = await checkUserName(value)
        if (currentId !== requestId) {
          return // 入力が変わったので古いレスポンスは破棄
        }
        checkedUserName.value = value
        userNameStatus.value = result.available ? 'available' : 'unavailable'
      }
      catch {
        if (currentId === requestId) {
          userNameStatus.value = 'unavailable'
        }
      }
    }, DEBOUNCE_MS)
  })

  onUnmounted(() => {
    clearTimeout(debounceTimer)
  })

  const userNameMessage = computed(() => {
    switch (userNameStatus.value) {
      case 'invalid':
        return validateUserName(form.userName)
      case 'checking':
        return '確認中…'
      case 'available':
        return 'このユーザーネームは登録できます'
      case 'unavailable':
        return 'このユーザーネームは使用できません'
      default:
        return `${USERNAME_MIN}〜${USERNAME_MAX}文字で入力してください`
    }
  })

  // --- アンケート必須バリデーション ---
  const isDepartmentRequired = computed(() => form.studentType === DEPARTMENT_REQUIRED_VALUE)

  // 学生種別に応じて学校・学科欄を出し分け、選択値の整合を保つ
  const isSchoolRequired = computed(() => form.studentType === DEPARTMENT_REQUIRED_VALUE || form.studentType === 'other_student')
  const isOtherSchool = computed(() => form.school === SCHOOL_OTHER_VALUE)

  watch(() => form.studentType, (value) => {
    // 学生でない場合は学校・学科の選択を解除
    if (value !== DEPARTMENT_REQUIRED_VALUE && value !== 'other_student') {
      form.school = ''
    }
    if (value !== DEPARTMENT_REQUIRED_VALUE) {
      form.department = ''
    }
  })

  const showFieldErrors = ref(false)

  const fieldErrors = computed(() => ({
    terms: validateTermsAgreement(form.agreedTerms),
    gender: validateRequiredOption(form.gender, '性別'),
    ageGroup: validateRequiredOption(form.ageGroup, '年代'),
    studentType: validateRequiredOption(form.studentType, '学生種別'),
    school: validateDepartmentSelection(form.school, isSchoolRequired.value).replace('学科', '学校'),
    department: validateDepartmentSelection(form.department, isDepartmentRequired.value),
  }))

  // --- 送信 ---
  const isSubmitting = ref(false)
  const submitErrorMessage = ref('')

  const isSubmitEnabled = computed(() =>
    !isSubmitting.value
    && validateUserName(form.userName) === ''
    && userNameStatus.value === 'available'
    && checkedUserName.value === form.userName
    && form.agreedTerms
    && form.gender !== ''
    && form.ageGroup !== ''
    && form.studentType !== ''
    && (!isSchoolRequired.value || form.school !== '')
    && (!isDepartmentRequired.value || form.department !== ''),
  )

  async function handleSubmit() {
    showFieldErrors.value = true
    if (!isSubmitEnabled.value) {
      return
    }
    isSubmitting.value = true
    submitErrorMessage.value = ''

    try {
      const created = await createRegistration({ ...form })
      // TODO: 本番実装では待機画面(/users/waiting)へ遷移する。現在は暫定の完了画面
      await navigateTo({
        path: '/users/complete',
        query: { userName: created.userName || form.userName },
      })
    }
    catch (error) {
      submitErrorMessage.value = toApiError(error).message
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    userNameStatus,
    userNameMessage,
    isDepartmentRequired,
    isSchoolRequired,
    isOtherSchool,
    showFieldErrors,
    fieldErrors,
    isSubmitEnabled,
    isSubmitting,
    submitErrorMessage,
    handleSubmit,
  }
}
