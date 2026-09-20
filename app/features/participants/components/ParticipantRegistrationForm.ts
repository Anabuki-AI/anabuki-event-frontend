import type { ParticipantRegistration } from '../types'
import { computed, reactive, ref } from 'vue'
import { navigateTo } from '#imports'
import {
  validateDisplayName,
  validateRequiredOption,
  validateTermsAgreement,
} from '../validation'
import { createParticipant } from '../api/create-participant'
import { toApiError } from '~/lib/api/error'

/** Registration state for the UUID participant and its HttpOnly cookie session. */
export function setupParticipantRegistrationForm() {
  const form = reactive<ParticipantRegistration>({
    displayName: '',
    gender: '',
    ageGroup: '',
    studentType: '',
    school: '',
    department: '',
    agreedTerms: false,
  })

  const showFieldErrors = ref(false)
  const fieldErrors = computed(() => ({
    displayName: validateDisplayName(form.displayName),
    terms: validateTermsAgreement(form.agreedTerms),
    gender: validateRequiredOption(form.gender, '諤ｧ蛻･'),
    ageGroup: validateRequiredOption(form.ageGroup, '蟷ｴ莉｣'),
    studentType: '',
    school: form.school.trim().length > 255 ? '学校名は255文字以内で入力してください' : '',
    department: '',
  }))

  const isSubmitting = ref(false)
  const submitErrorMessage = ref('')
  const isSubmitEnabled = computed(() =>
    !isSubmitting.value
    && Object.values(fieldErrors.value).every(error => error === ''),
  )

  async function handleSubmit() {
    showFieldErrors.value = true
    if (!isSubmitEnabled.value) {
      return
    }

    isSubmitting.value = true
    submitErrorMessage.value = ''
    try {
      await createParticipant({
        ...form,
        school: form.school.trim(),
      })
      await navigateTo('/participants/waiting')
    }
    catch (error) {
      const apiError = toApiError(error)
      if (apiError.statusCode === 409) {
        await navigateTo('/participants/waiting')
        return
      }
      submitErrorMessage.value = apiError.message
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    showFieldErrors,
    fieldErrors,
    isSubmitEnabled,
    isSubmitting,
    submitErrorMessage,
    handleSubmit,
  }
}
