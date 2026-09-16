export const DEPARTMENT_REQUIRED_VALUE = 'anabuki_college'
export const SCHOOL_OTHER_VALUE = 'other_school'

export const TERMS_TEXT = `第1条（目的）
本規約は、穴吹ITビジネスカレッジが主催するクイズ大会（以下「本イベント」）の利用条件を定めるものです。参加者は本イベントに参加することで、本規約に同意したものとみなされます。

第2条（個人情報の取り扱い）
主催者は、参加登録時に取得したニックネームおよびアンケート回答を、本イベントの運営・進行・集計の目的にのみ使用します。取得した情報を目的外で利用したり、同意なく第三者に提供することはありません。本イベント終了後、個人情報は主催者が定める期間をもって適切に破棄します。

第3条（禁止事項）
参加者は、以下の行為を行ってはなりません。
1. 他の参加者を誹謗中傷し、または不快にさせる行為
2. 公序良俗に反するニックネームの使用
3. 運営スタッフになりすます行為
4. 本イベントの運営を妨害する行為
5. その他主催者が不適切と判断する行為
前項の行為が確認された場合、主催者は当該参加者の参加を取り消すことがあります。

第4条（免責事項）
主催者は、機器の故障・通信障害その他やむを得ない事由により本イベントの中断・中止が発生した場合でも、それによって生じた損害について責任を負いません。また、本イベントの内容は予告なく変更される場合があります。

第5条（規約の変更）
主催者は、必要と判断した場合、本規約を変更できるものとします。変更後の規約は、本イベントの運営に適用されるものとし、参加者は変更後の規約に従うものとします。`

export interface Option {
  value: string
  label: string
}

export const GENDER_OPTIONS: Option[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'no_answer', label: '回答しない' },
]

export const AGE_GROUP_OPTIONS: Option[] = [
  { value: '10s', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s_plus', label: '60代以上' },
]

export const STUDENT_TYPE_OPTIONS: Option[] = [
  { value: 'anabuki_college', label: '穴吹カレッジの専門学生' },
  { value: 'other_student', label: '他校の学生' },
  { value: 'not_student', label: '学生でない' },
]

export const SCHOOL_OPTIONS: Option[] = [
  { value: 'anabuki_it_business', label: '穴吹ITビジネスカレッジ' },
  { value: 'anabuki_medical', label: '穴吹医療カレッジ' },
  { value: 'anabuki_dental', label: '穴吹歯科衛生専門学校' },
  { value: 'anabuki_acupuncture', label: '穴吹リハビリテーション鍼灸学校' },
  { value: 'anabuki_design', label: '穴吹デザイン&ビューティー専門学校' },
  { value: 'anabuki_confectionery', label: '穴吹調理製菓専門学校' },
  { value: 'anabuki_animal', label: '穴吹動物福祉専門学校' },
  { value: SCHOOL_OTHER_VALUE, label: 'その他の学校(入力)' },
]

export const DEPARTMENT_OPTIONS: Option[] = [
  { value: 'ai_technology', label: 'AIテクノロジー学科' },
  { value: 'information_business', label: '情報ビジネス学科' },
  { value: 'medical_affairs', label: '医療事務学科' },
  { value: 'dental_hygiene', label: '歯科衛生士学科' },
  { value: 'acupuncture', label: '鍼灸学科' },
  { value: 'architecture', label: '建築学科' },
  { value: 'game_creator', label: 'ゲームクリエイター学科' },
  { value: 'business_data', label: 'ビジネスデータ学科' },
]
