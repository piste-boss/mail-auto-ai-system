import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

function App() {
  const inquiry = useMemo(
    () => ({
      subject: '【お問い合わせ】プレミアムプランの契約更新について',
      sender: '山田 太郎 <taro@example.com>',
      receivedAt: '2024-05-18 10:32',
      body: `プレミアムプランを利用している山田です。更新のタイミングで請求書払いへ変更したいのですが可能でしょうか？\n\nまた、追加ユーザーを2名分増やした場合の料金も教えてください。`
    }),
    []
  )

  const knowledgeSnippets = useMemo(
    () => [
      {
        title: '請求書払いの可否',
        content: '法人契約での継続利用に限り、次回更新から請求書払いへ変更できます。変更には社判済みの申請書が必要です。'
      },
      {
        title: 'プレミアムプラン料金',
        content: '基本料金: 39,800円/月。追加ユーザーは1人あたり 5,500円/月（税別）。'
      },
      {
        title: '対応トーン',
        content: '既存顧客には丁寧かつ前向きなトーンで、対応ステップを箇条書きで示す。'
      }
    ],
    []
  )

  const initialDraft = `山田 太郎 様

いつもご利用いただきありがとうございます。サポートの石川でございます。

プレミアムプランのご契約更新に際し、請求書払いへの変更は可能でございます。お手数ですが、下記2点をご確認ください。
・社判済みの請求書払い申請書をご提出ください（PDF 添付可）
・次回更新日の5営業日前までにご返送ください

また追加ユーザーについては、2名追加の場合 +11,000円/月（税別）となり、合計 50,800円/月 でご案内可能です。

申請書式を添付しておりますので、ご記入後に本メールへご返信いただけますと幸いです。ご不明点があれば何なりとお申し付けください。

引き続きよろしくお願いいたします。`

  const [draft, setDraft] = useState(initialDraft)
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

  const handleApprove = () => {
    setIsSending(true)
    setStatusMessage('')
    window.setTimeout(() => {
      setStatusMessage(autoSend ? '自動送信モードで送信キューへ登録しました。' : '送信承認が完了しました。')
      setIsSending(false)
    }, 650)
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

      <main className="content">
        <section className="panel inquiry-panel">
          <header>
            <h2>受信メール</h2>
            <span className="timestamp">{inquiry.receivedAt}</span>
          </header>
          <div className="inquiry-meta">
            <div>
              <span className="label">件名</span>
              <p>{inquiry.subject}</p>
            </div>
            <div>
              <span className="label">差出人</span>
              <p>{inquiry.sender}</p>
            </div>
          </div>
          <pre className="inquiry-body">{inquiry.body}</pre>

          <div className="knowledge">
            <h3>参照ナレッジ</h3>
            <ul>
              {knowledgeSnippets.map((snippet) => (
                <li key={snippet.title}>
                  <strong>{snippet.title}</strong>
                  <p>{snippet.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel draft-panel">
          <header>
            <div>
              <h2>AI 下書き</h2>
              <p className="description">必要に応じて編集した後、送信承認してください。</p>
            </div>
            <button type="button" className="ghost" onClick={handleRegenerate}>
              再生成
            </button>
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
                {isSending ? '送信処理中…' : autoSend ? '承認して自動送信へ' : '送信承認'}
              </button>
            </div>
          </footer>
        </section>
      </main>

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
