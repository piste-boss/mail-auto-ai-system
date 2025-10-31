import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from './config';
import type { DragEvent } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

type EmailThread = {
  id: string
  subject: string
  sender: string
  receivedAt: string
  preview: string
  body: string
}

type InboundSettings = {
  provider: string
  forwardingAddress: string
  mailboxUser: string
  imapHost: string
  imapPort: string
  encryption: string
  forwardingNote: string
  mailboxNote: string
  username: string
  password: string
  phonenumber: string
  email: string
}

function App() {
  const [emails, setEmails] = useState<EmailThread[]>(() => [
      {
        id: 'thread-1',
        subject: '【お問い合わせ】プレミアムプランの契約更新について',
        sender: '山田 太郎 <taro@example.com>',
        receivedAt: '2024-05-18 10:32',
        preview: 'プレミアムプランを利用している山田です。更新のタイミングで請求書払いへ変更したいのですが可能でしょうか？',
        body: `プレミアムプランを利用している山田です。更新のタイミングで請求書払いへ変更したいのですが可能でしょうか？\n\nまた、追加ユーザーを2名分増やした場合の料金も教えてください。`
      },
      {
        id: 'thread-2',
        subject: '【請求書再発行】4月分の再送をお願いします',
        sender: '佐藤 友美 <yumi@example.co.jp>',
        receivedAt: '2024-05-18 09:10',
        preview: '4月分の請求書を受け取れていないようです。再発行をお願いしてもよろしいでしょうか？',
        body: `AI Auto Mail System サポート御中\n\nお世話になっております。佐藤です。\n\n4月分の請求書が確認できていないようです。お手数ですが再発行いただいてもよろしいでしょうか？\n\nまた、PDF にパスワードが設定されている場合は別途共有いただけますと幸いです。\n\nよろしくお願いいたします。`
      },
      {
        id: 'thread-3',
        subject: '【機能相談】アカウント追加の方法について',
        sender: '高橋 裕介 <yusuke@example.com>',
        receivedAt: '2024-05-17 18:25',
        preview: 'アカウント管理画面から追加する手順を教えてください。',
        body: `お世話になっております。高橋です。\n\nアカウント管理画面からユーザーを追加する手順を教えてください。トライアル期間中でも追加はできますか？\n\n急ぎの案件で恐縮ですが、ご教示いただけると助かります。`
      }
    ])

  const [selectedEmailId, setSelectedEmailId] = useState(() => emails[0]?.id ?? '')
  const [translation, setTranslation] = useState('')
  const [summary, setSummary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDropActive, setIsDropActive] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const composeInitialDraft = (emailSubject: string) =>
    `${emailSubject.replace('【', '').replace('】', '')}についてご連絡ありがとうございます。\n\n` +
    'サポートの石川でございます。内容を確認のうえ、以下の通りご案内いたします。\n\n' +
    '---\nここに回答内容を記載してください。\n---\n\n' +
    'ご不明な点がございましたら、お気軽にお申し付けください。\n\n引き続きよろしくお願いいたします。'

  const [draft, setDraft] = useState(
    composeInitialDraft(emails[0]?.subject ?? 'お問い合わせ')
  )
  const [autoSend, setAutoSend] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [knowledgeSource, setKnowledgeSource] = useState(
    'https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxx'
  )
  const [alertEmail, setAlertEmail] = useState('support@example.com')
  const [profileName, setProfileName] = useState('石川 すぐる')
  const [profileSignature, setProfileSignature] = useState(
    '石川 すぐる\nAI Auto Mail System サポート\nsupport@example.com | 03-1234-5678'
  )
  const [useName, setUseName] = useState(true)
  const [useSignature, setUseSignature] = useState(true)
  const [language, setLanguage] = useState<'ja' | 'en' | 'zh' | 'custom'>('ja')
  const [customLanguage, setCustomLanguage] = useState('')
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox')
  const [inboundSettings, setInboundSettings] = useState<InboundSettings>({
    provider: 'Google Workspace',
    forwardingAddress: 'info@company.co.jp',
    mailboxUser: 'info@company.co.jp',
    imapHost: 'imap.gmail.com',
    imapPort: '993',
    encryption: 'SSL/TLS',
    forwardingNote: 'Gmail フィルタで INFO_INBOX ラベルを付与 → Apps Script で取得',
    mailboxNote: '',
    username: '',
    password: '',
    phonenumber: '',
    email: ''
  })

  const buildApiUrl = (action: string) =>
    `${API_BASE_URL}?action=${action}&origin=${encodeURIComponent(window.location.origin)}`

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(buildApiUrl('getSettings'))
        const data = await res.json()
        setInboundSettings((prev) => ({ ...prev, ...data }))
      } catch (error) {
        console.error('設定の取得に失敗しました', error)
      }
    })()
  }, [])

  const composedDraft = useMemo(() => {
    const base = draft.trimEnd()
    const lines: string[] = [base]

    if (useName && profileName.trim().length > 0) {
      lines.push(profileName.trim())
    }

    if (useSignature && profileSignature.trim().length > 0) {
      lines.push('')
      lines.push(profileSignature.trim())
    }

    return lines.join('\n\n').trimEnd()
  }, [draft, profileName, profileSignature, useName, useSignature])

  const selectedEmail = useMemo(
    () => emails.find((mail) => mail.id === selectedEmailId) ?? emails[0],
    [emails, selectedEmailId]
  )

  const handleApprove = () => {
    setIsSending(true)
    setStatusMessage('')
    window.setTimeout(() => {
      setStatusMessage(autoSend ? '自動送信モードで送信キューへ登録しました。' : '送信承認が完了しました。')
      setIsSending(false)
    }, 650)
  }

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId)
    const email = emails.find((mail) => mail.id === emailId)
    if (email) {
      setDraft(composeInitialDraft(email.subject))
      setTranslation('')
      setSummary('')
      setIsPreviewOpen(true)
    }
  }

  const handleRegenerate = () => {
    setDraft(
      `山田 太郎 様\n\nお世話になっております。サポートの石川でございます。\n\n請求書払いへの変更は次回更新から承ります。社判済みの申請書を更新予定日の5営業日前までにご提出ください。\n\n追加ユーザー2名分は合計 +11,000円/月（税別）で、更新後の月額は 50,800円（税別）です。\n\n申請書を添付しておりますので、記入後このメールにご返信ください。ご不明点があればお気軽にお問い合わせください。\n\n今後ともよろしくお願いいたします。`
    )
    setStatusMessage('下書きを再生成しました。内容をご確認ください。')
  }

  const handleSaveSettings = () => {
    setStatusMessage('システム設定を保存しました。（現在はローカル反映のみ）')
    setIsSettingsOpen(false)
  }

  const handleInboundSettingChange = <K extends keyof InboundSettings>(
    field: K,
    value: InboundSettings[K]
  ) => {
    setInboundSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleInboundSave = async () => {
    try {
      setStatusMessage('保存中...')
      const res = await fetch(buildApiUrl('saveSettings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inboundSettings)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '保存に失敗しました')
      setStatusMessage('受信設定を保存しました。')
    } catch (error) {
      setStatusMessage(String(error))
    }
  }

  const handleManualSync = async () => {
    try {
      setStatusMessage('同期中...')
      const res = await fetch(buildApiUrl('manualSync'))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '同期に失敗しました')
      setEmails(transformThreadsToEmails(data.threads || []))
      setStatusMessage(`手動同期完了（${data.count ?? 0} 件）`)
    } catch (error) {
      setStatusMessage(String(error))
    }
  }

  const handleTranslate = () => {
    if (!selectedEmail?.body) {
      setStatusMessage('翻訳するメール本文が見つかりません。')
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setTranslation(
        '【日本語訳（ダミー）】\n' + selectedEmail.body.replace(/\n\n/g, '\n')
      )
      setStatusMessage('日本語訳を生成しました。（ダミー表示）')
      setIsProcessing(false)
    }, 600)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDropActive(false)
    const files = Array.from(event.dataTransfer.files)
    if (!files.length) {
      setStatusMessage('対応可能なファイルが見つかりませんでした。')
      return
    }
    const fileNames = files.map((file) => file.name).join(', ')
    setStatusMessage(`メールファイルを受信しました: ${fileNames}（解析は今後実装予定）`)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isDropActive) {
      setIsDropActive(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDropActive(false)
  }

  const handleSummarize = () => {
    if (!selectedEmail?.body) {
      setStatusMessage('要約するメール本文が見つかりません。')
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setSummary(
        '【要約（ダミー）】\n' +
          '・請求書払いへの変更可否\n' +
          '・追加ユーザー2名分の料金確認\n' +
          '・申請書手順の案内が必要'
      )
      setStatusMessage('要約を生成しました。（ダミー表示）')
      setIsProcessing(false)
    }, 600)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="branding">
          <div className="logo-dot" aria-hidden />
          <span className="product-name">AI Auto Mail System</span>
        </div>
        <div className="header-controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoSend}
              onChange={(event) => setAutoSend(event.target.checked)}
            />
            <span className="toggle-indicator" aria-hidden />
            <span className="toggle-label">自動送信モード</span>
          </label>
          <button
            type="button"
            className="secondary"
            onClick={() => setIsSettingsOpen(true)}
          >
            システム設定
          </button>
          <Link to="/admin" className="admin-link">
            Admin
          </Link>
        </div>
      </header>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          受信メール
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          受信設定
        </button>
      </div>

      {activeTab === 'inbox' ? (
        <main className="content inbox-view">
          <section className="panel inbox-panel">
            <header className="inbox-header">
              <div className="inbox-header-group">
                <h2>受信メール一覧</h2>
                <span className="timestamp">最新 {emails[0]?.receivedAt}</span>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={handleManualSync}
              >
                手動同期
              </button>
            </header>
            <div
              className={`inbox-dropzone ${isDropActive ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p>メール（.eml / .msg / .pdf）をここにドロップして解析</p>
              <span>自動転送に加えて、単発のメールをアップロードして処理する場合に利用します。</span>
            </div>
            <div className="email-list">
              {emails.map((mail) => (
                <button
                  key={mail.id}
                  type="button"
                  className={`email-item ${mail.id === selectedEmailId ? 'active' : ''}`}
                  onClick={() => handleSelectEmail(mail.id)}
                >
                  <div className="email-item-header">
                    <p className="email-item-subject">{mail.subject}</p>
                    <span>{mail.receivedAt}</span>
                  </div>
                  <p className="email-item-preview">{mail.preview}</p>
                  <p className="email-item-sender">{mail.sender}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel draft-panel">
            <header>
              <div>
                <h2>AI 返信</h2>
                <p className="description">
                  選択したメールの内容を確認し、返信案を編集して承認してください。
                </p>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(composedDraft)
                      .then(() => setStatusMessage('返信文をコピーしました。'))
                      .catch(() => setStatusMessage('コピーに失敗しました。'))
                  }}
                  disabled={!draft.trim()}
                >
                  コピー
                </button>
                <button type="button" className="ghost" onClick={handleRegenerate}>
                  再生成
                </button>
              </div>
            </header>

            <textarea
              className="draft-editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="返信ドラフト本文"
            />

            <div className="preview-block">
              <div className="preview-header">
                <h3>送信時プレビュー</h3>
                <div className="toggle-stack">
                  <label className="toggle compact-toggle">
                    <input
                      type="checkbox"
                      checked={useName}
                      onChange={(event) => setUseName(event.target.checked)}
                    />
                    <span className="toggle-indicator" aria-hidden />
                    <span className="toggle-label">氏名を反映</span>
                  </label>
                  <label className="toggle compact-toggle">
                    <input
                      type="checkbox"
                      checked={useSignature}
                      onChange={(event) => setUseSignature(event.target.checked)}
                    />
                    <span className="toggle-indicator" aria-hidden />
                    <span className="toggle-label">署名を反映</span>
                  </label>
                </div>
              </div>
              <pre>{composedDraft}</pre>
            </div>

            <footer className="actions">
              <div className="status-message" aria-live="polite">
                {statusMessage}
              </div>
              <div className="button-row">
                <button type="button" className="ghost">
                  ドラフト保存
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={handleApprove}
                  disabled={isSending}
                >
                  {isSending ? '送信処理中…' : '送信'}
                </button>
              </div>
            </footer>
          </section>
        </main>
      ) : (
        <main className="content settings-view">
          <section className="panel inbound-panel">
            <header>
              <div>
                <h2>受信設定</h2>
                <p className="description">
                  メール転送や接続に必要な情報を入力してください。保存すると Admin 管理のスプレッドシートへ反映する想定です。
                </p>
              </div>
            </header>

            <div className="settings-grid">
              <label className="field">
                <span>メールプロバイダ</span>
                <select
                  value={inboundSettings.provider}
                  onChange={(event) => handleInboundSettingChange('provider', event.target.value)}
                >
                  <option value="Google Workspace">Google Workspace (Gmail)</option>
                  <option value="Microsoft 365">Microsoft 365 (Exchange)</option>
                  <option value="Xserver">Xserver</option>
                  <option value="Custom IMAP/SMTP">その他 IMAP / SMTP</option>
                </select>
              </label>
              <label className="field">
                <span>転送先メールアドレス</span>
                <input
                  type="email"
                  value={inboundSettings.forwardingAddress}
                  onChange={(event) =>
                    handleInboundSettingChange('forwardingAddress', event.target.value)
                  }
                />
                <small>問い合わせメールを転送する先（例: info@company.co.jp）。</small>
              </label>
              <label className="field">
                <span>IMAP ユーザー名</span>
                <input
                  type="text"
                  value={inboundSettings.mailboxUser}
                  onChange={(event) =>
                    handleInboundSettingChange('mailboxUser', event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>IMAP ホスト</span>
                <input
                  type="text"
                  value={inboundSettings.imapHost}
                  onChange={(event) => handleInboundSettingChange('imapHost', event.target.value)}
                  placeholder="imap.example.com"
                />
              </label>
              <label className="field">
                <span>IMAP ポート</span>
                <input
                  type="text"
                  value={inboundSettings.imapPort}
                  onChange={(event) => handleInboundSettingChange('imapPort', event.target.value)}
                  placeholder="993"
                />
              </label>
              <label className="field">
                <span>暗号化方式</span>
                <select
                  value={inboundSettings.encryption}
                  onChange={(event) => handleInboundSettingChange('encryption', event.target.value)}
                >
                  <option value="SSL/TLS">SSL/TLS</option>
                  <option value="STARTTLS">STARTTLS</option>
                  <option value="None">なし</option>
                </select>
              </label>
              <label className="field field-wide">
                <span>転送ルール・備考</span>
                <textarea
                  rows={3}
                  value={inboundSettings.forwardingNote}
                  onChange={(event) =>
                    handleInboundSettingChange('forwardingNote', event.target.value)
                  }
                />
                <small>例: 「info@→INFO_INBOX ラベル」「自動返信をオフにする」などの運用メモ。</small>
              </label>
              <label className="field field-wide">
                <span>接続に関する補足</span>
                <textarea
                  rows={3}
                  value={inboundSettings.mailboxNote}
                  onChange={(event) =>
                    handleInboundSettingChange('mailboxNote', event.target.value)
                  }
                />
              </label>
            </div>

            <div className="settings-actions">
              <div className="status-message" aria-live="polite">
                {statusMessage}
              </div>
              <button type="button" className="primary" onClick={handleInboundSave}>
                受信設定を保存
              </button>
            </div>
          </section>
        </main>
      )}

      {isPreviewOpen && selectedEmail && (
        <div className="preview-floating" role="dialog" aria-modal="false">
          <header className="preview-header-bar">
            <div>
              <h3>{selectedEmail.subject}</h3>
              <p className="email-meta">
                {selectedEmail.sender} ｜ {selectedEmail.receivedAt}
              </p>
            </div>
            <div className="detail-actions">
              <button
                type="button"
                className="ghost"
                onClick={handleTranslate}
                disabled={isProcessing}
              >
                翻訳
              </button>
              <button
                type="button"
                className="ghost"
                onClick={handleSummarize}
                disabled={isProcessing}
              >
                要約
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="プレビューを閉じる"
              >
                ×
              </button>
            </div>
          </header>
          <div className="preview-body">
            <pre className="email-body">{selectedEmail.body}</pre>
            {(translation || summary) && (
              <div className="analysis-panel">
                {translation && (
                  <section>
                    <h4>日本語訳</h4>
                    <pre>{translation}</pre>
                  </section>
                )}
                {summary && (
                  <section>
                    <h4>要約</h4>
                    <pre>{summary}</pre>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>承認後は Gmail の下書き / スプレッドシート「Pending」に即時反映されます。</p>
      </footer>

      {isSettingsOpen && (
        <div className="settings-overlay" role="dialog" aria-modal="true">
          <div className="settings-panel">
            <header>
              <div>
                <h2>システム設定</h2>
                <p className="description">
                  ナレッジソースや API キーなど、AI 自動返信に必要な項目を管理します。
                </p>
              </div>
              <button
                type="button"
                className="ghost close-button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="設定パネルを閉じる"
              >
                閉じる
              </button>
            </header>

            <section className="settings-section">
              <h3>参照ナレッジ</h3>
              <label className="field">
                <span>スプレッドシートリンク / ID</span>
                <input
                  type="text"
                  value={knowledgeSource}
                  onChange={(event) => setKnowledgeSource(event.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <small>
                  読み取り権限のある URL もしくはスプレッドシート ID を入力してください。
                </small>
              </label>
              <div className="dropzone" role="button" tabIndex={0}>
                <p>参考メールをここにドラッグ＆ドロップ</p>
                <span>eml / msg / pdf 対応。最大 15 ファイル。</span>
                <button type="button" className="ghost small">ファイルを選択</button>
              </div>
            </section>

            <section className="settings-section">
              <h3>AI 設定</h3>
              <label className="field">
                <span>出力言語</span>
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as 'ja' | 'en' | 'zh' | 'custom')
                  }
                >
                  <option value="ja">日本語</option>
                  <option value="en">英語</option>
                  <option value="zh">中国語</option>
                  <option value="custom">カスタム</option>
                </select>
                {language === 'custom' && (
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={(event) => setCustomLanguage(event.target.value)}
                    placeholder="例: Spanish, Deutsch など"
                    className="custom-language-input"
                  />
                )}
                <small>
                  AI が返信文を生成する言語です。カスタムを選んだ場合は言語名を指定してください。
                </small>
              </label>
            </section>

            <section className="settings-section">
              <h3>プロフィール設定</h3>
              <label className="field">
                <span>氏名</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="担当者名を入力"
                />
              </label>
              <label className="field">
                <span>署名</span>
                <textarea
                  value={profileSignature}
                  onChange={(event) => setProfileSignature(event.target.value)}
                  placeholder="署名を入力"
                  rows={4}
                />
              </label>
              <label className="toggle inline-toggle">
                <input
                  type="checkbox"
                  checked={useName}
                  onChange={(event) => setUseName(event.target.checked)}
                />
                <span className="toggle-indicator" aria-hidden />
                <span className="toggle-label">返信に氏名を反映する</span>
              </label>
              <label className="toggle inline-toggle">
                <input
                  type="checkbox"
                  checked={useSignature}
                  onChange={(event) => setUseSignature(event.target.checked)}
                />
                <span className="toggle-indicator" aria-hidden />
                <span className="toggle-label">返信に署名を反映する</span>
              </label>
            </section>

            <section className="settings-section">
              <h3>通知設定</h3>
              <label className="field">
                <span>承認通知メールアドレス</span>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(event) => setAlertEmail(event.target.value)}
                  placeholder="support@example.com"
                />
                <small>承認待ちの通知や失敗時のアラート送付先。</small>
              </label>
            </section>

            <footer className="settings-actions">
              <button type="button" className="ghost">下書き保存</button>
              <button type="button" className="primary" onClick={handleSaveSettings}>
                設定を更新
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

function transformThreadsToEmails(threads: any[]): EmailThread[] {
  return threads.map((thread) => ({
    id: String(thread.id ?? Math.random().toString(36).slice(2)),
    subject: thread.subject || '',
    sender: thread.sender || '',
    receivedAt: thread.date ? new Date(thread.date).toLocaleString('ja-JP') : '',
    preview: thread.snippet || '',
    body: thread.body || thread.snippet || ''
  }))
}
