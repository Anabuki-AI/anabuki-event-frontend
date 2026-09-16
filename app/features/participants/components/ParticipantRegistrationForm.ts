import type { ParticipantRegistration } from '../types'
import { computed, reactive, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import {
  DEPARTMENT_REQUIRED_VALUE,
  SCHOOL_OTHER_VALUE,
} from '../definitions'
import {
  validateDepartmentSelection,
  validateDisplayName,
  validateRequiredOption,
  validateSchoolName,
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

  const otherSchoolName = ref('')
  const isOtherSchoolSelected = computed(
    () => form.studentType === DEPARTMENT_REQUIRED_VALUE && form.school === SCHOOL_OTHER_VALUE,
  )
  const isDepartmentRequired = computed(
    () => form.studentType === DEPARTMENT_REQUIRED_VALUE && !isOtherSchoolSelected.value,
  )
  const isSchoolRequired = computed(
    () => form.studentType === DEPARTMENT_REQUIRED_VALUE || form.studentType === 'other_student',
  )
  const isOtherSchool = computed(() => form.school === SCHOOL_OTHER_VALUE)

  watch(() => form.studentType, (value) => {
    if (value === 'other_student') {
      form.school = SCHOOL_OTHER_VALUE
      form.department = ''
    }
    else if (value === DEPARTMENT_REQUIRED_VALUE) {
      form.school = ''
      form.department = ''
    }
    else {
      form.school = ''
      form.department = ''
      otherSchoolName.value = ''
    }
  })

  watch(() => form.school, (value) => {
    if (value !== SCHOOL_OTHER_VALUE) {
      otherSchoolName.value = ''
    }
  })

  const showFieldErrors = ref(false)
  const fieldErrors = computed(() => ({
    displayName: validateDisplayName(form.displayName),
    terms: validateTermsAgreement(form.agreedTerms),
    gender: validateRequiredOption(form.gender, '性別'),
    ageGroup: validateRequiredOption(form.ageGroup, '年代'),
    studentType: validateRequiredOption(form.studentType, '学生種別'),
    school: validateSchoolName(
      isOtherSchool.value ? otherSchoolName.value : form.school,
      isSchoolRequired.value,
    ),
    department: validateDepartmentSelection(form.department, isDepartmentRequired.value),
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
        school: isOtherSchool.value ? otherSchoolName.value.trim() : form.school,
      })
      await navigateTo('/participants/waiting')
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
    otherSchoolName,
    isDepartmentRequired,
    isSchoolRequired,
    showFieldErrors,
    fieldErrors,
    isSubmitEnabled,
    isSubmitting,
    submitErrorMessage,
    handleSubmit,
  }
}
