export const operationGuideItems: OperationGuideItem[] = [
    {
        id: 'user-registration',
        title: 'ユーザー登録',
        description: 'クイズ大会に参加するためのユーザー情報を登録する画面です。',
    },
    {
        id: 'registration-complete',
        title: 'ユーザー登録完了',
    },
    {
        id: 'waiting-room',
        title: '待機画面',
        description: 'クイズ開始まで待機し、参加人数やリアクションを確認する画面です。',
    },
    {
        id: 'nickname-edit',
        title: 'ニックネーム編集',
        description: '登録したニックネームを変更する画面です。',
    },
    {
        id: 'answer',
        title: 'クイズ回答',
        description: '自信度を確定して選択肢を送信します。送信後も回答受付中なら「回答を選び直す」から選択肢を変更できます。同じ選択肢を再送することもできます。選択肢をタップしただけでは保存されず、「変更を送信する」を押した時点で更新されます。キャンセルや通信失敗の場合は、受付済みの回答がそのまま残ります。',
    },
    {
        id: 'rankings',
        title: 'ランキング',
    },
]

export type HelpSection = {
    title: string
    content: string
}

export type FaqItem = {
    question: string
    answer: string
}

export type OperationGuideItem = {
    id: string
    title: string
    description?: string
    manualHref?: string
}

export const helpSections: HelpSection[] = [
    {
        title: 'クイズ大会について',
        content:
            'スマートフォンからクイズに参加し、回答結果に応じて順位を競うクイズ大会です。',
    },
    {
        title: '必要なもの',
        content:
            '参加にはスマートフォンが必要です。スマートフォンのみ対応しています。',
    },
    {
        title: '注意事項',
        content:
            '内容は現在調整中です。',
    },
    {
        title: '参加方法',
        content:
            '会場に掲示されているQRコード、または案内されたURLから参加できます。',
    },
    {
        title: '使い方',
        content:
            'クイズ画面から問題に回答できます。現在の順位はランキング画面から確認できます。',
    },
]

export const faqItems: FaqItem[] = [
    {
        question: 'スマートフォン以外でも参加できますか？',
        answer:
            '参加できません。スマートフォンのみ対応しています。',
    },
    {
        question: '通信が切れた場合はどうなりますか？',
        answer:
            '再接続できます。回答の変更に失敗した場合も、元の受付済み回答は失われません。最新状態を確認して、締切前ならもう一度変更を送信できます。',
    },
    {
        question: '送信した回答を変更できますか？',
        answer:
            '回答受付中のみ変更できます。「回答を選び直す」で選択肢を変更し、「変更を送信する」を押してください。締切後・正答公開後・次の問題では変更できません。',
    },
    {
        question: '同点の場合はどうなりますか？',
        answer:
            '景品対象者が同点の場合は、じゃんけんで順位を決定します。',
    },
    {
        question: '景品は出ますか？',
        answer:
            '豪華景品を用意する予定です。景品対象となる順位は現在調整中です。',
    },
    {
        question: '途中参加はできますか？',
        answer:
            '途中参加できます。ただし、最初から参加している場合と比べて不利になる可能性があります。',
    },
    {
        question: 'Wi-Fiはありますか？',
        answer:
            '穴吹アリーナのWi-Fiを利用できます。ただし、利用者数によって回線が混雑する場合があります。',
    },
]
