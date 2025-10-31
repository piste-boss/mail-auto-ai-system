import { useState } from 'react'
import { API_BASE_URL } from './config';
import { Link } from 'react-router-dom'
import './Admin.css'

type UserAccount = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  role: string
}

type EditableUserFields = Omit<UserAccount, 'id'>

const defaultPrompt = `You are an AI support assistant for AI Auto Mail System.
- Always produce polite, empathetic business email responses.
- Reference knowledge snippets provided in the context with bullet points.
- Preserve important numbers, prices, deadlines, and policy names.
- When information is missing, flag the gap and request clarification instead of guessing.`

function Admin() {
  const [geminiKey, setGeminiKey] = useState('AIza...')
  const [autoSendThreshold, setAutoSendThreshold] = useState(0.78)
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt)
  const [fallbackPrompt, setFallbackPrompt] = useState(
    'If the model confidence is low, generate a short acknowledgement asking a human operator to follow up.'
  )
  const [userSheetLink, setUserSheetLink] = useState(
    'https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxx'
  )
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([
    {
      id: 'user-1',
      name: '石川 すぐる',
      email: 'support@example.com',
      phone: '03-1234-5678',
      address: '東京都港区北青山1-1-1',
      role: 'オペレーター'
    }
  ])
  const [newUser, setNewUser] = useState<EditableUserFields>({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'オペレーター'
  })
  const [status, setStatus] = useState('')

  const buildApiUrl = (action: string) =>
    `${API_BASE_URL}?action=${action}&origin=${encodeURIComponent(window.location.origin)}`

  const updateUserField = <K extends keyof EditableUserFields>(
    id: string,
    field: K,
    value: EditableUserFields[K]
  ) => {
    setUserAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, [field]: value } : account
      )
    )
  }

  const removeUser = (id: string) => {
    setUserAccounts((prev) => prev.filter((account) => account.id !== id))
    setStatus('ユーザーを削除しました。')
  }

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setStatus('氏名とメールアドレスは必須です。')
      return
    }
    const newAccount: UserAccount = {
      id: `user-${Date.now()}`,
      ...newUser
    }
    setUserAccounts((prev) => [...prev, newAccount])
    setNewUser({
      name: '',
      email: '',
      phone: '',
      address: '',
      role: 'オペレーター'
    })
    setStatus('ユーザーを追加しました。')
  }

  const handleSave = async () => {
    try {
      setStatus('保存中...')
      const payload = {
        userSheetLink,
        accounts: userAccounts,
        geminiKey,
        autoSendThreshold,
        systemPrompt,
        fallbackPrompt
      }

      const res = await fetch(buildApiUrl('saveSettings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '保存に失敗しました')
      setStatus('管理設定を保存しました。')
    } catch (error) {
      setStatus(String(error))
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-branding">
          <div className="logo-dot" aria-hidden />
          <div>
            <p className="admin-title">AI Auto Mail System</p>
            <h1>Admin Console</h1>
          </div>
        </div>
        <Link to="/" className="back-link">
          ← 運用画面へ戻る
        </Link>
      </header>

      <main className="admin-content">
        <section className="admin-card">
          <h2>Gemini API 設定</h2>
          <label className="admin-field">
            <span>Gemini API キー</span>
            <input
              type="password"
              value={geminiKey}
              onChange={(event) => setGeminiKey(event.target.value)}
              placeholder="AIza..."
            />
          </label>
          <label className="admin-field">
            <span>自動送信の信頼度しきい値</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={autoSendThreshold}
              onChange={(event) => setAutoSendThreshold(Number(event.target.value))}
            />
            <small>値を超えたドラフトのみ自動送信モードへ流します。</small>
          </label>
        </section>

        <section className="admin-card">
          <h2>ユーザー管理</h2>
          <label className="admin-field">
            <span>ユーザーデータ保存用スプレッドシート</span>
            <input
              type="text"
              value={userSheetLink}
              onChange={(event) => setUserSheetLink(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <small>アカウント情報（氏名・メール・電話・住所）を保管するスプレッドシートの URL または ID。</small>
          </label>

          <div className="accounts-list">
            {userAccounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-grid">
                  <label className="admin-field">
                    <span>氏名</span>
                    <input
                      type="text"
                      value={account.name}
                      onChange={(event) =>
                        updateUserField(account.id, 'name', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>メールアドレス</span>
                    <input
                      type="email"
                      value={account.email}
                      onChange={(event) =>
                        updateUserField(account.id, 'email', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>電話番号</span>
                    <input
                      type="tel"
                      value={account.phone}
                      onChange={(event) =>
                        updateUserField(account.id, 'phone', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>住所</span>
                    <input
                      type="text"
                      value={account.address}
                      onChange={(event) =>
                        updateUserField(account.id, 'address', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>役割</span>
                    <input
                      type="text"
                      value={account.role}
                      onChange={(event) =>
                        updateUserField(account.id, 'role', event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="account-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => removeUser(account.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            {userAccounts.length === 0 && (
              <p className="empty-state">登録済みのユーザーはまだありません。</p>
            )}
          </div>

          <div className="new-account">
            <h3>アカウント追加</h3>
            <div className="account-grid">
              <label className="admin-field">
                <span>氏名</span>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>メールアドレス</span>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>電話番号</span>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>住所</span>
                <input
                  type="text"
                  value={newUser.address}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, address: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>役割</span>
                <input
                  type="text"
                  value={newUser.role}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                />
              </label>
            </div>
            <button type="button" className="primary add-account" onClick={handleAddUser}>
              アカウントを追加
            </button>
          </div>
        </section>

        <section className="admin-card">
          <h2>プロンプト管理</h2>
          <label className="admin-field">
            <span>システムプロンプト</span>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={10}
            />
            <small>全返信に共通するルールやトーンを記載します。</small>
          </label>
          <label className="admin-field">
            <span>フォールバックプロンプト</span>
            <textarea
              value={fallbackPrompt}
              onChange={(event) => setFallbackPrompt(event.target.value)}
              rows={6}
            />
            <small>低信頼時やナレッジ欠如時に利用する代替プロンプト。</small>
          </label>
        </section>
      </main>

      <footer className="admin-footer">
        <div className="status" aria-live="polite">
          {status}
        </div>
        <button type="button" className="primary" onClick={handleSave}>
          設定を保存
        </button>
      </footer>
    </div>
  )
}

export default Admin
